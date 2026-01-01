import type { DecisionCard } from '@/types/decisionCard';
import type {
	BlindPick,
	BlindRound,
	QuizAxisId,
	QuizPackId,
	QuizRoomState,
	QuizSummary,
	Room,
	RoomView,
} from '@/types/room';
import { QUIZ_ID, QUIZ_QUESTIONS_PER_RUN, QUIZ_VERSION, getQuestionById, getQuestionsByPack } from '@/lib/quizBank';

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
	  }
	| {
			mode: 'quiz';
			packId: QuizPackId;
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

const QUIZ_AXES: QuizAxisId[] = [
	'modernClassic',
	'minimalMaximal',
	'warmCool',
	'naturalIndustrial',
	'boldSafe',
	'budgetPremium',
	'planSpontaneous',
	'socialCozy',
];

function hashStringToUint32(input: string): number {
	// FNV-1a 32-bit
	let hash = 0x811c9dc5;
	for (let i = 0; i < input.length; i += 1) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}

function mulberry32(seed: number): () => number {
	let t = seed >>> 0;
	return () => {
		t += 0x6d2b79f5;
		let x = t;
		x = Math.imul(x ^ (x >>> 15), x | 1);
		x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
		return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
	};
}

function seededShuffle<T>(items: T[], seed: number): T[] {
	const out = items.slice();
	const rnd = mulberry32(seed);
	for (let i = out.length - 1; i > 0; i -= 1) {
		const j = Math.floor(rnd() * (i + 1));
		const tmp = out[i];
		out[i] = out[j] as T;
		out[j] = tmp as T;
	}
	return out;
}

function initAxisScores(): Record<QuizAxisId, number> {
	const scores: Record<QuizAxisId, number> = {
		modernClassic: 0,
		minimalMaximal: 0,
		warmCool: 0,
		naturalIndustrial: 0,
		boldSafe: 0,
		budgetPremium: 0,
		planSpontaneous: 0,
		socialCozy: 0,
	};
	return scores;
}

function computeQuizSummary(scoresByClientId: QuizRoomState['scoresByClientId'], clientIds: string[]): QuizSummary | null {
	if (clientIds.length !== 2) return null;
	const a = clientIds[0];
	const b = clientIds[1];
	if (!a || !b) return null;
	const sa = scoresByClientId[a];
	const sb = scoresByClientId[b];
	if (!sa || !sb) return null;

	const axisDiffs: Record<QuizAxisId, number> = {
		modernClassic: Math.abs((sa.modernClassic ?? 0) - (sb.modernClassic ?? 0)),
		minimalMaximal: Math.abs((sa.minimalMaximal ?? 0) - (sb.minimalMaximal ?? 0)),
		warmCool: Math.abs((sa.warmCool ?? 0) - (sb.warmCool ?? 0)),
		naturalIndustrial: Math.abs((sa.naturalIndustrial ?? 0) - (sb.naturalIndustrial ?? 0)),
		boldSafe: Math.abs((sa.boldSafe ?? 0) - (sb.boldSafe ?? 0)),
		budgetPremium: Math.abs((sa.budgetPremium ?? 0) - (sb.budgetPremium ?? 0)),
		planSpontaneous: Math.abs((sa.planSpontaneous ?? 0) - (sb.planSpontaneous ?? 0)),
		socialCozy: Math.abs((sa.socialCozy ?? 0) - (sb.socialCozy ?? 0)),
	};

	const diffsArray = QUIZ_AXES.map((axisId) => ({ axisId, diff: axisDiffs[axisId] }));
	const sortedAsc = diffsArray.slice().sort((x, y) => x.diff - y.diff);
	const sortedDesc = diffsArray.slice().sort((x, y) => y.diff - x.diff);

	const sumDiff = diffsArray.reduce((acc, x) => acc + x.diff, 0);
	const maxPerAxis = QUIZ_QUESTIONS_PER_RUN * 6; // +/-3 vs +/-3
	const maxTotal = maxPerAxis * QUIZ_AXES.length;
	const agreementPercent = Math.max(0, Math.min(100, 100 - Math.round((sumDiff / maxTotal) * 100)));

	return {
		agreementPercent,
		axisDiffs,
		topMatches: sortedAsc.slice(0, 3),
		topFrictions: sortedDesc.slice(0, 3),
	};
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

	if (room.state.mode === 'quiz') {
		const clientIds = room.participants.map((p) => p.clientId);
		const votesByQuestionIndex: Record<string, number> = {};
		for (let i = 0; i < room.state.questionIds.length; i += 1) {
			const qid = room.state.questionIds[i];
			let votes = 0;
			for (const cid of clientIds) {
				const answered = room.state.answersByClientId?.[cid]?.[qid];
				if (typeof answered === 'string' && answered) votes += 1;
			}
			votesByQuestionIndex[String(i)] = votes;
		}

		return {
			...base,
			quiz: {
				quizId: room.state.quizId,
				quizVersion: room.state.quizVersion,
				packId: room.state.packId,
				questionIds: room.state.questionIds,
				currentIndex: room.state.currentIndex,
				totalQuestions: room.state.questionIds.length,
				status: room.state.status,
				answersByClientId: room.state.answersByClientId,
				scoresByClientId: room.state.scoresByClientId,
				votesByQuestionIndex,
				summary: room.state.summary,
				aiSummary: room.state.aiSummary ?? null,
			},
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
				: input.mode === 'blind'
					? { mode: 'blind', rounds: input.rounds, picksByClientId: {} }
					: (() => {
						const all = getQuestionsByPack(input.packId);
						if (all.length < QUIZ_QUESTIONS_PER_RUN) {
							throw new Error('Za mało pytań w wybranym pakiecie.');
						}
						const seed = hashStringToUint32(`${roomId}:${input.packId}:${QUIZ_VERSION}`);
						const shuffled = seededShuffle(all.map((q) => q.id), seed);
						const questionIds = shuffled.slice(0, QUIZ_QUESTIONS_PER_RUN);
						const state: QuizRoomState = {
							mode: 'quiz',
							quizId: QUIZ_ID,
							quizVersion: QUIZ_VERSION,
							packId: input.packId,
							questionIds,
							currentIndex: 0,
							status: 'in_progress',
							answersByClientId: {},
							scoresByClientId: {},
							summary: null,
							aiSummary: null,
						};
						return state;
					})(),
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

export function submitQuizAnswer(args: {
	room: Room;
	clientId: string;
	questionId: string;
	optionId: string;
}): RoomView {
	const { room, clientId, questionId, optionId } = args;
	if (room.state.mode !== 'quiz') throw new Error('Nieprawidłowy tryb pokoju.');
	if (room.state.status !== 'in_progress') throw new Error('Quiz jest już zakończony.');
	const quiz = room.state;

	if (!room.participants.some((p) => p.clientId === clientId)) {
		throw new Error('Najpierw dołącz do pokoju.');
	}

	const expectedQid = quiz.questionIds[quiz.currentIndex];
	if (!expectedQid) {
		throw new Error('Brak kolejnego pytania.');
	}
	if (questionId !== expectedQid) {
		throw new Error('Nieprawidłowe pytanie (out of sync).');
	}

	quiz.answersByClientId[clientId] ??= {};
	if (quiz.answersByClientId[clientId][questionId]) {
		// Nie pozwalamy zmieniać odpowiedzi w MVP.
		return getRoomView(room);
	}

	const question = getQuestionById(questionId);
	if (!question) throw new Error('Nie znaleziono pytania.');
	const option = question.options.find((o) => o.id === optionId);
	if (!option) throw new Error('Nieprawidłowa odpowiedź.');

	quiz.answersByClientId[clientId][questionId] = optionId;
	quiz.scoresByClientId[clientId] ??= initAxisScores();
	for (const axisId of QUIZ_AXES) {
		const delta = option.weights[axisId] ?? 0;
		quiz.scoresByClientId[clientId][axisId] += delta;
	}

	// Jeśli wszyscy aktualni uczestnicy odpowiedzieli na bieżące pytanie, przechodzimy dalej.
	const clientIds = room.participants.map((p) => p.clientId);
	const allAnswered = clientIds.every((cid) => {
		const ans = quiz.answersByClientId[cid]?.[questionId];
		return typeof ans === 'string' && ans.length > 0;
	});
	if (allAnswered) {
		quiz.currentIndex += 1;
		if (quiz.currentIndex >= quiz.questionIds.length) {
			quiz.status = 'completed';
			quiz.summary = computeQuizSummary(quiz.scoresByClientId, clientIds);
		}
	}

	const view = getRoomView(room);
	broadcast(room.roomId, { type: 'room:update', room: view });
	return view;
}

export function setQuizAiSummary(args: {
	room: Room;
	inputHash: string;
	text: string;
}): RoomView {
	const { room, inputHash, text } = args;
	if (room.state.mode !== 'quiz') throw new Error('Nieprawidłowy tryb pokoju.');
	if (room.state.status !== 'completed') throw new Error('Najpierw ukończ quiz.');
	room.state.aiSummary = { text, inputHash };
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
