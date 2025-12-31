import { NextResponse } from 'next/server';
import { getRoom, submitBlindPick, submitMatchChoice } from '@/lib/roomStore';
import type { BlindPick, MatchDecision } from '@/types/room';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type MatchChoiceBody = {
	roomId: string;
	clientId: string;
	mode: 'match';
	cardId: string;
	decision: MatchDecision;
};

type BlindChoiceBody = {
	roomId: string;
	clientId: string;
	mode: 'blind';
	roundIndex: number;
	pick: BlindPick;
};

type ChoiceBody = MatchChoiceBody | BlindChoiceBody;

export async function POST(request: Request) {
	let body: ChoiceBody;
	try {
		body = (await request.json()) as ChoiceBody;
	} catch {
		return NextResponse.json({ error: 'Nieprawidłowe body (oczekiwano JSON).' }, { status: 400 });
	}

	if (!body.roomId || typeof body.roomId !== 'string') {
		return NextResponse.json({ error: 'Brak roomId.' }, { status: 400 });
	}
	if (!body.clientId || typeof body.clientId !== 'string') {
		return NextResponse.json({ error: 'Brak clientId.' }, { status: 400 });
	}

	const room = getRoom(body.roomId);
	if (!room) {
		return NextResponse.json({ error: 'Nie znaleziono pokoju.' }, { status: 404 });
	}

	try {
		if (body.mode === 'match') {
			if (typeof body.cardId !== 'string') {
				return NextResponse.json({ error: 'Brak cardId.' }, { status: 400 });
			}
			if (body.decision !== 'like' && body.decision !== 'nope') {
				return NextResponse.json({ error: 'Nieprawidłowa decyzja.' }, { status: 400 });
			}

			const view = submitMatchChoice({
				room,
				clientId: body.clientId,
				cardId: body.cardId,
				decision: body.decision,
			});
			return NextResponse.json({ room: view });
		}

		if (typeof body.roundIndex !== 'number') {
			return NextResponse.json({ error: 'Brak roundIndex.' }, { status: 400 });
		}
		if (body.pick !== 'left' && body.pick !== 'right') {
			return NextResponse.json({ error: 'Nieprawidłowy pick.' }, { status: 400 });
		}

		const view = submitBlindPick({
			room,
			clientId: body.clientId,
			roundIndex: body.roundIndex,
			pick: body.pick,
		});

		return NextResponse.json({ room: view });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Nieznany błąd.';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
