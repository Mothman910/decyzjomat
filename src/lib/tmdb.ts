import { shuffle } from '@/lib/shuffle';
import type { DecisionCard, TmdbCard } from '@/types/decisionCard';

const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export const TMDB_GENRES = {
	komedia: 35,
	dramat: 18,
	action: 28,
	horror: 27,
	scienceFiction: 878,
	romance: 10749,
} as const;

export type TmdbGenreId = (typeof TMDB_GENRES)[keyof typeof TMDB_GENRES];

type TmdbDiscoverResponse = {
	page: number;
	total_pages: number;
	results: Array<{
		id: number;
		title: string;
		overview: string;
		poster_path: string | null;
		release_date?: string;
		vote_average?: number;
		genre_ids?: number[];
	}>;
};

function getTmdbApiKey(): string {
	const key = process.env.TMDB_API_KEY;
	if (!key) {
		throw new Error('Brak TMDB_API_KEY w zmiennych środowiskowych.');
	}
	return key;
}

function tmdbUrl(path: string, params: Record<string, string | number | boolean | undefined>): string {
	const url = new URL(`${TMDB_API_BASE}${path}`);
	for (const [k, v] of Object.entries(params)) {
		if (v === undefined) continue;
		url.searchParams.set(k, String(v));
	}
	return url.toString();
}

async function tmdbFetchJson<T>(url: string): Promise<T> {
	// Wymuszamy obecność klucza tutaj, żeby błąd był czytelny.
	getTmdbApiKey();
	const response = await fetch(url, {
		method: 'GET',
		headers: { accept: 'application/json' },
		cache: 'no-store',
	});

	if (!response.ok) {
		throw new Error(`TMDB error (HTTP ${response.status})`);
	}

	return (await response.json()) as T;
}

export async function getPopularMoviesByGenre(options: {
	genreId: number;
	language?: string;
	page?: number;
}): Promise<TmdbDiscoverResponse> {
	const { genreId, language = 'pl-PL', page = 1 } = options;
	const apiKey = getTmdbApiKey();

	const url = tmdbUrl('/discover/movie', {
		api_key: apiKey,
		sort_by: 'popularity.desc',
		include_adult: false,
		include_video: false,
		with_genres: genreId,
		language,
		page,
	});

	return tmdbFetchJson<TmdbDiscoverResponse>(url);
}

export async function getRandomMovieCardsFromTmdb(options: {
	genreId: number;
	limit: number;
	language?: string;
	maxPagesToSample?: number;
}): Promise<TmdbCard[]> {
	const { genreId, limit, language = 'pl-PL', maxPagesToSample = 10 } = options;

	// TMDB zazwyczaj pozwala na page 1..500, ale do „losuj” wystarczy mała próbka z top popular.
	const samplePage = Math.max(1, Math.floor(Math.random() * maxPagesToSample) + 1);
	const discover = await getPopularMoviesByGenre({ genreId, language, page: samplePage });

	const withPoster = discover.results.filter((m) => Boolean(m.poster_path));
	const shuffled = shuffle(withPoster);
	const picked = shuffled.slice(0, limit);

	return picked.map((movie) => {
		const imageUrl = movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null;
		return {
			id: `tmdb:${movie.id}`,
			source: 'tmdb',
			title: movie.title,
			description: movie.overview || null,
			imageUrl,
			tmdb: {
				movieId: movie.id,
				genreIds: movie.genre_ids ?? [genreId],
				releaseDate: movie.release_date ?? null,
				rating: movie.vote_average ?? null,
			},
		};
	});
}

export function asDecisionCards(cards: DecisionCard[]): DecisionCard[] {
	// Helper na przyszłość – pozwala typować „talię” jako DecisionCard[]
	return cards;
}
