export type CardSource = 'manual' | 'link' | 'tmdb';

export type DecisionCardBase = {
	id: string;
	title: string;
	description?: string | null;
	imageUrl?: string | null;
	source: CardSource;
};

export type ManualCard = DecisionCardBase & {
	source: 'manual';
};

export type LinkCard = DecisionCardBase & {
	source: 'link';
	url: string;
};

export type TmdbCard = DecisionCardBase & {
	source: 'tmdb';
	tmdb: {
		movieId: number;
		genreIds: number[];
		releaseDate?: string | null;
		rating?: number | null;
	};
};

export type DecisionCard = ManualCard | LinkCard | TmdbCard;
