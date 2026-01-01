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
	const apiKey = process.env.GROQ_API_KEY;
	if (!apiKey) {
		return NextResponse.json(
			{ error: 'Brak konfiguracji GROQ_API_KEY w zmiennych środowiskowych.' },
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
		return NextResponse.json({ error: 'AI podsumowanie wymaga 2 osób w pokoju.' }, { status: 400 });
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
	}).join(' ');

	const agreement = room.state.summary?.agreementPercent;
	const summaryHint = typeof agreement === 'number' ? `Zgodność (heurystycznie): ${agreement}%.` : '';

	const prompt = [
		`Kontekst: quiz "Gusty" dla par. Pakiet: ${packLabel}.`,
		summaryHint,
		'Ośmiowymiarowy profil gustów (wyniki i różnice):',
		axisLines,
		'',
		'Napisz po polsku 10–12 zdań (bez list, bez nagłówków).',
		'Zrób to praktycznie: 3 zdania o mocnych dopasowaniach i jak je wykorzystać; 5–6 zdań o największych tarciach i jak robić kompromisy; na końcu 1–2 zdania z propozycją prostego „rytuału” na wspólne decyzje.',
		'Nie dawaj porad medycznych/terapeutycznych, nie oceniaj ludzi, nie używaj emoji, nie wspominaj o polityce ani NSFW.',
	].join(' ');

	const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

	try {
		const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model,
				temperature: 0.85,
				top_p: 0.9,
				max_completion_tokens: 520,
				messages: [
					{
						role: 'system',
						content:
							'Jesteś pomocnym asystentem komunikacji i kompromisu dla par. Dajesz konkretne, lekkie, codzienne wskazówki. Odpowiadasz po polsku.',
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

		const updated = setQuizAiSummary({ room, inputHash, text });
		return NextResponse.json({ room: updated, cached: false });
	} catch {
		return NextResponse.json({ error: 'Nie udało się pobrać podsumowania AI.' }, { status: 502 });
	}
}
