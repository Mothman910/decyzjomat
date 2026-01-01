import { NextResponse } from 'next/server';
import { getRoom, submitQuizAnswer } from '@/lib/roomStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type QuizAnswerBody = {
	roomId: string;
	clientId: string;
	questionId: string;
	optionId: string;
};

export async function POST(request: Request) {
	let body: QuizAnswerBody;
	try {
		body = (await request.json()) as QuizAnswerBody;
	} catch {
		return NextResponse.json({ error: 'Nieprawidłowe body (oczekiwano JSON).' }, { status: 400 });
	}

	if (!body.roomId || typeof body.roomId !== 'string') {
		return NextResponse.json({ error: 'Brak roomId.' }, { status: 400 });
	}
	if (!body.clientId || typeof body.clientId !== 'string') {
		return NextResponse.json({ error: 'Brak clientId.' }, { status: 400 });
	}
	if (!body.questionId || typeof body.questionId !== 'string') {
		return NextResponse.json({ error: 'Brak questionId.' }, { status: 400 });
	}
	if (!body.optionId || typeof body.optionId !== 'string') {
		return NextResponse.json({ error: 'Brak optionId.' }, { status: 400 });
	}

	const room = getRoom(body.roomId);
	if (!room) {
		return NextResponse.json({ error: 'Nie znaleziono pokoju.' }, { status: 404 });
	}

	try {
		const view = submitQuizAnswer({
			room,
			clientId: body.clientId,
			questionId: body.questionId,
			optionId: body.optionId,
		});
		return NextResponse.json({ room: view });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Nieznany błąd.';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
