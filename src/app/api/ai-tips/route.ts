import { NextResponse } from 'next/server';

type TipsRequest = {
	topic: string; // np. "movies"; w przyszłości inne kategorie
	mode: 'match' | 'blind' | 'none';
	categoryLabel?: string | null;
	viewLabel?: string | null;
	waitingForPartner?: boolean;
	isReady?: boolean;
	currentTitle?: string | null;
	leftTitle?: string | null;
	rightTitle?: string | null;
	leftDescription?: string | null;
	rightDescription?: string | null;
	// Jeśli true, pomiń cache i wygeneruj nową odpowiedź.
	fresh?: boolean;
};

const CACHE_TTL_MS = 90_000;
const cache = new Map<string, { text: string; at: number }>();

function truncate(text: string | null | undefined, maxChars: number): string | null {
	if (!text) return null;
	const t = text.trim();
	if (t.length <= maxChars) return t;
	return `${t.slice(0, maxChars - 1)}…`;
}

function normalizeKey(body: TipsRequest): string {
	return JSON.stringify({
		topic: body.topic,
		mode: body.mode,
		categoryLabel: body.categoryLabel ?? null,
		viewLabel: body.viewLabel ?? null,
		waitingForPartner: Boolean(body.waitingForPartner),
		isReady: Boolean(body.isReady),
		currentTitle: body.currentTitle ?? null,
		leftTitle: body.leftTitle ?? null,
		rightTitle: body.rightTitle ?? null,
		leftDescription: body.leftDescription ?? null,
		rightDescription: body.rightDescription ?? null,
	});
}

export async function POST(req: Request) {
	const apiKey = process.env.GROQ_API_KEY;
	if (!apiKey) {
		return NextResponse.json(
			{ error: 'Brak konfiguracji GROQ_API_KEY w zmiennych środowiskowych.' },
			{ status: 500 }
		);
	}

	let body: TipsRequest;
	try {
		body = (await req.json()) as TipsRequest;
	} catch {
		return NextResponse.json({ error: 'Nieprawidłowe JSON.' }, { status: 400 });
	}

	if (!body || typeof body.topic !== 'string' || typeof body.mode !== 'string') {
		return NextResponse.json({ error: 'Nieprawidłowe dane wejściowe.' }, { status: 400 });
	}

	const key = normalizeKey(body);
	if (!body.fresh) {
		const hit = cache.get(key);
		if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
			return NextResponse.json({ tips: hit.text, cached: true });
		}
	}

	// Z docs Groq: dla chat jako przykład/wyższa jakość często sprawdza się 70B "versatile".
	const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

	const topic = body.topic === 'words' ? 'words' : 'movies';
	const topicHint =
		topic === 'movies'
			? 'Filmy i aktywności/"lifehacki" związane z randką wokół filmu.'
			: 'Hasła (pary słów) i zabawy/rozmowy wokół nich.';

	const modeHint = body.mode === 'blind'
		? 'Tryb: Randka w ciemno (dwie propozycje do wyboru w rundach).'
		: body.mode === 'match'
			? 'Tryb: Pierwszy match (Tinder-style, wybory na kartach).'
			: 'Tryb: wybór/ekran startowy.';

	const categoryHint = body.categoryLabel ? `Kategoria/klimat: ${body.categoryLabel}.` : '';
	const viewHint = body.viewLabel ? `Bieżący widok: ${body.viewLabel}.` : '';
	const readinessHint = body.isReady ? 'Są 2 osoby w pokoju.' : 'Może być 1 osoba w pokoju.';
	const waitingHint = body.waitingForPartner ? 'Użytkownik czeka na drugą osobę.' : '';

	const currentHint = body.currentTitle ? `Aktualnie oglądana karta: ${body.currentTitle}.` : '';
	const pairHint =
		body.leftTitle && body.rightTitle
			? `Aktualna para do wyboru: "${body.leftTitle}" oraz "${body.rightTitle}".`
			: '';
	const leftDesc = truncate(body.leftDescription, 600);
	const rightDesc = truncate(body.rightDescription, 600);
	const pairDescHint =
		topic === 'movies' && (leftDesc || rightDesc)
			? [
					'Opis filmu A (jeśli jest):',
					leftDesc ?? '—',
					'Opis filmu B (jeśli jest):',
					rightDesc ?? '—',
			  ].join(' ')
			: '';

	const base = [
		modeHint,
		categoryHint,
		viewHint,
		readinessHint,
		waitingHint,
		currentHint,
		pairHint,
		pairDescHint,
		topicHint,
		'',
		'Napisz 6–8 zdań po polsku (bez list, bez nagłówków).',
		'Każde zdanie ma wnosić konkretny pomysł (bez banałów typu "spędźcie czas razem").',
		'Jeśli podana jest para tytułów, pomóż wybrać: porównuj je WYŁĄCZNIE po tytułach (bez "lewa/prawa"). Użyj konstrukcji: "Jeśli macie ochotę na X, wybierzcie \"TYTUŁ\"; jeśli na Y, wybierzcie \"TYTUŁ\"."',
		'Unikaj medycznych/terapeutycznych porad, polityki i treści NSFW. Nie używaj emoji.',
	];

	const prompt =
		topic === 'movies'
			? [
					...base,
					'Jeśli podane są opisy filmów, wpleć co najmniej 2 konkretne elementy z opisów (motyw/setting/konflikt/relacja/klimat) i na ich bazie zaproponuj aktywność lub pytanie do rozmowy.',
					'Uwzględnij 1–2 "lifehacki" okołofilmowe (np. minigra podczas seansu, rytuał przed/po, snack hack, krótkie wyzwanie po scenie), ale dopasuj do klimatu z opisu.',
			  ].join(' ')
			: [
					...base,
					'Traktuj tytuły jako hasła do rozmowy i zabawy: zaproponuj 2–3 lekkie mini-rytuały/gry konwersacyjne na randkę (bez punktów i bez list), które wykorzystują znaczenie tych słów.',
					'Zaproponuj jedno krótkie pytanie na rozgrzewkę i jedno „wyzwanie” (bez ryzyka i bez wstydu), oba wplecione w zwykłe zdania.',
			  ].join(' ');

	try {
		const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model,
				temperature: 0.95,
				top_p: 0.95,
				max_completion_tokens: 360,
				messages: [
					{
						role: 'system',
						content:
							'Jesteś pomocnym asystentem randkowym. Dajesz zwięzłe, praktyczne wskazówki. Odpowiadasz po polsku.',
					},
					{ role: 'user', content: prompt },
				],
			}),
		});

		const data = (await res.json()) as {
			error?: { message?: string };
			choices?: Array<{ message?: { content?: string } }>;
		};

		if (!res.ok) {
			const msg = data.error?.message || 'Błąd Groq.';
			return NextResponse.json({ error: msg }, { status: 502 });
		}

		const text = data.choices?.[0]?.message?.content?.trim();
		if (!text) {
			return NextResponse.json({ error: 'Pusta odpowiedź z Groq.' }, { status: 502 });
		}

		cache.set(key, { text, at: Date.now() });
		return NextResponse.json({ tips: text, cached: false });
	} catch {
		return NextResponse.json({ error: 'Nie udało się pobrać porad AI.' }, { status: 502 });
	}
}
