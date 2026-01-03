import { NextResponse } from 'next/server';

type TipsRequest = {
	topic: string; // np. "movies"; w przyszłości inne kategorie
	mode: 'match' | 'blind' | 'quiz' | 'none';
	categoryLabel?: string | null;
	viewLabel?: string | null;
	waitingForPartner?: boolean;
	isReady?: boolean;
	participantsCount?: number;
	maxParticipants?: number;
	currentTitle?: string | null;
	leftTitle?: string | null;
	rightTitle?: string | null;
	leftDescription?: string | null;
	rightDescription?: string | null;
	quizPackLabel?: string | null;
	quizStatus?: 'in_progress' | 'completed' | null;
	quizProgress?: string | null;
	quizQuestionPrompt?: string | null;
	quizSolo?: boolean;
	quizAgreementPercent?: number | null;
	// Jeśli true, pomiń cache i wygeneruj nową odpowiedź.
	fresh?: boolean;
};

const CACHE_TTL_MS = 90_000;
const cache = new Map<string, { text: string; at: number }>();

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(args: {
	message?: string | null;
	retryAfterHeader?: string | null;
}): number | null {
	const { message, retryAfterHeader } = args;

	// 1) Najpierw standardowy header Retry-After (sekundy lub data)
	if (retryAfterHeader) {
		const asSeconds = Number(retryAfterHeader);
		if (Number.isFinite(asSeconds) && asSeconds >= 0) return Math.ceil(asSeconds * 1000);

		const asDate = Date.parse(retryAfterHeader);
		if (!Number.isNaN(asDate)) {
			const delta = asDate - Date.now();
			return delta > 0 ? delta : 0;
		}
	}

	// 2) Groq czasem zwraca w treści: "Please try again in 659.999999ms"
	if (message) {
		const m = /try again in\s*([\d.]+)\s*ms/i.exec(message);
		if (m?.[1]) {
			const parsed = Number(m[1]);
			if (Number.isFinite(parsed) && parsed >= 0) return Math.ceil(parsed);
		}
	}

	return null;
}

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
		participantsCount: typeof body.participantsCount === 'number' ? body.participantsCount : null,
		maxParticipants: typeof body.maxParticipants === 'number' ? body.maxParticipants : null,
		currentTitle: body.currentTitle ?? null,
		leftTitle: body.leftTitle ?? null,
		rightTitle: body.rightTitle ?? null,
		leftDescription: body.leftDescription ?? null,
		rightDescription: body.rightDescription ?? null,
		quizPackLabel: body.quizPackLabel ?? null,
		quizStatus: body.quizStatus ?? null,
		quizProgress: body.quizProgress ?? null,
		quizQuestionPrompt: body.quizQuestionPrompt ?? null,
		quizSolo: Boolean(body.quizSolo),
		quizAgreementPercent: typeof body.quizAgreementPercent === 'number' ? body.quizAgreementPercent : null,
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

	const topic =
		body.mode === 'none' || body.topic === 'modes'
			? 'modes'
			: body.topic === 'words'
				? 'words'
				: body.topic === 'quiz'
					? 'quiz'
					: 'movies';
	const topicHint =
		topic === 'modes'
			? 'Ekran startowy: pomoc w wyborze najlepszego trybu w aplikacji.'
			: topic === 'movies'
				? 'Filmy i aktywności/"lifehacki" związane z randką wokół filmu.'
				: topic === 'words'
					? 'Hasła (pary słów) i zabawy/rozmowy wokół nich.'
					: 'Quiz "Gusta" (styl/wybory/kompromisy) i praktyczne wnioski po teście.';

	const modeHint =
		body.mode === 'blind'
			? 'Tryb: Randka w ciemno (dwie propozycje do wyboru w rundach).'
			: body.mode === 'match'
				? 'Tryb: Pierwszy match (wybieranie filmu na kartach; pierwszy wspólny wybór wygrywa).'
				: body.mode === 'quiz'
					? 'Tryb: Gusta (quiz + wyniki na osiach).'
					: 'Tryb: wybór/ekran startowy.';

	const categoryHint = body.categoryLabel ? `Kategoria/klimat: ${body.categoryLabel}.` : '';
	const viewHint = body.viewLabel ? `Bieżący widok: ${body.viewLabel}.` : '';
	const participantsHint =
		typeof body.participantsCount === 'number' && typeof body.maxParticipants === 'number'
			? `Uczestnicy: ${body.participantsCount}/${body.maxParticipants}.`
			: '';
	const readinessHint = body.isReady ? 'Warunek startu spełniony.' : 'Warunek startu może nie być spełniony.';
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

	const quizPackHint = body.quizPackLabel ? `Pakiet: ${body.quizPackLabel}.` : '';
	const quizStatusHint = body.quizStatus ? `Status quizu: ${body.quizStatus}.` : '';
	const quizProgressHint = body.quizProgress ? `Postęp: ${body.quizProgress}.` : '';
	const quizQuestionHint = truncate(body.quizQuestionPrompt, 420)
		? `Bieżące pytanie: ${truncate(body.quizQuestionPrompt, 420)}.`
		: '';
	const quizSoloHint = body.quizSolo ? 'Wariant: Solo.' : 'Wariant: Dla par.';
	const quizAgreementHint =
		typeof body.quizAgreementPercent === 'number' ? `Zgodność: ${body.quizAgreementPercent}%.` : '';

	const baseCommon = [
		modeHint,
		categoryHint,
		viewHint,
		participantsHint,
		readinessHint,
		waitingHint,
		currentHint,
		pairHint,
		pairDescHint,
		body.mode === 'quiz' || topic === 'quiz'
			? [quizPackHint, quizSoloHint, quizStatusHint, quizProgressHint, quizAgreementHint, quizQuestionHint].filter(Boolean).join(' ')
			: '',
		topicHint,
		'',
		'Napisz 6–8 zdań po polsku (bez list, bez nagłówków).',
		'Każde zdanie ma wnosić konkretny pomysł (bez banałów typu "spędźcie czas razem").',
		'Nie wymyślaj szczegółów ani nazw własnych, których nie ma w kontekście.',
		'Unikaj medycznych/terapeutycznych porad, polityki i treści NSFW. Nie używaj emoji.',
	];

	const moviesRules = [
		'Mów o wyborze filmu i wspólnej decyzji — nie o "kandydatach" ani "poznawaniu kogoś nowego".',
		'Nie wymyślaj tytułów filmów ani faktów o filmach, których nie ma w kontekście.',
		'Jeśli w kontekście nie ma podanych tytułów, nie proponuj konkretnych filmów z nazwami.',
		'Jeśli podana jest para tytułów, pomóż wybrać: porównuj je WYŁĄCZNIE po tytułach (bez "lewa/prawa"). Użyj konstrukcji: "Jeśli macie ochotę na X, wybierzcie \"TYTUŁ\"; jeśli na Y, wybierzcie \"TYTUŁ\"."',
	];

	const prompt =
		topic === 'modes'
			? [
					...baseCommon,
					'Zamiast polecać filmy, doradź jaki tryb wybrać i dlaczego, bazując na tym co widać w kontekście (tryb startowy).',
					'Opisz krótko 3 tryby: Pierwszy match (wybieracie filmy na kartach; gdy oboje dacie TAK na ten sam tytuł, pierwszy taki wspólny wybór zostaje wynikiem), Randka w ciemno (wybór między dwoma filmami w rundach), Gusta (quiz o preferencjach + osie i podsumowanie).',
					'Jeśli użytkownik jest sam: zasugeruj Gusta w wariancie Solo; jeśli są dwie osoby na dwóch urządzeniach: wybór zależy od celu i nastroju.',
					'Zakończ jednym zdaniem: co kliknąć teraz (np. wybierz tryb u góry i naciśnij „Utwórz pokój”; albo dla Solo: wybierz Gusta → Solo → Utwórz pokój).',
			  ].join(' ')
			: topic === 'quiz'
			? [
					...baseCommon,
					'Skup się WYŁĄCZNIE na quizie „Gusta” i na bieżącym pytaniu (jeśli jest w kontekście).',
					'Nie wspominaj o filmach, seansie, tytułach, trybach filmowych ani o wybieraniu filmu — to nie jest odpowiedź na to pytanie.',
					'Daj wskazówki jak przejść przez pytanie (jeśli jest), jak rozmawiać o rozbieżnościach i jak przekuć wynik w 1–2 małe decyzje na dziś.',
					'Jeśli wariant Solo: skup się na auto-wnioskach i prostych zasadach wyboru (np. budżet, priorytety, veto, test 24h).',
					'Jeśli wariant Dla par i quiz jest zakończony: zaproponuj 2 konkretne reguły kompromisu oparte o różnice.',
			  ].join(' ')
			: topic === 'movies'
			? [
					...baseCommon,
					...moviesRules,
					'Jeśli podane są opisy filmów, wpleć co najmniej 2 konkretne elementy z opisów (motyw/setting/konflikt/relacja/klimat) i na ich bazie zaproponuj aktywność lub pytanie do rozmowy.',
					'Uwzględnij 1–2 "lifehacki" okołofilmowe (np. minigra podczas seansu, rytuał przed/po, snack hack, krótkie wyzwanie po scenie), ale dopasuj do klimatu z opisu.',
			  ].join(' ')
			: [
					...baseCommon,
					'Traktuj tytuły jako hasła do rozmowy i zabawy: zaproponuj 2–3 lekkie mini-rytuały/gry konwersacyjne na randkę (bez punktów i bez list), które wykorzystują znaczenie tych słów.',
					'Zaproponuj jedno krótkie pytanie na rozgrzewkę i jedno „wyzwanie” (bez ryzyka i bez wstydu), oba wplecione w zwykłe zdania.',
			  ].join(' ');

	try {
		const url = 'https://api.groq.com/openai/v1/chat/completions';
		const payload = {
			model,
			temperature: topic === 'quiz' ? 0.7 : 0.95,
			top_p: topic === 'quiz' ? 0.9 : 0.95,
			max_completion_tokens: 360,
			messages: [
				{
					role: 'system',
					content:
						'Jesteś pomocnym asystentem randkowym. Dajesz zwięzłe, praktyczne wskazówki. Odpowiadasz po polsku.',
				},
				{ role: 'user', content: prompt },
			],
		};

		let lastErrorMessage: string | null = null;
		let lastRetryAfterMs: number | null = null;
		let lastStatus: number | null = null;

		// Retry na 429 (limit TPM) — zwykle wystarczy < 1s.
		for (let attempt = 0; attempt < 3; attempt += 1) {
			const res = await fetch(url, {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify(payload),
			});

			const data = (await res.json()) as {
				error?: { message?: string };
				choices?: Array<{ message?: { content?: string } }>;
			};

			if (res.ok) {
				const text = data.choices?.[0]?.message?.content?.trim();
				if (!text) {
					return NextResponse.json({ error: 'Pusta odpowiedź z Groq.' }, { status: 502 });
				}

				cache.set(key, { text, at: Date.now() });
				return NextResponse.json({ tips: text, cached: false });
			}

			lastStatus = res.status;
			lastErrorMessage = data.error?.message || 'Błąd Groq.';
			lastRetryAfterMs = parseRetryAfterMs({
				message: lastErrorMessage,
				retryAfterHeader: res.headers.get('retry-after'),
			});

			if (res.status === 429 && attempt < 2) {
				// Bezpieczny cap, żeby nie blokować requestu zbyt długo.
				const waitMs = Math.min(Math.max(lastRetryAfterMs ?? 750, 0), 2_000);
				// Minimalny jitter, żeby nie walić wszyscy w ten sam ms.
				await sleep(waitMs + 50);
				continue;
			}

			// Inne kody lub wyczerpane próby — przerwij.
			break;
		}

		if (lastStatus === 429) {
			const retryAfterMs = Math.min(Math.max(lastRetryAfterMs ?? 750, 0), 2_000);
			return NextResponse.json(
				{
					error: 'Limit zapytań do AI został chwilowo przekroczony. Spróbuj ponownie za moment.',
					retryAfterMs,
				},
				{ status: 429, headers: { 'retry-after': String(Math.ceil(retryAfterMs / 1000)) } }
			);
		}

		return NextResponse.json(
			{ error: lastErrorMessage || 'Błąd Groq.' },
			{ status: 502 }
		);
	} catch {
		return NextResponse.json({ error: 'Nie udało się pobrać porad AI.' }, { status: 502 });
	}
}
