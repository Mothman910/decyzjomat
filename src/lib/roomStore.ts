import type { DecisionCard } from '@/types/decisionCard';
import type { BlindPick, BlindRound, Room, RoomView } from '@/types/room';

export const runtime = 'nodejs';

type Subscriber = (payload: unknown) => void;

type RoomCreateInput =
	| {
			mode: 'match';
			cards: DecisionCard[];
	  }
	| {
			mode: 'blind';
			rounds: BlindRound[];
	  };

const rooms = new Map<string, Room>();
const roomIdByCode = new Map<string, string>();
const subscribersByRoomId = new Map<string, Set<Subscriber>>();

function now(): number {
	return Date.now();
}

function randomCode(length = 6): string {
	const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let out = '';
	for (let i = 0; i < length; i += 1) {
		out += alphabet[Math.floor(Math.random() * alphabet.length)];
	}
	return out;
}

function broadcast(roomId: string, payload: unknown) {
	const subs = subscribersByRoomId.get(roomId);
	if (!subs) return;
	for (const fn of subs) fn(payload);
}

function getRoomView(room: Room): RoomView {
	const base: RoomView = {
		roomId: room.roomId,
		code: room.code,
		createdAt: room.createdAt,
		mode: room.state.mode,
		participantsCount: room.participants.length,
		participantClientIds: room.participants.map((p) => p.clientId),
		maxParticipants: 2,
	};

	if (room.state.mode === 'match') {
		const matchVotesByCardId: Record<string, number> = {};
		const clientIds = room.participants.map((p) => p.clientId);
		for (const card of room.state.cards) {
			let votes = 0;
			for (const cid of clientIds) {
				const decision = room.state.decisionsByClientId?.[cid]?.[card.id];
				if (decision === 'like' || decision === 'nope') votes += 1;
			}
			matchVotesByCardId[card.id] = votes;
		}

		return {
			...base,
			matchedCardId: room.state.matchedCardId,
			cards: room.state.cards,
			matchVotesByCardId,
		};
	}

	// blind
	const rounds = room.state.rounds;
	const picks = room.state.picksByClientId;
	const clientIds = room.participants.map((p) => p.clientId);
	const a = clientIds[0];
	const b = clientIds[1];

	const blindPicksByClientId: Record<string, Record<number, BlindPick>> = {};
	for (const cid of clientIds) {
		if (!cid) continue;
		blindPicksByClientId[cid] = picks[cid] ?? {};
	}

	const blindVotesByRoundIndex: Record<string, number> = {};
	for (let i = 0; i < rounds.length; i += 1) {
		let votes = 0;
		if (a) {
			const pa = picks[a]?.[i];
			if (pa === 'left' || pa === 'right') votes += 1;
		}
		if (b) {
			const pb = picks[b]?.[i];
			if (pb === 'left' || pb === 'right') votes += 1;
		}
		blindVotesByRoundIndex[String(i)] = votes;
	}

	let completedRounds = 0;
	let matches = 0;
	if (a && b) {
		for (let i = 0; i < rounds.length; i += 1) {
			const pa = picks[a]?.[i];
			const pb = picks[b]?.[i];
			if (!pa || !pb) continue;
			completedRounds += 1;
			if (pa === pb) matches += 1;
		}
	}

	const percent = completedRounds === 0 ? 0 : Math.round((matches / completedRounds) * 100);

	return {
		...base,
		rounds,
		blindVotesByRoundIndex,
		blindPicksByClientId,
		blindStats: {
			completedRounds,
			totalRounds: rounds.length,
			matches,
			percent,
		},
	};
}

export function createRoom(input: RoomCreateInput): Room {
	const roomId = crypto.randomUUID();
	let code = randomCode();
	while (roomIdByCode.has(code)) code = randomCode();

	const room: Room = {
		roomId,
		code,
		createdAt: now(),
		participants: [],
		state:
			input.mode === 'match'
				? { mode: 'match', cards: input.cards, decisionsByClientId: {}, likesByClientId: {}, matchedCardId: null }
				: { mode: 'blind', rounds: input.rounds, picksByClientId: {} },
	};

	rooms.set(roomId, room);
	roomIdByCode.set(code, roomId);
	return room;
}

