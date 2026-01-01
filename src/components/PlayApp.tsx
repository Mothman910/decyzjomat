'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Copy, Heart, Maximize2, Minimize2, X } from 'lucide-react';
import type { DecisionCard } from '@/types/decisionCard';
import type { QuizAxisId, QuizPackId, RoomMode, RoomView } from '@/types/room';
import { AiTipsFab } from '@/components/AiTipsFab';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { QUIZ_PACKS, getAxisLabel, getQuestionById } from '@/lib/quizBank';
import { WORD_PAIRS_SUBCATEGORIES, type WordPairsSubcategoryId } from '@/lib/wordPairs';
import styles from './PlayApp.module.css';

const ROOM_CATEGORIES: Array<{ label: string; genreId: number }> = [
	{ label: 'Komedia', genreId: 35 },
	{ label: 'Thriller', genreId: 53 },
	{ label: 'Romans', genreId: 10749 },
	{ label: 'Dramat', genreId: 18 },
	{ label: 'Akcja', genreId: 28 },
	{ label: 'Przygodowy', genreId: 12 },
	{ label: 'Familijny', genreId: 10751 },
	{ label: 'Fantasy', genreId: 14 },
	{ label: 'Horror', genreId: 27 },
	{ label: 'Sci-Fi', genreId: 878 },
];

async function copyToClipboard(text: string): Promise<void> {
	if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(text);
		return;
	}

	// Fallback
	const ta = document.createElement('textarea');
	ta.value = text;
	ta.style.position = 'fixed';
	ta.style.left = '-9999px';
	document.body.appendChild(ta);
	ta.focus();
	ta.select();
	document.execCommand('copy');
	document.body.removeChild(ta);
}

function getOrCreateClientId(): string {
	if (typeof window === 'undefined') return 'server';
	const key = 'decyzjomat:clientId';
	const existing = window.localStorage.getItem(key);
	if (existing) return existing;
	const created = safeRandomUUID();
	window.localStorage.setItem(key, created);
	return created;
}

