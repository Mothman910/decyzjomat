import { NextResponse } from 'next/server';
import { createRoom, joinRoom, makeBlindRounds, viewRoom } from '@/lib/roomStore';
import { shuffle } from '@/lib/shuffle';
import { getRandomMovieCardsFromTmdb, TMDB_GENRES } from '@/lib/tmdb';
import { getWordPairsSubcategory, type WordPairsSubcategoryId } from '@/lib/wordPairs';
import type { DecisionCard } from '@/types/decisionCard';
import type { BlindRound } from '@/types/room';
import type { QuizPackId, RoomMode } from '@/types/room';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CreateRoomRequest = {
	mode: RoomMode;
	clientId?: string;
	genreId?: number;
	blindTopic?: 'movies' | 'words';
	wordsSubcategory?: WordPairsSubcategoryId;
	packId?: QuizPackId;
	solo?: boolean;
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
	if (mode !== 'match' && mode !== 'blind' && mode !== 'quiz') {
		return NextResponse.json({ error: 'Nieprawidłowy tryb.' }, { status: 400 });
	}

	const genreId = typeof body.genreId === 'number' ? body.genreId : TMDB_GENRES.komedia;
	const blindTopic = body.blindTopic === 'words' ? 'words' : 'movies';
	const wordsSubcategory = (body.wordsSubcategory as WordPairsSubcategoryId | undefined) ?? 'adjectives';
	const clientId = typeof body.clientId === 'string' && body.clientId.trim() ? body.clientId.trim() : null;

	try {
		if (mode === 'quiz') {
			const packId = (body.packId as QuizPackId | undefined) ?? 'mix';
			const maxParticipants = body.solo ? 1 : 2;
			const room = createRoom({ mode: 'quiz', packId, maxParticipants });
			const roomView = clientId ? joinRoom(room, clientId) : viewRoom(room);
			return NextResponse.json({ room: roomView });
		}

		if (mode === 'match') {
			const cardsLimit = typeof body.cardsLimit === 'number' ? body.cardsLimit : 20;
			const cards = await getRandomMovieCardsFromTmdb({ genreId, limit: cardsLimit });
			const room = createRoom({ mode: 'match', cards: shuffle(cards) });
			const roomView = clientId ? joinRoom(room, clientId) : viewRoom(room);
			return NextResponse.json({ room: roomView });
		}

		const roundsCount = typeof body.rounds === 'number' ? Math.max(1, Math.min(20, body.rounds)) : 8;

		if (blindTopic === 'words') {
			const sub = getWordPairsSubcategory(wordsSubcategory);
			const shuffled = shuffle(sub.pairs.slice());
			const selected = shuffled.slice(0, roundsCount);
			const rounds: BlindRound[] = selected.map((p, i) => {
				const left: DecisionCard = {
					id: crypto.randomUUID(),
					title: p.left,
					description: null,
					imageUrl: null,
					source: 'manual',
				};
				const right: DecisionCard = {
					id: crypto.randomUUID(),
					title: p.right,
					description: null,
					imageUrl: null,
					source: 'manual',
				};
				return { index: i, left, right };
			});

			const room = createRoom({ mode: 'blind', rounds });
			const roomView = clientId ? joinRoom(room, clientId) : viewRoom(room);
			return NextResponse.json({ room: roomView });
		}

		const cardsNeeded = roundsCount * 2;
		const cards = await getRandomMovieCardsFromTmdb({ genreId, limit: Math.max(cardsNeeded, 16) });
		const pairs = makeBlindRounds(shuffle(cards), roundsCount);
		const room = createRoom({ mode: 'blind', rounds: pairs });
		const roomView = clientId ? joinRoom(room, clientId) : viewRoom(room);
		return NextResponse.json({ room: roomView });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Nieznany błąd.';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
