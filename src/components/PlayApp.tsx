'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Copy, Heart, Maximize2, Minimize2, X } from 'lucide-react';
import type { DecisionCard } from '@/types/decisionCard';
import type { RoomMode, RoomView } from '@/types/room';
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
	roundIndex: number;
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
						<div className="inline-flex max-w-full rounded-2xl bg-black/65 p-3 text-white backdrop-blur">
							<h2 className="text-lg font-semibold">{left.title}</h2>
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
						<div className="inline-flex max-w-full rounded-2xl bg-black/65 p-3 text-white backdrop-blur">
							<h2 className="text-lg font-semibold">{right.title}</h2>
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

	const pickLabel = (roundIndex: number, cid: string | null) => {
		if (!cid) return '—';
		const pick = picksByClientId[cid]?.[roundIndex];
		if (pick === 'left') return 'Lewa';
		if (pick === 'right') return 'Prawa';
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
								<p>Ty: {pickLabel(r.index, meClientId)}</p>
								<p>Partner: {pickLabel(r.index, partnerId)}</p>
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
	const [categoryOpen, setCategoryOpen] = useState(false);
	const categoryRef = useRef<HTMLDivElement | null>(null);
	const [code, setCode] = useState('');
	const [room, setRoom] = useState<RoomView | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
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
				genreId,
			});
			const joined = await postJson<{ room: RoomView }>('/api/rooms/join', {
				code: res.room.code,
				clientId,
			});
			setRoom(joined.room);
			setCode(res.room.code);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Nieznany błąd.');
		} finally {
			setLoading(false);
		}
	}

	const selectedGenreId = mode === 'match' ? matchGenreId : blindGenreId;
	const selectedCategoryLabel = ROOM_CATEGORIES.find((c) => c.genreId === selectedGenreId)?.label ?? 'Wybierz…';
	const setSelectedGenreId = (next: number) => {
		if (mode === 'match') setMatchGenreId(next);
		else setBlindGenreId(next);
	};

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

	return (
		<div className="min-h-screen bg-zinc-50 font-sans text-black dark:bg-black dark:text-zinc-50">
			<button
				type="button"
				onClick={() => void toggleFullscreen()}
				className="fixed bottom-4 right-4 z-50 inline-flex h-12 items-center gap-2 rounded-full bg-black/80 px-4 text-sm font-semibold text-white backdrop-blur"
				aria-label={isFullscreen ? 'Wyjdź z pełnego ekranu' : 'Pełny ekran'}
				title={isFullscreen ? 'Wyjdź z pełnego ekranu' : 'Pełny ekran'}
			>
				{isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
				{isFullscreen ? 'Zwiń' : 'Pełny ekran'}
			</button>
			<main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-6">
				<header className="flex items-start justify-between gap-3">
					<div>
						<h1 className="text-xl font-semibold tracking-tight">Decyzjomat</h1>
						<p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Tryb Tinder + porównanie wyborów na 2 urządzeniach</p>
					</div>
					<div className="text-right">
						<p className="text-[11px] text-zinc-500">ID: {clientId.slice(0, 6)}…</p>
						{room ? <p className="text-[11px] text-zinc-500">Kod: {room.code}</p> : null}
					</div>
				</header>

				<section className="rounded-2xl border border-black/8 bg-white p-4 dark:border-white/[.145] dark:bg-black">
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => setMode('match')}
							className={`h-10 flex-1 rounded-full text-sm font-semibold ${
								mode === 'match'
									? 'bg-black text-white dark:bg-zinc-50 dark:text-black'
									: 'border border-black/8 text-black dark:border-white/[.145] dark:text-zinc-50'
							}`}
						>
							Pierwszy match
						</button>
						<button
							type="button"
							onClick={() => setMode('blind')}
							className={`h-10 flex-1 rounded-full text-sm font-semibold ${
								mode === 'blind'
									? 'bg-black text-white dark:bg-zinc-50 dark:text-black'
									: 'border border-black/8 text-black dark:border-white/[.145] dark:text-zinc-50'
							}`}
						>
							Randka w ciemno
						</button>
					</div>

					<div className="mt-3">
						<label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400" htmlFor="room-category">
							Kategoria
						</label>
						<div ref={categoryRef} className="relative mt-1">
							{categoryOpen ? (
								<button
									type="button"
									id="room-category"
									onClick={() => setCategoryOpen(false)}
									aria-haspopup="listbox"
									aria-expanded="true"
									className="flex h-10 w-full items-center justify-between rounded-full border border-black/8 bg-zinc-950 px-4 text-sm font-semibold text-white dark:border-white/[.145]"
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
									className="flex h-10 w-full items-center justify-between rounded-full border border-black/8 bg-zinc-950 px-4 text-sm font-semibold text-white dark:border-white/[.145]"
								>
									<span className="truncate">{selectedCategoryLabel}</span>
									<ChevronDown className="h-4 w-4 text-white/80" />
								</button>
							)}

							{categoryOpen ? (
								<div
									role="listbox"
									aria-label="Wybierz kategorię"
									className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-black/8 bg-zinc-950 p-1 text-white shadow-sm dark:border-white/[.145]"
								>
									{ROOM_CATEGORIES.map((c) => {
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
													className="flex w-full items-center justify-between rounded-r-xl rounded-l-none bg-white/10 px-3 py-2 text-left text-sm font-semibold hover:bg-white/10 focus:bg-white/10 focus:outline-none"
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
							className="h-10 flex-1 rounded-full bg-black text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-black"
						>
							Utwórz pokój
						</button>
						<input
							value={code}
							onChange={(e) => setCode(e.target.value.toUpperCase())}
							placeholder="KOD"
							className="h-10 w-28 rounded-full border border-black/8 bg-transparent px-3 text-center text-sm font-semibold uppercase outline-none dark:border-white/[.145]"
						/>
						<button
							type="button"
							onClick={joinExistingRoom}
							disabled={!clientId || loading || code.trim().length < 4}
							className="h-10 w-20 rounded-full border border-black/8 text-sm font-semibold disabled:opacity-50 dark:border-white/[.145]"
						>
							Dołącz
						</button>
					</div>

					{error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
					{room ? (
						<div className="mt-2 flex items-center justify-between gap-2">
							<p className="text-xs text-zinc-500">
								Połączcie się na drugim urządzeniu kodem: <span className="font-semibold">{room.code}</span>.
							</p>
							<button
								type="button"
								onClick={handleCopyRoomCode}
								className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-black/8 px-3 text-xs font-semibold text-zinc-700 dark:border-white/[.145] dark:text-zinc-200"
								aria-label="Kopiuj kod pokoju"
							>
								{copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
								{copiedCode ? 'Skopiowano' : 'Kopiuj'}
							</button>
						</div>
					) : null}
				</section>

				{room ? (
					<section className="rounded-2xl border border-black/8 bg-white p-4 dark:border-white/[.145] dark:bg-black">
						<div className="mb-3 flex items-center justify-between">
							<p className="text-sm font-semibold">
								{room.participantsCount}/2 połączone {isReady ? '— START' : '— czekam na drugą osobę'}
							</p>
							{room.mode === 'blind' && room.blindStats ? (
								<p className="text-xs text-zinc-500">Zgodność: {room.blindStats.percent}%</p>
							) : null}
						</div>

						{waitingForPartner ? (
							<p className="mb-3 text-xs font-semibold text-zinc-500">Czekam na wybór partnera…</p>
						) : null}

						{room.mode === 'match' ? (
							<div className="relative">
								{isMatched && matchCard ? (
									<div className="absolute inset-0 z-10 flex items-center justify-center">
										<div className="rounded-3xl bg-black/80 px-6 py-5 text-center text-white backdrop-blur">
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
									<p className="text-sm text-zinc-500">Brak kart.</p>
								)}
							</div>
						) : currentRound ? (
							<BlindRoundView
								roundIndex={currentRound.index}
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
							<p className="text-sm text-zinc-500">Brak rund.</p>
						)}
					</section>
				) : (
					<section className="rounded-2xl border border-black/8 bg-white p-4 text-sm text-zinc-600 dark:border-white/[.145] dark:bg-black dark:text-zinc-400">
						Utwórz pokój lub dołącz kodem, żeby zacząć.
					</section>
				)}
			</main>
		</div>
	);
}
