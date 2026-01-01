'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Lightbulb, Loader2, X } from 'lucide-react';

type AiTipsContext = {
	topic: string;
	mode: 'match' | 'blind' | 'none';
	categoryLabel?: string | null;
	viewLabel?: string | null;
	waitingForPartner?: boolean;
	isReady?: boolean;
	// Kontekst treści (np. aktualna karta lub para w "Randce w ciemno")
	currentTitle?: string | null;
	leftTitle?: string | null;
	rightTitle?: string | null;
	leftDescription?: string | null;
	rightDescription?: string | null;
	// Jeśli true, wymuś nową poradę (bez cache).
	fresh?: boolean;
};

export function AiTipsFab(props: {
	context: AiTipsContext;
	className?: string;
}) {
	const { context, className } = props;
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [tips, setTips] = useState<string | null>(null);
	const lastKeyRef = useRef<string>('');
	const [refreshSeq, setRefreshSeq] = useState(0);

	const contextKey = useMemo(() => JSON.stringify(context), [context]);

	useEffect(() => {
		if (!open) return;
		if (refreshSeq === 0 && lastKeyRef.current === contextKey && tips) return;

		let cancelled = false;
		setLoading(true);
		setError(null);
		setTips(null);

		void (async () => {
			try {
				const res = await fetch('/api/ai-tips', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						...context,
						fresh: refreshSeq > 0,
					}),
				});
				const data = (await res.json()) as { tips?: string; error?: string };
				if (!res.ok) throw new Error(data.error || 'Nie udało się pobrać porad.');
				if (cancelled) return;
				lastKeyRef.current = contextKey;
				setTips(data.tips ?? null);
			} catch (e) {
				if (cancelled) return;
				setError(e instanceof Error ? e.message : 'Nieznany błąd.');
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [open, contextKey, tips, context, refreshSeq]);

	return (
		<div className={className}>
			{open ? (
				<div className="fixed bottom-20 left-4 z-50 w-[min(92vw,360px)] rounded-2xl border border-black/10 bg-black/80 p-4 text-white backdrop-blur dark:border-white/[.145]">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="text-sm font-semibold">Porady AI</p>
							<p className="mt-0.5 text-xs text-white/80">6–8 zdań inspiracji na teraz</p>
						</div>
						<button
							type="button"
							aria-label="Zamknij porady"
							onClick={() => setOpen(false)}
							className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/40"
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					<div className="mt-3 flex items-center justify-between gap-3">
						<button
							type="button"
							disabled={loading}
							onClick={() => setRefreshSeq((n) => n + 1)}
							className="inline-flex h-9 items-center gap-2 rounded-full bg-white/10 px-3 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-60"
							title="Wygeneruj świeżą poradę"
						>
							{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
							Nowa porada
						</button>
					</div>

					<div className="mt-3">
						{loading ? (
							<p className="inline-flex items-center gap-2 text-sm text-white/90">
								<Loader2 className="h-4 w-4 animate-spin" />
								Generuję wskazówki…
							</p>
						) : error ? (
							<p className="text-sm text-white/90">{error}</p>
						) : tips ? (
							<p className="whitespace-pre-wrap text-sm text-white/90">{tips}</p>
						) : (
							<p className="text-sm text-white/90">Brak treści.</p>
						)}
					</div>
				</div>
			) : null}

			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="fixed bottom-4 left-4 z-50 inline-flex h-12 items-center gap-2 rounded-full bg-black/80 px-4 text-sm font-semibold text-white backdrop-blur"
				aria-label="Porady AI"
				title="Porady AI"
			>
				<Lightbulb className="h-5 w-5" />
				Porady
			</button>
		</div>
	);
}