export function findRoomByCode(code: string): Room | null {
	const roomId = roomIdByCode.get(code.toUpperCase());
	if (!roomId) return null;
	return rooms.get(roomId) ?? null;
}

export function getRoom(roomId: string): Room | null {
	return rooms.get(roomId) ?? null;
}

export function joinRoom(room: Room, clientId: string): RoomView {
	const existing = room.participants.find((p) => p.clientId === clientId);
	if (!existing) {
		if (room.participants.length >= 2) {
			throw new Error('Pokój jest pełny (max 2 osoby).');
		}
		room.participants.push({ clientId, joinedAt: now() });
	}

	const view = getRoomView(room);
	broadcast(room.roomId, { type: 'room:update', room: view });
	return view;
}

export function submitMatchChoice(args: {
	room: Room;
	clientId: string;
	cardId: string;
	decision: 'like' | 'nope';
}): RoomView {
	const { room, clientId, cardId, decision } = args;
	if (room.state.mode !== 'match') throw new Error('Nieprawidłowy tryb pokoju.');

	if (!room.participants.some((p) => p.clientId === clientId)) {
		throw new Error('Najpierw dołącz do pokoju.');
	}

	room.state.decisionsByClientId[clientId] ??= {};
	room.state.decisionsByClientId[clientId][cardId] = decision;

	if (decision === 'like') {
		room.state.likesByClientId[clientId] ??= {};
		room.state.likesByClientId[clientId][cardId] = true;
	}

	// match: obie osoby polubiły to samo
	if (room.participants.length === 2) {
		const [a, b] = room.participants.map((p) => p.clientId);
		const likesA = room.state.likesByClientId[a] ?? {};
		const likesB = room.state.likesByClientId[b] ?? {};
		if (likesA[cardId] && likesB[cardId]) {
			room.state.matchedCardId = cardId;
		}
	}

	const view = getRoomView(room);
	broadcast(room.roomId, { type: 'room:update', room: view });
	return view;
}

export function submitBlindPick(args: {
	room: Room;
	clientId: string;
	roundIndex: number;
	pick: BlindPick;
}): RoomView {
	const { room, clientId, roundIndex, pick } = args;
	if (room.state.mode !== 'blind') throw new Error('Nieprawidłowy tryb pokoju.');

	if (!room.participants.some((p) => p.clientId === clientId)) {
		throw new Error('Najpierw dołącz do pokoju.');
	}

	if (roundIndex < 0 || roundIndex >= room.state.rounds.length) {
		throw new Error('Nieprawidłowy numer rundy.');
	}

	room.state.picksByClientId[clientId] ??= {};
	room.state.picksByClientId[clientId][roundIndex] = pick;

	const view = getRoomView(room);
	broadcast(room.roomId, { type: 'room:update', room: view });
	return view;
}

export function subscribe(roomId: string, fn: Subscriber): () => void {
	const set = subscribersByRoomId.get(roomId) ?? new Set<Subscriber>();
	set.add(fn);
	subscribersByRoomId.set(roomId, set);

	return () => {
		const current = subscribersByRoomId.get(roomId);
		if (!current) return;
		current.delete(fn);
		if (current.size === 0) subscribersByRoomId.delete(roomId);
	};
}

export function viewRoom(room: Room): RoomView {
	return getRoomView(room);
}

export function makeBlindRounds(cards: DecisionCard[], roundsCount: number): BlindRound[] {
	const rounds: BlindRound[] = [];
	for (let i = 0; i < roundsCount; i += 1) {
		const left = cards[i * 2];
		const right = cards[i * 2 + 1];
		if (!left || !right) break;
		rounds.push({ index: i, left, right });
	}
	return rounds;
}
