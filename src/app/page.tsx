import { AddLinkForm } from '@/components/AddLinkForm';
import { SwipeCardDeck } from '@/components/SwipeCardDeck';
import { shuffle } from '@/lib/shuffle';
import { getRandomMovieCardsFromTmdb, TMDB_GENRES } from '@/lib/tmdb';
import type { DecisionCard } from '@/types/decisionCard';

export const dynamic = 'force-dynamic';

async function getInitialCards(): Promise<DecisionCard[]> {
  try {
    const tmdbCards = await getRandomMovieCardsFromTmdb({
      genreId: TMDB_GENRES.komedia,
      limit: 12,
    });
    return tmdbCards;
  } catch {
    // Brak klucza / błąd sieci — pokażemy przykładową talię lokalną.
    return [
      {
        id: 'manual:1',
        source: 'manual',
        title: 'Spacer i kawa',
        description: 'Krótki spacer + ulubiona kawiarnia.',
        imageUrl: '/globe.svg',
      },
      {
        id: 'manual:2',
        source: 'manual',
        title: 'Wieczór filmowy',
        description: 'Wybierzcie coś lekkiego i zróbcie popcorn.',
        imageUrl: '/globe.svg',
      },
      {
        id: 'manual:3',
        source: 'manual',
        title: 'Kolacja w domu',
        description: 'Wspólne gotowanie + muzyka w tle.',
        imageUrl: '/globe.svg',
      },
    ];
  }
}

export default async function Home() {
	const initial = await getInitialCards();
	const cards = shuffle(initial);

	return (
		<div className="min-h-screen bg-zinc-50 font-sans text-black dark:bg-black dark:text-zinc-50">
			<main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
				<header>
					<h1 className="text-2xl font-semibold tracking-tight">Couple Decision Maker</h1>
					<p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
						Importer linków (Open Graph) + generator pomysłów z TMDB + losowa kolejność talii.
					</p>
				</header>

        <AddLinkForm />

				<section className="w-full">
					<h2 className="mb-3 text-lg font-semibold">Tryb „Losuj”</h2>
					<SwipeCardDeck cards={cards} />
					<p className="mt-3 text-xs text-zinc-500">
						Jeśli nie ustawisz TMDB_API_KEY, zobaczysz lokalne przykłady.
					</p>
				</section>
			</main>
		</div>
	);
}
