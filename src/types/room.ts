import type { DecisionCard } from '@/types/decisionCard';

export type RoomMode = 'match' | 'blind' | 'quiz';

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

export type QuizPackId = 'interiors' | 'lifestyle' | 'mix' | 'food' | 'activities';

export type QuizAxisId =
	| 'modernClassic'
	| 'minimalMaximal'
	| 'warmCool'
	| 'naturalIndustrial'
	| 'boldSafe'
	| 'budgetPremium'
	| 'planSpontaneous'
	| 'socialCozy';

export type QuizRunStatus = 'in_progress' | 'completed';

export type QuizSummary = {
	agreementPercent: number; // 0-100
	axisDiffs: Record<QuizAxisId, number>; // abs diffs
	topMatches: Array<{ axisId: QuizAxisId; diff: number }>;
	topFrictions: Array<{ axisId: QuizAxisId; diff: number }>;
};

export type QuizRoomState = {
	mode: 'quiz';
	quizId: 'gusty-v1';
	quizVersion: number;
	maxParticipants?: 1 | 2;
	packId: QuizPackId;
	questionIds: string[]; // length = 20
	currentIndex: number; // 0..20
	status: QuizRunStatus;
	answersByClientId: Record<string, Record<string, string>>; // clientId -> questionId -> optionId
	scoresByClientId: Record<string, Record<QuizAxisId, number>>; // clientId -> axisId -> score
	summary: QuizSummary | null;
	aiSummary?: { text: string; inputHash: string } | null;
};

export type Room = {
	roomId: string;
	code: string;
	createdAt: number;
	participants: RoomParticipant[]; // max 2
	maxParticipants?: 1 | 2;
	state: MatchRoomState | BlindRoomState | QuizRoomState;
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
	quiz?: {
		quizId: 'gusty-v1';
		quizVersion: number;
		maxParticipants?: 1 | 2;
		packId: QuizPackId;
		questionIds: string[];
		currentIndex: number;
		totalQuestions: number;
		status: QuizRunStatus;
		answersByClientId: Record<string, Record<string, string>>;
		scoresByClientId: Record<string, Record<QuizAxisId, number>>;
		votesByQuestionIndex: Record<string, number>; // index -> number of participants answered
		summary: QuizSummary | null;
		aiSummary?: { text: string; inputHash: string } | null;
	};
};
