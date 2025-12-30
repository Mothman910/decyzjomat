'use client';

import { useMemo, useState } from 'react';
import type { DecisionCard } from '@/types/decisionCard';

export function SwipeCardDeck(props: { cards: DecisionCard[] }) {
	const { cards } = props;
	const [index, setIndex] = useState(0);

	const current = cards[index] ?? null;
	const remaining = Math.max(0, cards.length - index - 1);

	const subtitle = useMemo(() => {
		if (!current) return 'Brak kart.';
		switch (current.source) {
			case 'tmdb':
				return 'Propozycja z TMDB';
			case 'link':
				return 'Dodane z linku';
			case 'manual':
				return 'Dodane ręcznie';
			default:
				return '';
		}
	}, [current]);

	if (!current) {
		return (
			<section className="w-full rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-black">
				<h2 className="text-lg font-semibold text-black dark:text-zinc-50">Talia</h2>
				<p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Brak kart do wyświetlenia.</p>
			</section>
		);
	}

	return (
		<section className="w-full rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-black">
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0">
					<h2 className="truncate text-lg font-semibold text-black dark:text-zinc-50">{current.title}</h2>
					<p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
				</div>
				<p className="text-xs text-zinc-500">Pozostało: {remaining}</p>
			</div>

			<div className="mt-4 overflow-hidden rounded-2xl border border-black/[.08] dark:border-white/[.145]">
				<div className="aspect-[2/3] w-full bg-zinc-100 dark:bg-zinc-900">
					<img
						src={current.imageUrl || '/globe.svg'}
						alt="Okładka"
						className="h-full w-full object-cover"
						loading="lazy"
					/>
				</div>
				{current.description ? (
					<p className="p-4 text-sm text-zinc-700 dark:text-zinc-300">{current.description}</p>
				) : null}
			</div>

			<div className="mt-4 flex gap-3">
				<button
					type="button"
					className="h-11 flex-1 rounded-full border border-black/[.08] px-5 text-sm font-medium text-black hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-white/[.06]"
					onClick={() => setIndex((i) => Math.min(cards.length - 1, i + 1))}
				>
					Pomiń
				</button>
				<button
					type="button"
					className="h-11 flex-1 rounded-full bg-black px-5 text-sm font-medium text-white dark:bg-zinc-50 dark:text-black"
					onClick={() => setIndex((i) => Math.min(cards.length - 1, i + 1))}
				>
					Wybieram
				</button>
			</div>
		</section>
	);
}
