import { NextResponse } from 'next/server';
import { createRoom, makeBlindRounds, viewRoom } from '@/lib/roomStore';
import { shuffle } from '@/lib/shuffle';
import { getRandomMovieCardsFromTmdb, TMDB_GENRES } from '@/lib/tmdb';
import type { RoomMode } from '@/types/room';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CreateRoomRequest = {
	mode: RoomMode;
	genreId?: number;
	rounds?: number;
	cardsLimit?: number;
};

export async function POST(request: Request) {
	let body: CreateRoomRequest;
	try {
		body = (await request.json()) as CreateRoomRequest;
	} catch {
		return NextResponse.json({ error: 'Nieprawidłowe body (oczekiwano JSON).' }, { status: 400 });
	}

	const mode = body.mode;
	if (mode !== 'match' && mode !== 'blind') {
		return NextResponse.json({ error: 'Nieprawidłowy tryb.' }, { status: 400 });
	}

	const genreId = typeof body.genreId === 'number' ? body.genreId : TMDB_GENRES.komedia;

	try {
		if (mode === 'match') {
			const cardsLimit = typeof body.cardsLimit === 'number' ? body.cardsLimit : 20;
			const cards = await getRandomMovieCardsFromTmdb({ genreId, limit: cardsLimit });
			const room = createRoom({ mode: 'match', cards: shuffle(cards) });
			return NextResponse.json({ room: viewRoom(room) });
		}

		const roundsCount = typeof body.rounds === 'number' ? Math.max(1, Math.min(20, body.rounds)) : 8;
		const cardsNeeded = roundsCount * 2;
		const cards = await getRandomMovieCardsFromTmdb({ genreId, limit: Math.max(cardsNeeded, 16) });
		const pairs = makeBlindRounds(shuffle(cards), roundsCount);
		const room = createRoom({ mode: 'blind', rounds: pairs });
		return NextResponse.json({ room: viewRoom(room) });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Nieznany błąd.';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
