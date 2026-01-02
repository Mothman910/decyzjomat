import { getAxisLabel, QUIZ_PACKS } from '@/lib/quizBank';
import type { QuizAxisId, QuizPackId } from '@/types/room';

export type QuizAiProvider = 'groq' | 'gemini';

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

export function buildQuizAiPrompt(args: {
	packId: QuizPackId;
	agreementPercent?: number;
	scoresMe: Partial<Record<QuizAxisId, number>>;
	scoresPartner: Partial<Record<QuizAxisId, number>>;
	axisMaxAbs?: Partial<Record<QuizAxisId, number>>;
}): string {
	const packLabel = QUIZ_PACKS[args.packId].label;

	const axisLines = AXES.map((axisId) => {
		const label = getAxisLabel(axisId);
		const me = args.scoresMe[axisId] ?? 0;
		const partner = args.scoresPartner[axisId] ?? 0;
		const diff = Math.abs(me - partner);
		const maxAbs = args.axisMaxAbs?.[axisId] ?? 0;
		const range = maxAbs > 0 ? ` (zakres: -${maxAbs}…+${maxAbs})` : '';
		return `${label}${range}: Ty=${me}, Partner=${partner}, różnica=${diff}.`;
	}).join('\n');

	const agreementHint =
		typeof args.agreementPercent === 'number' ? `Zgodność (heurystycznie): ${args.agreementPercent}%.` : '';

	return [
		`Kontekst: quiz \"Gusty\" dla par. Pakiet: ${packLabel}.`,
		agreementHint,
		'',
		'Wyniki osi (z zakresem dla tej rundy):',
		axisLines,
		'',
		'Zadanie: na podstawie danych zaproponuj konkretne zasady podejmowania decyzji i kompromisy.',
		'Kluczowa zasada: jeśli na danej osi jedna osoba jest blisko 0 (neutralna), a druga ma wyraźny kierunek (daleko od 0), to NIE mieszaj na siłę.',
		'Zamiast tego zaproponuj "delegowanie": neutralna osoba daje prowadzenie na tej osi osobie z silnym kierunkiem, z prawem do jednego jasnego veto.',
		'',
		'Forma odpowiedzi (po polsku, konkret, bez lania wody, bez emoji):',
		'- Sekcja 1: "Co jest wspólne" (3–5 punktów). Każdy punkt musi odwołać się do co najmniej jednej osi.',
		'- Sekcja 2: "Największe tarcia → strategie" (dla 2–3 osi). Dla każdej osi podaj 3 strategie: (a) delegowanie, (b) środek, (c) rotacja 1:1 (np. co drugi wybór).',
		'- Sekcja 3: "Zasady operacyjne" (4–6 punktów). To mają być reguły typu: budżet/limity, lista veto, test 24h, prototyp vs docelowe, 80/20 (baza + akcent).',
		'- Sekcja 4: "2 szybkie scenariusze" — podaj 2 konkretne przykłady decyzji (np. salon/sypialnia, weekend) i pokaż jak zastosować reguły.',
		'Wymagania: unikaj ogólników typu "rozmawiajcie"; każda rada ma być wykonywalna i sprawdzalna w praktyce.',
		'Nie dawaj porad medycznych/terapeutycznych, nie oceniaj ludzi, nie wspominaj o polityce ani NSFW.',
	]
		.filter(Boolean)
		.join('\n');
}

export async function runQuizAi(args: {
	provider: QuizAiProvider;
	model?: string;
	prompt: string;
}): Promise<string> {
	if (args.provider === 'groq') {
		return runGroq({ model: args.model, prompt: args.prompt });
	}
	return runGemini({ model: args.model, prompt: args.prompt });
}

async function runGroq(args: { model?: string; prompt: string }): Promise<string> {
	const apiKey = process.env.GROQ_API_KEY;
	if (!apiKey) throw new Error('Brak konfiguracji GROQ_API_KEY w zmiennych środowiskowych.');

	const model = args.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
	const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model,
			temperature: 0.7,
			top_p: 0.9,
			max_completion_tokens: 650,
			messages: [
				{
					role: 'system',
					content:
						'Jesteś doradcą praktycznych kompromisów dla par. Jesteś konkretny, unikasz banałów. Odpowiadasz po polsku. Używaj krótkich nagłówków i punktów, bez emoji.',
				},
				{ role: 'user', content: args.prompt },
			],
		}),
	});

	const data = (await res.json()) as {
		error?: { message?: string };
		choices?: Array<{ message?: { content?: string } }>;
	};

	if (!res.ok) {
		const msg = data.error?.message || 'Błąd Groq.';
		throw new Error(msg);
	}

	const text = data.choices?.[0]?.message?.content?.trim();
	if (!text) throw new Error('Pusta odpowiedź z Groq.');
	return text;
}

async function runGemini(args: { model?: string; prompt: string }): Promise<string> {
	// Gemini API (Google AI Studio) ma darmowy tier, ale wymaga klucza.
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) throw new Error('Brak konfiguracji GEMINI_API_KEY w zmiennych środowiskowych.');

	// Uwaga: lista dostępnych modeli bywa inna niż w przykładach w sieci.
	// Bezpieczny domyślny alias (często dostępny): gemini-flash-latest.
	const rawModel = args.model || process.env.GEMINI_MODEL || 'gemini-flash-latest';
	const modelPath = rawModel.startsWith('models/') ? rawModel : `models/${rawModel}`;
	const encodedModelPath = modelPath
		.split('/')
		.map((seg: string) => encodeURIComponent(seg))
		.join('/');
	const url = `https://generativelanguage.googleapis.com/v1beta/${encodedModelPath}:generateContent?key=${encodeURIComponent(apiKey)}`;

	const res = await fetch(url, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			generationConfig: {
				temperature: 0.7,
				topP: 0.9,
				maxOutputTokens: 8192,
			},
			contents: [
				{
					role: 'user',
					parts: [
						{
							text:
								'Jesteś doradcą praktycznych kompromisów dla par. Jesteś konkretny, unikasz banałów. Odpowiadasz po polsku. Używaj krótkich nagłówków i punktów, bez emoji.\n\n' +
								args.prompt,
						},
					],
				},
			],
		}),
	});

	const data = (await res.json()) as {
		error?: { message?: string };
		candidates?: Array<{
			content?: { parts?: Array<{ text?: string }> };
		}>;
	};

	if (!res.ok) {
		const rawMsg = data.error?.message?.trim();
		const msg = rawMsg || `HTTP ${res.status} ${res.statusText || ''}`.trim();
		if (res.status === 404) {
			throw new Error(
				`Gemini: model nie znaleziony lub niedostępny dla generateContent (${modelPath}). ` +
					`Sprawdź dostępne modele (np. endpoint dev /api/rooms/quiz/ai-models) i podaj nazwę z prefixem models/. ` +
					`Szczegóły: ${msg}`,
			);
		}
		if (res.status === 429) {
			throw new Error(
				`Gemini: przekroczony limit / brak aktywnej kwoty (HTTP 429) dla ${modelPath}. ` +
					`Jeśli widzisz limity = 0 dla free tier, trzeba włączyć plan/billing lub użyć projektu z aktywnymi limitami. ` +
					`Szczegóły: ${msg}`,
			);
		}
		throw new Error(`Gemini: ${msg}`);
	}

	const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
	if (!text) throw new Error('Pusta odpowiedź z Gemini.');
	return text;
}
