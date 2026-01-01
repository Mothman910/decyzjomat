import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { getRoom, setQuizAiSummary, viewRoom } from '@/lib/roomStore';
import { getAxisLabel, QUIZ_PACKS } from '@/lib/quizBank';
import type { QuizAxisId } from '@/types/room';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type QuizAiSummaryBody = {
	roomId: string;
	fresh?: boolean;
};

const AXES: QuizAxisId[] = [
	'modernClassic',
	'minimalMaximal',
	'warmCool',
	'naturalIndustrial',
	'boldSafe',
	'budgetPremium',
	'planSpontaneous',
	'socialCozy',
];

export async function POST(req: Request) {
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) {
		return NextResponse.json(
			{ error: 'Brak konfiguracji GEMINI_API_KEY w zmiennych środowiskowych.' },
			{ status: 500 }
		);
	}

	let body: QuizAiSummaryBody;
	try {
		body = (await req.json()) as QuizAiSummaryBody;
	} catch {
		return NextResponse.json({ error: 'Nieprawidłowe JSON.' }, { status: 400 });
	}

	if (!body?.roomId || typeof body.roomId !== 'string') {
		return NextResponse.json({ error: 'Brak roomId.' }, { status: 400 });
	}

	const room = getRoom(body.roomId);
	if (!room) {
		return NextResponse.json({ error: 'Nie znaleziono pokoju.' }, { status: 404 });
	}

	if (room.state.mode !== 'quiz') {
		return NextResponse.json({ error: 'To nie jest pokój quiz.' }, { status: 400 });
	}
	if (room.state.status !== 'completed') {
		return NextResponse.json({ error: 'Najpierw ukończ quiz.' }, { status: 400 });
	}
	if (room.participants.length !== 2) {
		return NextResponse.json({ error: 'Podsumowanie wymaga 2 osób w pokoju.' }, { status: 400 });
	}

	const clientIds = room.participants.map((p) => p.clientId);
	const a = clientIds[0];
	const b = clientIds[1];
	if (!a || !b) {
		return NextResponse.json({ error: 'Brak uczestników.' }, { status: 400 });
	}

	const payload = {
		quizId: room.state.quizId,
		quizVersion: room.state.quizVersion,
		packId: room.state.packId,
		questionIds: room.state.questionIds,
		scoresByClientId: room.state.scoresByClientId,
		summary: room.state.summary,
	};

	const input = JSON.stringify(payload);
	const inputHash = createHash('sha256').update(input).digest('hex');

	if (!body.fresh && room.state.aiSummary?.text && room.state.aiSummary.inputHash === inputHash) {
		return NextResponse.json({ room: viewRoom(room), cached: true });
	}

	const packLabel = QUIZ_PACKS[room.state.packId].label;
	const scoresA = room.state.scoresByClientId[a];
	const scoresB = room.state.scoresByClientId[b];

	const axisLines = AXES.map((axisId) => {
		const label = getAxisLabel(axisId);
		const va = scoresA?.[axisId] ?? 0;
		const vb = scoresB?.[axisId] ?? 0;
		const diff = Math.abs(va - vb);
		return `${label}: osoba A=${va}, osoba B=${vb}, różnica=${diff}.`;
	}).join('\n');

	const agreement = room.state.summary?.agreementPercent;
	const summaryHint = typeof agreement === 'number' ? `Zgodność (heurystycznie): ${agreement}%.` : '';

	const prompt = [
		`Kontekst: quiz "Gusty" dla par. Pakiet: ${packLabel}.`,
		summaryHint,
		'',
		'Ośmiowymiarowy profil gustów (wyniki i różnice):',
		axisLines,
		'',
		'Zadanie: na podstawie danych zaproponuj konkretne zasady podejmowania decyzji i kompromisy.',
		'Ważne: odpowiedź ma zawierać WSZYSTKIE sekcje z układu poniżej; nie kończ po wstępie.',
		'Jeśli brakuje miejsca, skróć punkty, ale NIE pomijaj żadnej sekcji ani nagłówka.',
		'Cel długości: zmieść się w ok. 900–1300 słowach; krótkie punkty, zero lania wody.',
		'',
		'Forma odpowiedzi:',
		'- Język: polski.',
		'- Format: czysty Markdown (nagłówki, krótkie akapity, listy punktowane).',
		'- Unikaj tabel Markdown (bez |...|) — zamiast tego używaj list i krótkich podpunktów.',
		'- Ton: ciepły i życzliwy, ale konkretny; bez emoji; bez moralizowania.',
		'- Zakaz: nie wspominaj o AI, modelu, generowaniu, promptach ani „algorytmie”.',
		'',
		'Układ:',
		'- Zacznij od 1–2 zdań wstępu (krótko, wspierająco).',
		'- Potem dokładnie te sekcje (nagłówki Markdown):',
		'  - ## Co jest wspólne (3–5 punktów; każdy punkt odwołuje się do co najmniej jednej osi).',
		'  - ## Największe tarcia → strategie (dla 2–3 osi; dla każdej osi: (a) delegowanie, (b) środek, (c) rotacja 1:1).',
		'  - ## Zasady operacyjne (4–6 punktów; reguły typu: budżet/limity, lista veto, test 24h, prototyp vs docelowe, 80/20: baza + akcent).',
		'  - ## Dwa szybkie scenariusze (2 konkretne przykłady decyzji i zastosowanie reguł).',
		'',
		'Wymagania: unikaj ogólników typu "rozmawiajcie"; każda rada ma być wykonywalna i sprawdzalna w praktyce.',
		'Nie dawaj porad medycznych/terapeutycznych, nie oceniaj ludzi, nie wspominaj o polityce ani NSFW.',
	].join('\n');

	const rawModel = process.env.GEMINI_MODEL || 'gemini-flash-latest';
	const modelPath = rawModel.startsWith('models/') ? rawModel : `models/${rawModel}`;
	const encodedModelPath = modelPath
		.split('/')
		.map((seg) => encodeURIComponent(seg))
		.join('/');
	const url = `https://generativelanguage.googleapis.com/v1beta/${encodedModelPath}:generateContent?key=${encodeURIComponent(apiKey)}`;

	const requiredHeadings = [
		'## Co jest wspólne',
		'## Największe tarcia',
		'## Zasady operacyjne',
		'## Dwa szybkie scenariusze',
	];

	function hasAllHeadings(text: string): boolean {
		return requiredHeadings.every((h) => text.includes(h));
	}

	async function callGemini(args: { promptText: string; maxOutputTokens: number }): Promise<{ text: string; finishReason?: string }>{
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				generationConfig: {
					temperature: 0.75,
					topP: 0.9,
					maxOutputTokens: args.maxOutputTokens,
				},
				contents: [
					{
						role: 'user',
						parts: [
							{
								text:
									'Jesteś życzliwym doradcą praktycznych kompromisów dla par. Jesteś konkretny i taktowny, unikasz banałów. Odpowiadasz po polsku. Pisz w czytelnym Markdown (nagłówki i punkty), bez emoji i bez wspominania o AI/modelach.\n\n' +
									args.promptText,
							},
						],
					},
				],
			}),
		});

		const data = (await res.json()) as {
			error?: { message?: string };
			candidates?: Array<{
				finishReason?: string;
				content?: { parts?: Array<{ text?: string }> };
			}>;
		};

		if (!res.ok) {
			const msg = data.error?.message || 'Błąd Gemini.';
			throw new Error(msg);
		}

		const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim() ?? '';
		if (!text) throw new Error('Pusta odpowiedź z Gemini.');
		return { text, finishReason: data.candidates?.[0]?.finishReason };
	}

	try {
		const first = await callGemini({ promptText: prompt, maxOutputTokens: 4096 });
		let finalText = first.text;

		// Jeśli odpowiedź wygląda na uciętą (brak sekcji), dociągamy tylko brakujące części.
		if (!hasAllHeadings(finalText)) {
			const missing = requiredHeadings.filter((h) => !finalText.includes(h));
			const continuationPrompt = [
				'Poprzednia odpowiedź była ucięta lub nie zawierała wszystkich sekcji.',
				'Nie powtarzaj wstępu ani sekcji, które już są. Zwróć WYŁĄCZNIE brakujące sekcje w tym samym stylu.',
				'Zakaz: nie wspominaj o AI/modelach/generowaniu.',
				'',
				'Brakujące nagłówki (w tej kolejności):',
				...missing.map((h) => `- ${h}`),
				'',
				'Dotychczasowa treść (dla kontekstu, nie cytuj dosłownie, tylko kontynuuj):',
				'```',
				finalText,
				'```',
			].join('\n');

			const second = await callGemini({ promptText: continuationPrompt, maxOutputTokens: 2048 });
			finalText = `${finalText.trim()}\n\n${second.text.trim()}`.trim();
		}

		const updated = setQuizAiSummary({ room, inputHash, text: finalText });
		return NextResponse.json({ room: updated, cached: false });
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Nie udało się pobrać podsumowania.';
		return NextResponse.json({ error: msg }, { status: 502 });
	}
}