function safeRandomUUID(): string {
	// `crypto.randomUUID()` nie jest dostępne w części przeglądarek mobilnych.
	const c = globalThis.crypto as Crypto | undefined;
	if (c?.randomUUID) return c.randomUUID();

	// Fallback: UUIDv4 z getRandomValues
	if (c?.getRandomValues) {
		const bytes = new Uint8Array(16);
		c.getRandomValues(bytes);
		bytes[6] = (bytes[6] & 0x0f) | 0x40;
		bytes[8] = (bytes[8] & 0x3f) | 0x80;
		const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
		return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
	}

	// Ostateczny fallback (niekryptograficzny) — wystarczy na identyfikator klienta w dev/MVP.
	return `fallback-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	});
	const data = (await res.json()) as T;
	if (!res.ok) {
		const message = (data as { error?: string } | null)?.error ?? 'Request failed';
		throw new Error(message);
	}
	return data;
}

function downloadJson(filename: string, data: unknown) {
	const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

function useRoomStream(roomId: string | null, onUpdate: (room: RoomView) => void) {
	useEffect(() => {
		if (!roomId) return;

		const es = new EventSource(`/api/rooms/stream?roomId=${encodeURIComponent(roomId)}`);
		es.onmessage = (event) => {
			try {
				const payload = JSON.parse(event.data) as { type: string; room?: RoomView };
				if (payload.type === 'room:update' && payload.room) onUpdate(payload.room);
			} catch {
				// ignore
			}
		};
		es.onerror = () => {
			// Browser will auto-reconnect.
		};

		return () => {
			es.close();
		};
	}, [roomId, onUpdate]);
}

function MatchHeartButtons(props: { onNope: () => void; onLike: () => void; disabled?: boolean }) {
	const { onNope, onLike, disabled } = props;
	return (
		<div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-8">
			<button
				type="button"
				disabled={disabled}
				onClick={onNope}
				aria-label="Nie"
				className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur disabled:opacity-50"
			>
				<X className="h-7 w-7" />
			</button>
			<button
				type="button"
				disabled={disabled}
				onClick={onLike}
				aria-label="Tak"
				className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur disabled:opacity-50"
			>
				<Heart className="h-7 w-7" />
			</button>
		</div>
	);
}

function ExpandableDescription(props: {
	text: string;
	expanded: boolean;
	onToggle: () => void;
}) {
	const { text, expanded, onToggle } = props;
	return (
		<div className="mt-1">
			<p className={expanded ? 'text-sm text-white/90 drop-shadow' : 'line-clamp-2 text-sm text-white/90 drop-shadow'}>
				{text}
			</p>
			<button
				type="button"
				onPointerDown={(e) => e.stopPropagation()}
				onClick={(e) => {
					e.stopPropagation();
					onToggle();
				}}
				className="mt-1 text-xs font-semibold text-white/90 underline underline-offset-2"
			>
				{expanded ? 'Mniej' : 'Więcej'}
			</button>
		</div>
	);
}

function TinderCard(props: {
	card: DecisionCard;
	onNope: () => void;
	onLike: () => void;
	disabled?: boolean;
	badge?: string | null;
	expanded: boolean;
	onToggleExpanded: () => void;
}) {
	const { card, onNope, onLike, disabled, badge, expanded, onToggleExpanded } = props;
	const ref = useRef<HTMLDivElement | null>(null);
	const start = useRef<{ x: number; y: number } | null>(null);
	const [dx, setDx] = useState(0);
	const [dragging, setDragging] = useState(false);

	const onPointerDown = (e: React.PointerEvent) => {
		if (disabled) return;
		start.current = { x: e.clientX, y: e.clientY };
		setDragging(true);
		(ref.current as HTMLDivElement | null)?.setPointerCapture(e.pointerId);
	};

	const onPointerMove = (e: React.PointerEvent) => {
		if (!dragging || !start.current) return;
		setDx(e.clientX - start.current.x);
	};

	const onPointerUp = () => {
		if (!dragging) return;
		setDragging(false);
		const threshold = 90;
		if (dx <= -threshold) onNope();
		else if (dx >= threshold) onLike();
		setDx(0);
		start.current = null;
	};

	useEffect(() => {
		if (!ref.current) return;
		const rotate = Math.max(-10, Math.min(10, dx / 12));
		ref.current.style.transform = `translateX(${dx}px) rotate(${rotate}deg)`;
		ref.current.style.transition = dragging ? 'none' : 'transform 180ms ease';
	}, [dx, dragging]);

	const imageSrc = card.imageUrl || '/globe.svg';

	return (
		<div
			ref={ref}
			className="relative w-full select-none overflow-hidden rounded-3xl border border-black/8 bg-zinc-100 dark:border-white/[.145] dark:bg-zinc-900"
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerUp}
		>
			<div className="relative aspect-2/3 w-full">
				<Image
					src={imageSrc}
					alt={card.title}
					fill
					sizes="(max-width: 768px) 100vw, 420px"
					className="object-cover"
					unoptimized
				/>
				<div className="absolute inset-x-0 top-0 p-4">
					{badge ? (
						<div className="inline-flex rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
							{badge}
						</div>
					) : null}
				</div>

				<div className="absolute inset-x-0 bottom-0 p-4">
					<div className="inline-flex max-w-full flex-col rounded-2xl bg-black/65 p-3 text-white backdrop-blur">
						<h2 className="text-lg font-semibold">{card.title}</h2>
						{card.description ? (
							<ExpandableDescription text={card.description} expanded={expanded} onToggle={onToggleExpanded} />
						) : null}
					</div>
				</div>

				<MatchHeartButtons onNope={onNope} onLike={onLike} disabled={disabled} />
			</div>
		</div>
	);
}

function BlindRoundView(props: {
	left: DecisionCard;
	right: DecisionCard;
	onPickLeft: () => void;
	onPickRight: () => void;
	disabled?: boolean;
	statsText: string;
	leftPopKey?: number | null;
	rightPopKey?: number | null;
}) {
	const {
		left,
		right,
		onPickLeft,
		onPickRight,
		disabled,
		statsText,
		leftPopKey,
		rightPopKey,
	} = props;
	const [showLeftDescription, setShowLeftDescription] = useState(false);
	const [showRightDescription, setShowRightDescription] = useState(false);

	const leftSrc = left.imageUrl || '/globe.svg';
	const rightSrc = right.imageUrl || '/globe.svg';
	return (
		<div className="w-full">
			<div className="mb-2 flex items-center justify-between">
				<p className="text-sm font-semibold">Randka w ciemno</p>
				<p className="text-xs text-zinc-500">{statsText}</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="relative overflow-hidden rounded-3xl border border-black/8 bg-zinc-100 dark:border-white/[.145] dark:bg-zinc-900">
					{showLeftDescription && left.description ? (
						<div
							role="dialog"
							aria-label="Opis karty"
							className="absolute inset-0 z-20 flex items-end p-4"
							onPointerDown={(e) => e.stopPropagation()}
							onClick={(e) => e.stopPropagation()}
						>
							<button
								type="button"
								aria-label="Zamknij opis"
								onClick={() => setShowLeftDescription(false)}
								className="absolute inset-0 bg-black/45 backdrop-blur-sm"
							/>
							<div className="relative w-full rounded-2xl bg-black/70 p-4 text-white backdrop-blur">
								<div className="flex items-center justify-between gap-3">
									<p className="text-sm font-semibold">Opis</p>
									<button
										type="button"
										aria-label="Zamknij"
										onPointerDown={(e) => e.stopPropagation()}
										onClick={(e) => {
											e.stopPropagation();
											setShowLeftDescription(false);
										}}
										className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/40"
									>
										<X className="h-5 w-5" />
									</button>
								</div>
								<p className="mt-2 text-sm text-white/90">{left.description}</p>
							</div>
						</div>
					) : null}
					<div className="relative aspect-2/3 w-full">
						<Image
							src={leftSrc}
							alt={left.title}
							fill
							sizes="(max-width: 768px) 100vw, 420px"
							className="object-cover"
							unoptimized
						/>
					</div>

					{leftPopKey ? (
						<div key={leftPopKey} className="pointer-events-none absolute inset-0 flex items-center justify-center">
							<span
								className={`${styles.choicePop} inline-flex h-16 w-16 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur`}
							>
								<Heart className="h-8 w-8" />
							</span>
						</div>
					) : null}

					<div className="absolute inset-x-0 bottom-0 p-4">
						<div className="inline-flex max-w-full flex-col rounded-2xl bg-black/65 p-3 text-white backdrop-blur">
							<h2 className="text-lg font-semibold">{left.title}</h2>
							<div className="mt-2">
								<button
									type="button"
									disabled={!left.description}
									onPointerDown={(e) => e.stopPropagation()}
									onClick={(e) => {
										e.stopPropagation();
										setShowLeftDescription((v) => !v);
									}}
									title={!left.description ? 'Brak opisu.' : undefined}
									className="text-left text-xs font-semibold text-white/90 underline underline-offset-2 disabled:opacity-60"
								>
									Zobacz opis
								</button>
							</div>
						</div>
					</div>
					<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
						<button
							type="button"
							disabled={disabled}
							onClick={onPickLeft}
							aria-label="Wybierz lewą kartę"
							className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur disabled:opacity-50"
						>
							<Heart className="h-7 w-7" />
						</button>
					</div>
				</div>

				<div className="relative overflow-hidden rounded-3xl border border-black/8 bg-zinc-100 dark:border-white/[.145] dark:bg-zinc-900">
					{showRightDescription && right.description ? (
						<div
							role="dialog"
							aria-label="Opis karty"
							className="absolute inset-0 z-20 flex items-end p-4"
							onPointerDown={(e) => e.stopPropagation()}
							onClick={(e) => e.stopPropagation()}
						>
							<button
								type="button"
								aria-label="Zamknij opis"
								onClick={() => setShowRightDescription(false)}
								className="absolute inset-0 bg-black/45 backdrop-blur-sm"
							/>
							<div className="relative w-full rounded-2xl bg-black/70 p-4 text-white backdrop-blur">
								<div className="flex items-center justify-between gap-3">
									<p className="text-sm font-semibold">Opis</p>
									<button
										type="button"
										aria-label="Zamknij"
										onPointerDown={(e) => e.stopPropagation()}
										onClick={(e) => {
											e.stopPropagation();
											setShowRightDescription(false);
										}}
										className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/40"
									>
										<X className="h-5 w-5" />
									</button>
								</div>
								<p className="mt-2 text-sm text-white/90">{right.description}</p>
							</div>
						</div>
					) : null}
					<div className="relative aspect-2/3 w-full">
						<Image
							src={rightSrc}
							alt={right.title}
							fill
							sizes="(max-width: 768px) 100vw, 420px"
							className="object-cover"
							unoptimized
						/>
					</div>

					{rightPopKey ? (
						<div key={rightPopKey} className="pointer-events-none absolute inset-0 flex items-center justify-center">
							<span
								className={`${styles.choicePop} inline-flex h-16 w-16 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur`}
							>
								<Heart className="h-8 w-8" />
							</span>
						</div>
					) : null}

					<div className="absolute inset-x-0 bottom-0 p-4">
						<div className="inline-flex max-w-full flex-col rounded-2xl bg-black/65 p-3 text-white backdrop-blur">
							<h2 className="text-lg font-semibold">{right.title}</h2>
							<div className="mt-2">
								<button
									type="button"
									disabled={!right.description}
									onPointerDown={(e) => e.stopPropagation()}
									onClick={(e) => {
										e.stopPropagation();
										setShowRightDescription((v) => !v);
									}}
									title={!right.description ? 'Brak opisu.' : undefined}
									className="text-left text-xs font-semibold text-white/90 underline underline-offset-2 disabled:opacity-60"
								>
									Zobacz opis
								</button>
							</div>
						</div>
					</div>
					<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
						<button
							type="button"
							disabled={disabled}
							onClick={onPickRight}
							aria-label="Wybierz prawą kartę"
							className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur disabled:opacity-50"
						>
							<Heart className="h-7 w-7" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function BlindSummaryView(props: {
	meClientId: string;
	participantClientIds: string[];
	rounds: NonNullable<RoomView['rounds']>;
	picksByClientId: NonNullable<RoomView['blindPicksByClientId']>;
	percent: number;
	matches: number;
	totalRounds: number;
}) {
	const { meClientId, participantClientIds, rounds, picksByClientId, percent, matches, totalRounds } = props;
	const partnerId = participantClientIds.find((id) => id !== meClientId) ?? null;

	const pickLabel = (round: (typeof rounds)[number], cid: string | null) => {
		if (!cid) return '—';
		const pick = picksByClientId[cid]?.[round.index];
		if (pick === 'left') return round.left.title;
		if (pick === 'right') return round.right.title;
		return '—';
	};

	return (
		<div className="w-full">
			<div className="mb-2 flex items-center justify-between">
				<p className="text-sm font-semibold">Podsumowanie</p>
				<p className="text-xs text-zinc-500">
					Zgodność: {percent}% ({matches}/{totalRounds})
				</p>
			</div>

			<div className="flex flex-col gap-2">
				{rounds.map((r) => {
					const me = picksByClientId[meClientId]?.[r.index];
					const partner = partnerId ? picksByClientId[partnerId]?.[r.index] : undefined;
					const isMatch = Boolean(me && partner && me === partner);
					return (
						<div
							key={r.index}
							className="rounded-2xl border border-black/8 bg-white p-3 dark:border-white/[.145] dark:bg-black"
						>
							<div className="flex items-center justify-between gap-2">
								<p className="text-xs font-semibold text-zinc-500">Runda {r.index + 1}</p>
								{isMatch ? <Heart className="h-4 w-4" fill="currentColor" /> : null}
							</div>
							<p className="mt-1 text-sm font-semibold">{r.left.title}</p>
							<p className="text-sm font-semibold">vs {r.right.title}</p>
							<div className="mt-2 flex items-center justify-between gap-3 text-xs text-zinc-500">
								<p>Ty: {pickLabel(r, meClientId)}</p>
								<p>Partner: {pickLabel(r, partnerId)}</p>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export function PlayApp() {
	const [clientId, setClientId] = useState<string>('');
	useEffect(() => setClientId(getOrCreateClientId()), []);

	const [mode, setMode] = useState<RoomMode>('match');
	const [matchGenreId, setMatchGenreId] = useState<number>(35);
	const [blindGenreId, setBlindGenreId] = useState<number>(10749);
	const [quizPackId, setQuizPackId] = useState<QuizPackId>('mix');
	const [blindParent, setBlindParent] = useState<'movies' | 'words'>('movies');
	const [blindWordsSubcategory, setBlindWordsSubcategory] = useState<WordPairsSubcategoryId>('adjectives');
	const [categoryOpen, setCategoryOpen] = useState(false);
	const categoryRef = useRef<HTMLDivElement | null>(null);
	const [code, setCode] = useState('');
	const [room, setRoom] = useState<RoomView | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [quizAiLoading, setQuizAiLoading] = useState(false);
	const [quizAiError, setQuizAiError] = useState<string | null>(null);
	const [copiedCode, setCopiedCode] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);

	useEffect(() => {
		if (!categoryOpen) return;
		const onPointerDown = (e: PointerEvent) => {
			const target = e.target as Node | null;
			if (!target) return;
			if (!categoryRef.current?.contains(target)) setCategoryOpen(false);
		};
		document.addEventListener('pointerdown', onPointerDown);
		return () => document.removeEventListener('pointerdown', onPointerDown);
	}, [categoryOpen]);

	useEffect(() => {
		const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
		onChange();
		document.addEventListener('fullscreenchange', onChange);
		return () => document.removeEventListener('fullscreenchange', onChange);
	}, []);

	async function toggleFullscreen() {
		try {
			if (document.fullscreenElement) {
				await document.exitFullscreen();
				return;
			}
			await document.documentElement.requestFullscreen();
		} catch {
			// ignore
		}
	}

	const handleRoomUpdate = useCallback((next: RoomView) => setRoom(next), []);
	useRoomStream(room?.roomId ?? null, handleRoomUpdate);

	const isReady = room?.participantsCount === 2;
	const isMatched = room?.mode === 'match' && Boolean(room.matchedCardId);

	const matchCard = useMemo(() => {
		if (!room || room.mode !== 'match') return null;
		if (!room.matchedCardId) return null;
		return room.cards?.find((c) => c.id === room.matchedCardId) ?? null;
	}, [room]);

	const [myMatchVotedIds, setMyMatchVotedIds] = useState<Set<string>>(() => new Set());
	const [myBlindVotedRoundIndexes, setMyBlindVotedRoundIndexes] = useState<Set<number>>(() => new Set());
	useEffect(() => {
		setMyMatchVotedIds(new Set());
		setMyBlindVotedRoundIndexes(new Set());
	}, [room?.roomId, room?.mode]);

	useEffect(() => {
		setQuizAiLoading(false);
		setQuizAiError(null);
	}, [room?.roomId, room?.mode]);

	const currentMatchCard = useMemo(() => {
		if (!room || room.mode !== 'match') return null;
		const cards = room.cards ?? [];
		if (cards.length === 0) return null;
		return cards.find((c) => (room.matchVotesByCardId?.[c.id] ?? 0) < 2) ?? null;
	}, [room]);

	const currentRound = useMemo(() => {
		if (!room || room.mode !== 'blind') return null;
		const rounds = room.rounds ?? [];
		if (rounds.length === 0) return null;
		return rounds.find((r) => (room.blindVotesByRoundIndex?.[String(r.index)] ?? 0) < 2) ?? null;
	}, [room]);

	const blindIsFinished = useMemo(() => {
		if (!room || room.mode !== 'blind' || !room.blindStats) return false;
		return room.participantsCount === 2 && room.blindStats.completedRounds === room.blindStats.totalRounds;
	}, [room]);

	const statsText = useMemo(() => {
		if (!room || room.mode !== 'blind' || !room.blindStats) return '';
		return `Zgodność: ${room.blindStats.percent}% (${room.blindStats.matches}/${room.blindStats.completedRounds || 0})`;
	}, [room]);

	const waitingForPartner = useMemo(() => {
		if (!room) return false;
		if (room.participantsCount !== 2) return false;
		if (room.mode === 'match') {
			if (!currentMatchCard) return false;
			const votes = room.matchVotesByCardId?.[currentMatchCard.id] ?? 0;
			return myMatchVotedIds.has(currentMatchCard.id) && votes < 2;
		}

		if (!currentRound) return false;
		const votes = room.blindVotesByRoundIndex?.[String(currentRound.index)] ?? 0;
		return myBlindVotedRoundIndexes.has(currentRound.index) && votes < 2;
	}, [room, currentMatchCard, currentRound, myMatchVotedIds, myBlindVotedRoundIndexes]);

	const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(() => new Set());
	useEffect(() => {
		setExpandedCardIds(new Set());
	}, [room?.roomId, room?.mode]);

	const [blindPop, setBlindPop] = useState<{ roundIndex: number; side: 'left' | 'right'; key: number } | null>(null);
	const blindPopSeq = useRef(0);
	const triggerBlindPop = (roundIndex: number, side: 'left' | 'right') => {
		blindPopSeq.current += 1;
		const key = blindPopSeq.current;
		setBlindPop({ roundIndex, side, key });
		window.setTimeout(() => {
			setBlindPop((prev) => (prev?.key === key ? null : prev));
		}, 650);
	};

	async function createNewRoom() {
		setError(null);
		setLoading(true);
		try {
			const genreId = mode === 'match' ? matchGenreId : blindGenreId;
			const res = await postJson<{ room: RoomView }>('/api/rooms', {
				mode,
				clientId,
				genreId: mode === 'quiz' ? undefined : genreId,
				blindTopic: mode === 'blind' ? blindParent : undefined,
				wordsSubcategory: mode === 'blind' && blindParent === 'words' ? blindWordsSubcategory : undefined,
				packId: mode === 'quiz' ? quizPackId : undefined,
			});
			setRoom(res.room);
			setCode(res.room.code);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Nieznany błąd.');
		} finally {
			setLoading(false);
		}
	}

	const selectedGenreId = mode === 'match' ? matchGenreId : blindGenreId;
	const selectedMovieCategoryLabel = ROOM_CATEGORIES.find((c) => c.genreId === selectedGenreId)?.label ?? 'Wybierz…';
	const selectedWordsCategoryLabel =
		WORD_PAIRS_SUBCATEGORIES.find((s) => s.id === blindWordsSubcategory)?.label ?? 'Wybierz…';
	const selectedQuizPackLabel = QUIZ_PACKS[quizPackId]?.label ?? 'Wybierz…';
	const selectedCategoryLabel =
		mode === 'quiz'
			? selectedQuizPackLabel
			: mode === 'blind' && blindParent === 'words'
				? selectedWordsCategoryLabel
				: selectedMovieCategoryLabel;
	const setSelectedGenreId = (next: number) => {
		if (mode === 'quiz') return;
		if (mode === 'match') setMatchGenreId(next);
		else setBlindGenreId(next);
	};

	const inferredBlindTopic = useMemo<'movies' | 'words' | null>(() => {
		if (!room || room.mode !== 'blind') return null;
		const r0 = room.rounds?.[0];
		if (!r0) return 'movies';
		const isWords = r0.left.source === 'manual' && r0.right.source === 'manual';
		return isWords ? 'words' : 'movies';
	}, [room]);

	const tipsTopic = room?.mode === 'blind' ? (inferredBlindTopic ?? blindParent) : 'movies';
	const tipsCategoryLabel =
		tipsTopic === 'words'
			? WORD_PAIRS_SUBCATEGORIES.find((s) => s.id === blindWordsSubcategory)?.label ?? null
			: selectedMovieCategoryLabel;

	async function handleCopyRoomCode() {
		if (!room?.code) return;
		try {
			await copyToClipboard(room.code);
			setCopiedCode(true);
			window.setTimeout(() => setCopiedCode(false), 1200);
		} catch {
			// ignore
		}
	}

	async function joinExistingRoom() {
		setError(null);
		setLoading(true);
		try {
			const res = await postJson<{ room: RoomView }>('/api/rooms/join', {
				code: code.trim(),
				clientId,
			});
			setRoom(res.room);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Nieznany błąd.');
		} finally {
			setLoading(false);
		}
	}

	async function submitMatch(decision: 'like' | 'nope') {
		if (!room || room.mode !== 'match' || !currentMatchCard) return;
		setMyMatchVotedIds((prev) => {
			const next = new Set(prev);
			next.add(currentMatchCard.id);
			return next;
		});
		await postJson<{ room: RoomView }>('/api/rooms/choice', {
			roomId: room.roomId,
			clientId,
			mode: 'match',
			cardId: currentMatchCard.id,
			decision,
		});
	}

	async function submitBlind(pick: 'left' | 'right') {
		if (!room || room.mode !== 'blind' || !currentRound) return;
		setMyBlindVotedRoundIndexes((prev) => {
			const next = new Set(prev);
			next.add(currentRound.index);
			return next;
		});
		triggerBlindPop(currentRound.index, pick === 'left' ? 'left' : 'right');
		await postJson<{ room: RoomView }>('/api/rooms/choice', {
			roomId: room.roomId,
			clientId,
			mode: 'blind',
			roundIndex: currentRound.index,
			pick,
		});
	}

	const quizAxes: QuizAxisId[] = useMemo(
		() => [
			'modernClassic',
			'minimalMaximal',
			'warmCool',
			'naturalIndustrial',
			'boldSafe',
			'budgetPremium',
			'planSpontaneous',
			'socialCozy',
		],
		[]
	);

	const currentQuizQuestion = useMemo(() => {
		if (!room || room.mode !== 'quiz' || !room.quiz) return null;
		const qid = room.quiz.questionIds[room.quiz.currentIndex];
		if (!qid) return null;
		return getQuestionById(qid);
	}, [room]);

	const myQuizAnswer = useMemo(() => {
		if (!room || room.mode !== 'quiz' || !room.quiz) return null;
		const qid = room.quiz.questionIds[room.quiz.currentIndex];
		if (!qid) return null;
		return room.quiz.answersByClientId?.[clientId]?.[qid] ?? null;
	}, [room, clientId]);

	async function submitQuiz(optionId: string) {
		if (!room || room.mode !== 'quiz' || !room.quiz) return;
		const qid = room.quiz.questionIds[room.quiz.currentIndex];
		if (!qid) return;
		await postJson<{ room: RoomView }>('/api/rooms/quiz/answer', {
			roomId: room.roomId,
			clientId,
			questionId: qid,
			optionId,
		});
	}

	async function generateQuizAiSummary(fresh = false) {
		if (!room || room.mode !== 'quiz' || !room.quiz) return;
		setQuizAiError(null);
		setQuizAiLoading(true);
		try {
			const res = await postJson<{ room: RoomView; cached?: boolean }>('/api/rooms/quiz/ai-summary', {
				roomId: room.roomId,
				fresh,
			});
			setRoom(res.room);
		} catch (e) {
			setQuizAiError(e instanceof Error ? e.message : 'Nieznany błąd.');
		} finally {
			setQuizAiLoading(false);
		}
	}

	return (
		<div className="relative min-h-screen font-sans text-zinc-50">
			<AnimatedBackground text="❤️ MADE WITH LOVE ❤️" />
			<div className="relative z-10 min-h-screen">
			{mode !== 'quiz' && room?.mode !== 'quiz' ? (
			<AiTipsFab
				context={{
					topic: tipsTopic,
					mode: room?.mode ?? 'none',
					categoryLabel: tipsCategoryLabel,
					viewLabel:
						room?.mode === 'blind'
							? tipsTopic === 'words'
								? 'Randka w ciemno — Hasła'
								: 'Randka w ciemno'
							: room?.mode === 'match'
								? 'Pierwszy match'
								: 'Start',
					waitingForPartner,
					isReady,
					currentTitle: room?.mode === 'match' ? (currentMatchCard?.title ?? null) : null,
					leftTitle: room?.mode === 'blind' ? (currentRound?.left.title ?? null) : null,
					rightTitle: room?.mode === 'blind' ? (currentRound?.right.title ?? null) : null,
					leftDescription: room?.mode === 'blind' ? (currentRound?.left.description ?? null) : null,
					rightDescription: room?.mode === 'blind' ? (currentRound?.right.description ?? null) : null,
				}}
			/>
			) : null}
			<button
				type="button"
				onClick={() => void toggleFullscreen()}
				className="fixed bottom-4 right-4 z-50 inline-flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white/90 backdrop-blur-xl"
				aria-label={isFullscreen ? 'Wyjdź z pełnego ekranu' : 'Pełny ekran'}
				title={isFullscreen ? 'Wyjdź z pełnego ekranu' : 'Pełny ekran'}
			>
				{isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
				{isFullscreen ? 'Zwiń' : 'Pełny ekran'}
			</button>
			<main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-6">
				<header className="flex items-start justify-between gap-3">
					<div>
						<h1 className={`${styles.brandTitle} text-3xl tracking-tight text-white/95 mb-3.5`}>
							Decyzjomat dla par 💕
						</h1>
						<p className="mt-1 text-xs text-white/60">Tryb Tinder + porównanie wyborów na 2 urządzeniach</p>
					</div>
					<div className="text-right">
						<p className="text-[11px] text-white/50">ID: {clientId.slice(0, 6)}…</p>
						{room ? <p className="text-[11px] text-white/50">Kod: {room.code}</p> : null}
					</div>
				</header>

				<section className="relative z-20 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => setMode('match')}
							className={`h-10 flex-1 rounded-full text-sm font-semibold ${
								mode === 'match'
									? 'border border-white/10 bg-white/15 text-white'
									: 'border border-white/10 bg-white/5 text-white/80'
							}`}
						>
							Pierwszy match
						</button>
						<button
							type="button"
							onClick={() => setMode('blind')}
							className={`h-10 flex-1 rounded-full text-sm font-semibold ${
								mode === 'blind'
									? 'border border-white/10 bg-white/15 text-white'
									: 'border border-white/10 bg-white/5 text-white/80'
							}`}
						>
							Randka w ciemno
						</button>
						<button
							type="button"
							onClick={() => {
								setMode('quiz');
								setCategoryOpen(false);
							}}
							className={`h-10 flex-1 rounded-full text-sm font-semibold ${
								mode === 'quiz'
									? 'border border-white/10 bg-white/15 text-white'
									: 'border border-white/10 bg-white/5 text-white/80'
							}`}
						>
							Gusty
						</button>
					</div>

					{mode === 'blind' ? (
						<div className="mt-3">
							<p className="text-xs font-semibold text-white/60">Źródło</p>
							<div className="mt-1 flex gap-2">
								<button
									type="button"
									onClick={() => {
										setBlindParent('movies');
										setCategoryOpen(false);
									}}
									className={`h-10 flex-1 rounded-full text-sm font-semibold ${
										blindParent === 'movies'
											? 'border border-white/10 bg-white/15 text-white'
											: 'border border-white/10 bg-white/5 text-white/80'
									}`}
								>
									Filmy
								</button>
								<button
									type="button"
									onClick={() => {
										setBlindParent('words');
										setCategoryOpen(false);
									}}
									className={`h-10 flex-1 rounded-full text-sm font-semibold ${
										blindParent === 'words'
											? 'border border-white/10 bg-white/15 text-white'
											: 'border border-white/10 bg-white/5 text-white/80'
									}`}
								>
									Hasła
								</button>
							</div>
						</div>
					) : null}

					<div className="mt-3">
						<label className="text-xs font-semibold text-white/60" htmlFor="room-category">
							{mode === 'quiz'
								? 'Pakiet'
								: mode === 'blind' && blindParent === 'words'
									? 'Podkategoria'
									: 'Gatunek'}
						</label>
						<div ref={categoryRef} className="relative mt-1">
							{categoryOpen ? (
								<button
									type="button"
									id="room-category"
									onClick={() => setCategoryOpen(false)}
									aria-haspopup="listbox"
									aria-expanded="true"
									className="flex h-10 w-full items-center justify-between rounded-full border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white/90 backdrop-blur-xl"
								>
									<span className="truncate">{selectedCategoryLabel}</span>
									<ChevronDown className="h-4 w-4 text-white/80" />
								</button>
							) : (
								<button
									type="button"
									id="room-category"
									onClick={() => setCategoryOpen(true)}
									aria-haspopup="listbox"
									aria-expanded="false"
									className="flex h-10 w-full items-center justify-between rounded-full border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white/90 backdrop-blur-xl"
								>
									<span className="truncate">{selectedCategoryLabel}</span>
									<ChevronDown className="h-4 w-4 text-white/80" />
								</button>
							)}

							{categoryOpen ? (
								<div
									role="listbox"
									aria-label="Wybierz kategorię"
									className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60 p-1 text-white backdrop-blur-xl"
								>
									{mode === 'quiz'
										? (Object.keys(QUIZ_PACKS) as QuizPackId[]).map((pid) => {
												const label = QUIZ_PACKS[pid].label;
												const selected = pid === quizPackId;
												if (selected) {
													return (
														<button
															type="button"
															role="option"
															aria-selected="true"
															key={pid}
															onClick={() => {
																setQuizPackId(pid);
																setCategoryOpen(false);
															}}
															className="flex w-full items-center justify-between rounded-r-xl rounded-l-none bg-white/10 px-3 py-2 text-left text-sm font-semibold hover:bg-white/15 focus:bg-white/15 focus:outline-none"
													>
															<span className="truncate">{label}</span>
															<Check className="h-4 w-4 text-white/80" />
													</button>
												);
											}

											return (
													<button
														type="button"
														role="option"
														aria-selected="false"
														key={pid}
														onClick={() => {
															setQuizPackId(pid);
															setCategoryOpen(false);
														}}
														className="flex w-full items-center justify-between rounded-r-xl rounded-l-none px-3 py-2 text-left text-sm font-semibold hover:bg-white/10 focus:bg-white/10 focus:outline-none"
												>
														<span className="truncate">{label}</span>
														<span className="h-4 w-4" />
													</button>
											);
										})
										: mode === 'blind' && blindParent === 'words'
										? WORD_PAIRS_SUBCATEGORIES.map((s) => {
												const selected = s.id === blindWordsSubcategory;
												if (selected) {
													return (
														<button
															type="button"
															role="option"
															aria-selected="true"
															key={s.id}
															onClick={() => {
															setBlindWordsSubcategory(s.id);
															setCategoryOpen(false);
														}}
														className="flex w-full items-center justify-between rounded-r-xl rounded-l-none bg-white/10 px-3 py-2 text-left text-sm font-semibold hover:bg-white/15 focus:bg-white/15 focus:outline-none"
													>
														<span className="truncate">{s.label}</span>
														<Check className="h-4 w-4 text-white/80" />
													</button>
													);
												}

											return (
													<button
														type="button"
														role="option"
														aria-selected="false"
														key={s.id}
														onClick={() => {
															setBlindWordsSubcategory(s.id);
															setCategoryOpen(false);
														}}
														className="flex w-full items-center justify-between rounded-r-xl rounded-l-none px-3 py-2 text-left text-sm font-semibold hover:bg-white/10 focus:bg-white/10 focus:outline-none"
													>
														<span className="truncate">{s.label}</span>
														<span className="h-4 w-4" />
													</button>
												);
										  })
										: ROOM_CATEGORIES.map((c) => {
												const selected = c.genreId === selectedGenreId;
												if (selected) {
													return (
														<button
															type="button"
															role="option"
															aria-selected="true"
															key={c.genreId}
															onClick={() => {
																setSelectedGenreId(c.genreId);
																setCategoryOpen(false);
															}}
															className="flex w-full items-center justify-between rounded-r-xl rounded-l-none bg-white/10 px-3 py-2 text-left text-sm font-semibold hover:bg-white/15 focus:bg-white/15 focus:outline-none"
													>
														<span className="truncate">{c.label}</span>
														<Check className="h-4 w-4 text-white/80" />
													</button>
													);
												}

												return (
														<button
															type="button"
															role="option"
															aria-selected="false"
															key={c.genreId}
															onClick={() => {
																setSelectedGenreId(c.genreId);
																setCategoryOpen(false);
														}}
														className="flex w-full items-center justify-between rounded-r-xl rounded-l-none px-3 py-2 text-left text-sm font-semibold hover:bg-white/10 focus:bg-white/10 focus:outline-none"
													>
														<span className="truncate">{c.label}</span>
														<span className="h-4 w-4" />
													</button>
												);
										  })}
								</div>
							) : null}
						</div>
					</div>

					<div className="mt-3 flex gap-2">
						<button
							type="button"
							onClick={createNewRoom}
							disabled={!clientId || loading}
							className="h-10 flex-1 rounded-full border border-white/10 bg-white/15 text-sm font-semibold text-white disabled:opacity-50"
						>
							Utwórz pokój
						</button>
						<input
							value={code}
							onChange={(e) => setCode(e.target.value.toUpperCase())}
							placeholder="KOD"
							className="h-10 w-28 rounded-full border border-white/15 bg-white/5 px-3 text-center text-sm font-semibold uppercase text-white/90 outline-none placeholder:text-white/40"
						/>
						<button
							type="button"
							onClick={joinExistingRoom}
							disabled={!clientId || loading || code.trim().length < 4}
							className="h-10 w-20 rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/90 disabled:opacity-50"
						>
							Dołącz
						</button>
					</div>

					{error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
					{room ? (
						<div className="mt-2 flex items-center justify-between gap-2">
							<p className="text-xs text-white/60">
								Połączcie się na drugim urządzeniu kodem: <span className="font-semibold">{room.code}</span>.
							</p>
							<button
								type="button"
								onClick={handleCopyRoomCode}
								className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white/80"
								aria-label="Kopiuj kod pokoju"
							>
								{copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
								{copiedCode ? 'Skopiowano' : 'Kopiuj'}
							</button>
						</div>
					) : null}
				</section>

				{room ? (
					<section className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
						<div className="mb-3 flex items-center justify-between">
							<p className="text-sm font-semibold">
								{room.participantsCount}/2 połączone {isReady ? '— START' : '— czekam na drugą osobę'}
							</p>
							{room.mode === 'blind' && room.blindStats ? (
								<p className="text-xs text-white/60">Zgodność: {room.blindStats.percent}%</p>
							) : null}
						</div>

						{waitingForPartner ? (
							<p className="mb-3 text-xs font-semibold text-white/60">Czekam na wybór partnera…</p>
						) : null}

						{room.mode === 'match' ? (
							<div className="relative">
								{isMatched && matchCard ? (
									<div className="absolute inset-0 z-10 flex items-center justify-center">
										<div className="rounded-3xl border border-white/10 bg-zinc-950/60 px-6 py-5 text-center text-white backdrop-blur-xl">
											<p className="text-sm font-semibold">ZGODNOŚĆ</p>
											<p className="mt-1 text-lg font-semibold">{matchCard.title}</p>
										</div>
									</div>
								) : null}

								{currentMatchCard ? (
									<TinderCard
										card={currentMatchCard}
										badge={!isReady ? 'Czekam na 2. osobę' : waitingForPartner ? 'Czekam na wybór partnera' : null}
										disabled={!isReady || isMatched || myMatchVotedIds.has(currentMatchCard.id)}
										expanded={expandedCardIds.has(currentMatchCard.id)}
										onToggleExpanded={() =>
											setExpandedCardIds((prev) => {
												const next = new Set(prev);
												if (next.has(currentMatchCard.id)) next.delete(currentMatchCard.id);
												else next.add(currentMatchCard.id);
												return next;
											})
										}
										onNope={() => void submitMatch('nope')}
										onLike={() => void submitMatch('like')}
									/>
								) : (
									<p className="text-sm text-white/60">Brak kart.</p>
								)}
							</div>
						) : room.mode === 'quiz' && room.quiz ? (
							room.quiz.status === 'completed' ? (
								<div>
									<div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3">
										<p className="text-sm font-semibold">Wynik</p>
										{room.quiz.summary ? (
											<p className="mt-1 text-xs text-white/70">Zgodność: {room.quiz.summary.agreementPercent}%</p>
										) : (
											<p className="mt-1 text-xs text-white/70">Quiz ukończony.</p>
										)}
									</div>

									<div className="flex flex-col gap-2">
										{quizAxes.map((axisId) => {
											const me = room.quiz?.scoresByClientId?.[clientId]?.[axisId] ?? 0;
											const partnerId = room.participantClientIds.find((id) => id !== clientId);
											const partner = partnerId ? room.quiz?.scoresByClientId?.[partnerId]?.[axisId] ?? 0 : 0;
											const diff = Math.abs(me - partner);
											return (
												<div key={axisId} className="rounded-2xl border border-white/10 bg-white/5 p-3">
													<p className="text-xs font-semibold text-white/80">{getAxisLabel(axisId)}</p>
													<p className="mt-1 text-xs text-white/70">Ty: {me} • Partner: {partner} • Różnica: {diff}</p>
												</div>
											);
										})}
									</div>

									<div className="mt-3 flex gap-2">
										<button
											type="button"
											onClick={() =>
												downloadJson(`gusty-${room.code}.json`, {
													roomId: room.roomId,
													code: room.code,
													createdAt: room.createdAt,
													mode: room.mode,
													quiz: room.quiz,
												})
											}
											className="h-10 flex-1 rounded-full border border-white/10 bg-white/15 text-sm font-semibold text-white"
										>
											Pobierz JSON
										</button>
									</div>

									<div className="mt-3">
										{room.quiz.aiSummary?.text ? (
											<div className="rounded-2xl border border-white/10 bg-white/5 p-3">
												<p className="text-sm font-semibold">Porady AI</p>
												<p className="mt-2 text-sm text-white/85 whitespace-pre-wrap">{room.quiz.aiSummary.text}</p>
												<div className="mt-3 flex gap-2">
													<button
														type="button"
														onClick={() => void generateQuizAiSummary(true)}
														disabled={quizAiLoading}
														className="h-10 flex-1 rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/90 disabled:opacity-50"
													>
														Odśwież porady
													</button>
												</div>
											</div>
										) : (
											<div>
												<button
													type="button"
													onClick={() => void generateQuizAiSummary(false)}
													disabled={quizAiLoading}
													className="h-10 w-full rounded-full border border-white/10 bg-white/15 text-sm font-semibold text-white disabled:opacity-50"
												>
													{quizAiLoading ? 'Generuję…' : 'Generuj porady AI'}
												</button>
												{quizAiError ? <p className="mt-2 text-xs text-red-400">{quizAiError}</p> : null}
											</div>
										)}
									</div>
								</div>
							) : currentQuizQuestion ? (
								<div>
									<p className="text-xs font-semibold text-white/60">
										Pytanie {room.quiz.currentIndex + 1}/{room.quiz.totalQuestions} — {QUIZ_PACKS[room.quiz.packId].label}
									</p>
									<p className="mt-2 text-sm font-semibold">{currentQuizQuestion.prompt}</p>

									<div className="mt-3 flex flex-col gap-2">
										{currentQuizQuestion.options.map((opt) => (
											<button
												key={opt.id}
												type="button"
												onClick={() => void submitQuiz(opt.id)}
												disabled={!isReady || Boolean(myQuizAnswer)}
												className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white/90 disabled:opacity-50"
											>
												{opt.label}
											</button>
										))}
									</div>

									{myQuizAnswer ? (
										<p className="mt-3 text-xs font-semibold text-white/60">Czekam na odpowiedź partnera…</p>
									) : null}
								</div>
							) : (
								<p className="text-sm text-white/60">Brak pytania.</p>
							)
						) : currentRound ? (
							<BlindRoundView
								key={`${room?.roomId ?? 'room'}:${currentRound.index}:${currentRound.left.id}:${currentRound.right.id}`}
								left={currentRound.left}
								right={currentRound.right}
								disabled={!isReady || myBlindVotedRoundIndexes.has(currentRound.index)}
								statsText={statsText}
								leftPopKey={
									blindPop && blindPop.roundIndex === currentRound.index && blindPop.side === 'left'
										? blindPop.key
										: null
								}
								rightPopKey={
									blindPop && blindPop.roundIndex === currentRound.index && blindPop.side === 'right'
										? blindPop.key
										: null
								}
								onPickLeft={() => void submitBlind('left')}
								onPickRight={() => void submitBlind('right')}
							/>
						) : blindIsFinished && room.rounds && room.blindPicksByClientId ? (
							<BlindSummaryView
								meClientId={clientId}
								participantClientIds={room.participantClientIds}
								rounds={room.rounds}
								picksByClientId={room.blindPicksByClientId}
								percent={room.blindStats?.percent ?? 0}
								matches={room.blindStats?.matches ?? 0}
								totalRounds={room.blindStats?.totalRounds ?? 0}
							/>
						) : (
							<p className="text-sm text-white/60">Brak rund.</p>
						)}
					</section>
				) : (
					<section className="relative z-0 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60 backdrop-blur-xl">
						Utwórz pokój lub dołącz kodem, żeby zacząć.
					</section>
				)}
			</main>
			</div>
		</div>
	);
}
