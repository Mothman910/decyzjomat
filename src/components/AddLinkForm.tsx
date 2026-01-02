'use client';
import { useEffect, useMemo, useState } from 'react';

type ScrapeMetadataSuccess = {
	success: true;
	url: string;
	title: string | null;
	description: string | null;
	image: string | null;
};

type ScrapeMetadataFailure = {
	success: false;
	url: string;
	title: string | null;
	description: string | null;
	image: string;
	error: string;
};

type ScrapeMetadataResponse = ScrapeMetadataSuccess | ScrapeMetadataFailure;

export function AddLinkForm() {
	const [url, setUrl] = useState('');
	const [loading, setLoading] = useState(false);
	const [preview, setPreview] = useState<ScrapeMetadataResponse | null>(null);

	const canFetch = useMemo(() => url.trim().startsWith('http://') || url.trim().startsWith('https://'), [url]);

	useEffect(() => {
		if (!canFetch) {
			setPreview(null);
			return;
		}

		const handle = setTimeout(async () => {
			setLoading(true);
			try {
				const res = await fetch('/api/scrape-metadata', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ url: url.trim() }),
				});

				const data = (await res.json()) as ScrapeMetadataResponse;
				setPreview(data);
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Nieznany błąd.';
				setPreview({
					success: false,
					url: url.trim(),
					title: null,
					description: null,
					image: '/globe.svg',
					error: message,
				});
			} finally {
				setLoading(false);
			}
		}, 500);

		return () => clearTimeout(handle);
	}, [url, canFetch]);

	const previewTitle = preview?.title ?? (canFetch ? 'Podgląd linku' : 'Wklej URL');
	const previewImage = preview
		? preview.success
			? preview.image || '/globe.svg'
			: preview.image
		: '/globe.svg';

	return (
		<section className="w-full rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-black">
			<h2 className="text-lg font-semibold text-black dark:text-zinc-50">Dodaj link</h2>
			<p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
				Wklej adres URL, a podgląd karty uzupełni się automatycznie.
			</p>

			<label className="mt-4 block text-sm font-medium text-black dark:text-zinc-50" htmlFor="url">
				URL
			</label>
			<input
				id="url"
				value={url}
				onChange={(e) => setUrl(e.target.value)}
				placeholder="https://..."
				className="mt-2 w-full rounded-xl border border-black/[.08] bg-transparent px-4 py-3 text-sm text-black outline-none focus:ring-2 focus:ring-black/10 dark:border-white/[.145] dark:text-zinc-50 dark:focus:ring-white/20"
				autoComplete="off"
				autoCapitalize="none"
				autoCorrect="off"
				spellCheck={false}
			/>

			<div className="mt-4 flex items-center gap-4 rounded-2xl border border-black/[.08] p-4 dark:border-white/[.145]">
				<div className="h-16 w-16 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
					<img src={previewImage} alt="Okładka" className="h-full w-full object-cover" />
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<p className="truncate text-sm font-semibold text-black dark:text-zinc-50">{previewTitle}</p>
						{loading ? <span className="text-xs text-zinc-500">Ładowanie…</span> : null}
					</div>
					{preview && !preview.success ? (
						<p className="mt-1 line-clamp-2 text-xs text-zinc-500">{preview.error}</p>
					) : preview?.description ? (
						<p className="mt-1 line-clamp-2 text-xs text-zinc-500">{preview.description}</p>
					) : (
						<p className="mt-1 line-clamp-2 text-xs text-zinc-500">Brak opisu.</p>
					)}
				</div>
			</div>

			<button
				type="button"
				disabled={!preview || !preview.success}
				onClick={() => {
					if (!preview || !preview.success) return;
					// Placeholder for DB persistence.
					// eslint-disable-next-line no-alert
					alert(`Gotowe do zapisu: ${preview.title ?? preview.url}`);
				}}
				className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-black px-5 text-sm font-medium text-white transition-[transform,background-color,color,opacity] duration-200 ease-out will-change-transform enabled:cursor-pointer disabled:cursor-not-allowed active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 supports-[hover:hover]:hover:-translate-y-0.5 supports-[hover:hover]:hover:opacity-95 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:focus-visible:ring-white/30"
			>
				Zapisz do bazy
			</button>
		</section>
	);
}
