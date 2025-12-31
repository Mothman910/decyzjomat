import type { DecisionCard } from '@/types/decisionCard';

export type RoomMode = 'match' | 'blind';

export type MatchDecision = 'like' | 'nope';
export type BlindPick = 'left' | 'right';

export type RoomParticipant = {
	clientId: string;
	joinedAt: number;
};

export type MatchRoomState = {
	mode: 'match';
	cards: DecisionCard[];
	decisionsByClientId: Record<string, Record<string, MatchDecision>>; // clientId -> cardId -> decision
	likesByClientId: Record<string, Record<string, true>>; // clientId -> cardId -> true
	matchedCardId: string | null;
};

export type BlindRound = {
	index: number;
	left: DecisionCard;
	right: DecisionCard;
};

export type BlindRoomState = {
	mode: 'blind';
	rounds: BlindRound[];
	picksByClientId: Record<string, Record<number, BlindPick>>; // clientId -> roundIndex -> pick
};

export type Room = {
	roomId: string;
	code: string;
	createdAt: number;
	participants: RoomParticipant[]; // max 2
	state: MatchRoomState | BlindRoomState;
};

export type RoomView = {
	roomId: string;
	code: string;
	createdAt: number;
	mode: RoomMode;
	participantsCount: number;
	participantClientIds: string[];
	maxParticipants: number;
	matchedCardId?: string | null;
	cards?: DecisionCard[];
	matchVotesByCardId?: Record<string, number>; // cardId -> how many participants voted (any decision)
	rounds?: BlindRound[];
	blindVotesByRoundIndex?: Record<string, number>; // roundIndex -> how many participants voted
	blindPicksByClientId?: Record<string, Record<number, BlindPick>>; // clientId -> roundIndex -> pick
	blindStats?: {
		completedRounds: number;
		totalRounds: number;
		matches: number;
		percent: number;
	};
};
