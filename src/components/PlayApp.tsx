'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown, Copy, Flame, Heart, Leaf, Maximize2, Minimize2, Moon, Palette, PawPrint, Sparkles, Sun, X, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { DecisionCard } from '@/types/decisionCard';
import type { QuizAxisId, QuizPackId, RoomMode, RoomView } from '@/types/room';
import { AiTipsFab } from '@/components/AiTipsFab';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { BuyCoffeeToButton } from '@/components/BuyCoffeeToButton';
import { QUIZ_PACKS, getAxisLabel, getQuestionById } from '@/lib/quizBank';
import { WORD_PAIRS_SUBCATEGORIES, type WordPairsSubcategoryId } from '@/lib/wordPairs';
import styles from './PlayApp.module.css';

const pdfMakeAny = pdfMake as unknown as { vfs?: unknown; fonts?: unknown; createPdf?: (doc: unknown) => { download: (filename: string) => void } };
const pdfFontsAny = pdfFonts as unknown as { pdfMake?: { vfs?: unknown } };
if (!pdfMakeAny.vfs && pdfFontsAny.pdfMake?.vfs) {
	pdfMakeAny.vfs = pdfFontsAny.pdfMake.vfs;
	pdfMakeAny.fonts = {
		Roboto: {
			normal: 'Roboto-Regular.ttf',
			bold: 'Roboto-Medium.ttf',
			italics: 'Roboto-Italic.ttf',
			bolditalics: 'Roboto-MediumItalic.ttf',
		},
	};
}

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

const QUIZ_AXES: QuizAxisId[] = [
	'modernClassic',
	'minimalMaximal',
	'warmCool',
	'naturalIndustrial',
	'boldSafe',
	'budgetPremium',
	'planSpontaneous',
	'socialCozy',
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

function clamp(n: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, n));
}

const LEFT_PCT_CLASSES = [
	'left-[0%]',
	'left-[1%]',
	'left-[2%]',
	'left-[3%]',
	'left-[4%]',
	'left-[5%]',
	'left-[6%]',
	'left-[7%]',
	'left-[8%]',
	'left-[9%]',
	'left-[10%]',
	'left-[11%]',
	'left-[12%]',
	'left-[13%]',
	'left-[14%]',
	'left-[15%]',
	'left-[16%]',
	'left-[17%]',
	'left-[18%]',
	'left-[19%]',
	'left-[20%]',
	'left-[21%]',
	'left-[22%]',
	'left-[23%]',
	'left-[24%]',
	'left-[25%]',
	'left-[26%]',
	'left-[27%]',
	'left-[28%]',
	'left-[29%]',
	'left-[30%]',
	'left-[31%]',
	'left-[32%]',
	'left-[33%]',
	'left-[34%]',
	'left-[35%]',
	'left-[36%]',
	'left-[37%]',
	'left-[38%]',
	'left-[39%]',
	'left-[40%]',
	'left-[41%]',
	'left-[42%]',
	'left-[43%]',
	'left-[44%]',
	'left-[45%]',
	'left-[46%]',
	'left-[47%]',
	'left-[48%]',
	'left-[49%]',
	'left-[50%]',
	'left-[51%]',
	'left-[52%]',
	'left-[53%]',
	'left-[54%]',
	'left-[55%]',
	'left-[56%]',
	'left-[57%]',
	'left-[58%]',
	'left-[59%]',
	'left-[60%]',
	'left-[61%]',
	'left-[62%]',
	'left-[63%]',
	'left-[64%]',
	'left-[65%]',
	'left-[66%]',
	'left-[67%]',
	'left-[68%]',
	'left-[69%]',
	'left-[70%]',
	'left-[71%]',
	'left-[72%]',
	'left-[73%]',
	'left-[74%]',
	'left-[75%]',
	'left-[76%]',
	'left-[77%]',
	'left-[78%]',
	'left-[79%]',
	'left-[80%]',
	'left-[81%]',
	'left-[82%]',
	'left-[83%]',
	'left-[84%]',
	'left-[85%]',
	'left-[86%]',
	'left-[87%]',
	'left-[88%]',
	'left-[89%]',
	'left-[90%]',
	'left-[91%]',
	'left-[92%]',
	'left-[93%]',
	'left-[94%]',
	'left-[95%]',
	'left-[96%]',
	'left-[97%]',
	'left-[98%]',
	'left-[99%]',
	'left-[100%]',
] as const;

function pctToLeftClass(pct: number): string {
	const idx = clamp(Math.round(pct), 0, 100);
	return LEFT_PCT_CLASSES[idx] ?? LEFT_PCT_CLASSES[0];
}

const BUTTON_MOTION =
	'transition-[transform,background-color,border-color,color,opacity] duration-200 ease-out will-change-transform enabled:cursor-pointer disabled:cursor-not-allowed active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 supports-[hover:hover]:hover:-translate-y-0.5';
const BUTTON_MOTION_SOFT = `${BUTTON_MOTION} supports-[hover:hover]:hover:bg-white/15`;
const BUTTON_MOTION_DARK = `${BUTTON_MOTION} supports-[hover:hover]:hover:bg-black/80`;

function hashStringToUint32(input: string): number {
	// FNV-1a 32-bit
	let hash = 0x811c9dc5;
	for (let i = 0; i < input.length; i += 1) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}

const WORD_TITLES_BY_SUBCATEGORY: Record<WordPairsSubcategoryId, Set<string>> = (() => {
	const out: Record<WordPairsSubcategoryId, Set<string>> = {
		adjectives: new Set<string>(),
		animals: new Set<string>(),
		textures: new Set<string>(),
	};
	for (const sub of WORD_PAIRS_SUBCATEGORIES) {
		for (const p of sub.pairs) {
			out[sub.id].add(p.left.toLowerCase());
			out[sub.id].add(p.right.toLowerCase());
		}
	}
	return out;
})();

function inferWordsSubcategory(title: string): WordPairsSubcategoryId | null {
	const t = title.toLowerCase();
	if (WORD_TITLES_BY_SUBCATEGORY.animals.has(t)) return 'animals';
	if (WORD_TITLES_BY_SUBCATEGORY.textures.has(t)) return 'textures';
	if (WORD_TITLES_BY_SUBCATEGORY.adjectives.has(t)) return 'adjectives';
	return null;
}

function pickWordAccent(indexSeed: string): { bgClass: string; Icon: typeof Sparkles } {
	const hash = hashStringToUint32(indexSeed);
	const bgVariants = [
		'bg-gradient-to-br from-white/20 to-transparent dark:from-white/10',
		'bg-gradient-to-br from-white/10 via-white/0 to-transparent dark:from-white/10',
		'bg-gradient-to-tr from-white/15 to-transparent dark:from-white/10',
		'bg-gradient-to-b from-white/15 to-transparent dark:from-white/10',
		'bg-gradient-to-br from-white/10 to-transparent dark:from-white/10',
		'bg-gradient-to-tl from-white/15 to-transparent dark:from-white/10',
	];
	return {
		bgClass: bgVariants[hash % bgVariants.length] ?? bgVariants[0],
		Icon: Sparkles,
	};
}

function pickWordIcon(title: string): typeof Sparkles {
	const t = title.toLowerCase();

	// Preferuj konkretne dopasowania dla haseł z naszej bazy ("smaczki").
	const overrides: Record<string, typeof Sparkles> = {
		// Przymiotniki
		romantyczny: Heart,
		zadziorny: Zap,
		ambitny: Flame,
		wyluzowany: Leaf,
		spontaniczny: Sparkles,
		zaplanowany: Sun,
		minimalistyczny: Leaf,
		nowoczesny: Zap,
		klasyczny: Sun,
		bezpieczny: Leaf,
		ryzykowny: Flame,
		głośny: Zap,
		cichy: Moon,

		// Tekstury / wrażenia
		gorący: Flame,
		zimny: Moon,
		ciepły: Sun,
		chłodny: Moon,
		pikantny: Flame,
		słodki: Sparkles,
		metaliczny: Zap,
		aksamitny: Sparkles,
		błyszczący: Sun,
		matowy: Moon,
		chrupiący: Zap,
		kremowy: Sparkles,
	};
	const direct = overrides[t];
	if (direct) return direct;

	// „Hasła” to konkretnie: przymiotniki / zwierzęta / tekstury.
	// Dopasowujemy ikonę do kategorii, a nie do randkowych słów-kluczy.
	const sub = inferWordsSubcategory(title);
	if (sub === 'animals') return PawPrint;
	if (sub === 'textures') return Palette;
	if (sub === 'adjectives') return Sparkles;

	// Fallback: deterministycznie z hasha.
	const hash = hashStringToUint32(title);
	const icons = [Sparkles, Sun, Moon, Leaf, Flame, Zap] as const;
	return icons[hash % icons.length] ?? Sparkles;
}

function computeAxisScoreRange(questionIds: string[], axisId: QuizAxisId): { min: number; max: number } {
	let min = 0;
	let max = 0;
	for (const qid of questionIds) {
		const q = getQuestionById(qid);
		if (!q) continue;
		let qMin = 0;
		let qMax = 0;
		let first = true;
		for (const opt of q.options) {
			const w = opt.weights[axisId] ?? 0;
			if (first) {
				qMin = w;
				qMax = w;
				first = false;
			} else {
				qMin = Math.min(qMin, w);
				qMax = Math.max(qMax, w);
			}
		}
		min += qMin;
		max += qMax;
	}
	if (min === max) {
		return { min: -1, max: 1 };
	}
	return { min, max };
}

function splitAxisPoles(axisId: QuizAxisId): { left: string; right: string } {
	const raw = getAxisLabel(axisId);
	const parts = raw.split('↔').map((s) => s.trim());
	return { left: parts[0] ?? raw, right: parts[1] ?? '' };
}

function getAxisLabelForPdf(axisId: QuizAxisId): string {
	// Roboto (vfs) może nie zawierać niektórych strzałek, więc normalizujemy separator.
	return getAxisLabel(axisId).replace(/\s*↔\s*/g, ' <-> ');
}

function renderMarkdownLite(text: string): ReactNode {
	const normalized = text.replace(/\r\n/g, '\n').trim();
	if (!normalized) return null;

	return (
		<div className="text-sm text-white/85">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					h2: ({ children }) => <p className="mt-3 text-sm font-semibold text-white/95">{children}</p>,
					h3: ({ children }) => <p className="mt-3 text-sm font-semibold text-white/95">{children}</p>,
					p: ({ children }) => <p className="mt-2 leading-relaxed">{children}</p>,
					ul: ({ children }) => <ul className="mt-2 list-disc space-y-1 pl-5">{children}</ul>,
					ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1 pl-5">{children}</ol>,
					table: ({ children }) => (
						<div className="mt-2 overflow-x-auto">
							<table className="w-full border-separate border-spacing-0 text-xs">{children}</table>
						</div>
					),
					thead: ({ children }) => <thead className="text-white/90">{children}</thead>,
					tbody: ({ children }) => <tbody className="text-white/80">{children}</tbody>,
					tr: ({ children }) => <tr className="">{children}</tr>,
					th: ({ children }) => (
						<th className="border border-white/10 bg-white/5 px-2 py-2 text-left font-semibold">{children}</th>
					),
					td: ({ children }) => <td className="border border-white/10 px-2 py-2 align-top">{children}</td>,
					strong: ({ children }) => <strong className="font-semibold text-white/90">{children}</strong>,
					em: ({ children }) => <em className="italic text-white/85">{children}</em>,
					code: ({ children }) => <code className="rounded bg-white/10 px-1 py-0.5 text-[12px]">{children}</code>,
				}}
			>
				{normalized}
			</ReactMarkdown>
		</div>
	);
}

function markdownToPlainText(md: string): string {
	return md
		.replace(/^\s*#{1,6}\s+/gm, '')
		.replace(/^\s*[-*+]\s+/gm, '• ')
		.replace(/^\s*\d+\.\s+/gm, '• ')
		.replace(/^\s*\|.*\|\s*$/gm, '')
		.replace(/^\s*:\-+.*$/gm, '')
		.replace(/`{1,3}([^`]*)`{1,3}/g, '$1')
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/_([^_]+)_/g, '$1')
		.replace(/\r\n/g, '\n')
		.trim();
}

function sanitizePdfText(text: string): string {
	// Unikamy znaków, które czasem wypadają jako "kwadrat z krzyżykiem".
	return text.replace(/\s*↔\s*/g, ' <-> ');
}

function isLikelyMarkdownTableRow(line: string): boolean {
	const trimmed = line.trim();
	if (!trimmed) return false;
	// Musi mieć co najmniej 2 separatory kolumn.
	const pipeCount = (trimmed.match(/\|/g) ?? []).length;
	return pipeCount >= 2;
}

function isMarkdownTableSeparator(line: string): boolean {
	// np. | --- | :---: | ---: |
	const trimmed = line.trim();
	if (!trimmed) return false;
	return /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(trimmed);
}

function parseMarkdownTableRow(line: string): string[] {
	let trimmed = line.trim();
	if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
	if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
	return trimmed.split('|').map((c) => c.trim());
}

function markdownToPdfmakeContent(md: string): unknown[] {
	const normalized = md.replace(/\r\n/g, '\n').trim();
	if (!normalized) return [{ text: '(brak treści)', style: 'body' }];

	const lines = normalized.split('\n');
	const blocks: unknown[] = [];
	let i = 0;

	const flushParagraph = (paraLines: string[]) => {
		const raw = paraLines.join('\n').trim();
		if (!raw) return;
		const plain = sanitizePdfText(markdownToPlainText(raw));
		if (!plain) return;
		blocks.push({ text: plain, style: 'body', margin: [0, 0, 0, 6] });
	};

	let paragraph: string[] = [];

	while (i < lines.length) {
		const line = lines[i] ?? '';

		// Pusta linia domyka akapit.
		if (!line.trim()) {
			flushParagraph(paragraph);
			paragraph = [];
			i += 1;
			continue;
		}

		// Próba wykrycia tabeli Markdown (GFM): header + separator + wiersze.
		const next = lines[i + 1] ?? '';
		if (isLikelyMarkdownTableRow(line) && isMarkdownTableSeparator(next)) {
			flushParagraph(paragraph);
			paragraph = [];

			const headerCellsRaw = parseMarkdownTableRow(line);
			const separatorLine = next;
			const headerCols = headerCellsRaw.length;
			const widths = new Array(Math.max(1, headerCols)).fill('*');

			const body: Array<Array<string | { text: string; bold?: boolean }>> = [
				headerCellsRaw.map((c) => ({ text: sanitizePdfText(markdownToPlainText(c)) || ' ', bold: true })),
			];

			i += 2; // skip header + separator
			void separatorLine;

			while (i < lines.length) {
				const rowLine = lines[i] ?? '';
				if (!rowLine.trim()) break;
				if (!isLikelyMarkdownTableRow(rowLine)) break;
				if (isMarkdownTableSeparator(rowLine)) {
					i += 1;
					continue;
				}
				const rowCells = parseMarkdownTableRow(rowLine);
				// Dopasuj liczbę kolumn do nagłówka.
				const padded = rowCells.slice(0, headerCols);
				while (padded.length < headerCols) padded.push('');
				body.push(padded.map((c) => sanitizePdfText(markdownToPlainText(c)) || ' '));
				i += 1;
			}

			blocks.push({
				table: {
					headerRows: 1,
					widths,
					body,
				},
				layout: {
					fillColor: (rowIndex: number) => (rowIndex === 0 ? '#eeeeee' : null),
					hLineColor: () => '#dddddd',
					vLineColor: () => '#dddddd',
					paddingLeft: () => 6,
					paddingRight: () => 6,
					paddingTop: () => 4,
					paddingBottom: () => 4,
				},
				margin: [0, 2, 0, 10],
			});
			continue;
		}

		paragraph.push(line);
		i += 1;
	}

	flushParagraph(paragraph);
	return blocks.length ? blocks : [{ text: '(brak treści)', style: 'body' }];
}

function downloadGustyPdf(args: { filename: string; room: RoomView; clientId: string; quizAxes: QuizAxisId[] }) {
	const { filename, room, clientId, quizAxes } = args;
	if (room.mode !== 'quiz') return;
	const quiz = room.quiz;
	if (!quiz) return;

	const partnerId = room.participantClientIds.find((id) => id !== clientId) ?? null;

	const axesBody: Array<Array<string | number>> = [
		['Oś', 'Ty', 'Partner', 'Różnica'],
		...quizAxes.map((axisId) => {
			const me = quiz.scoresByClientId?.[clientId]?.[axisId] ?? 0;
			const partner = partnerId ? quiz.scoresByClientId?.[partnerId]?.[axisId] ?? 0 : 0;
			const diff = Math.abs(me - partner);
			return [getAxisLabelForPdf(axisId), me, partner, diff];
		}),
	];

	const summaryBlocks = quiz.aiSummary?.text ? markdownToPdfmakeContent(quiz.aiSummary.text) : [{ text: '(brak podsumowania)', style: 'body' }];

	const docDefinition = {
		defaultStyle: {
			font: 'Roboto',
			fontSize: 10,
		},
		content: [
			{ text: 'Gusta — wynik', style: 'title' },
			{ text: `Kod pokoju: ${room.code}`, style: 'meta' },
			quiz.summary?.agreementPercent != null ? { text: `Zgodność: ${quiz.summary.agreementPercent}%`, style: 'meta' } : null,
			{
				text: 'Legenda: wynik ujemny = bliżej lewej strony osi, dodatni = bliżej prawej; „Różnica” = |Ty − Partner|.',
				style: 'hint',
			},
			{ text: 'Osie', style: 'h2' },
			{
				table: {
					headerRows: 1,
					widths: ['*', 55, 55, 55],
					body: axesBody,
				},
				layout: {
					fillColor: (rowIndex: number) => (rowIndex === 0 ? '#eeeeee' : null),
				},
			},
			{ text: 'Podsumowanie', style: 'h2' },
			...summaryBlocks,
		].filter(Boolean),
		styles: {
			title: { fontSize: 16, bold: true, margin: [0, 0, 0, 6] },
			h2: { fontSize: 12, bold: true, margin: [0, 14, 0, 6] },
			meta: { color: '#444444', margin: [0, 0, 0, 2] },
			hint: { color: '#444444', margin: [0, 6, 0, 10] },
			body: { lineHeight: 1.2 },
		},
		pageMargins: [40, 40, 40, 40],
	};

	pdfMakeAny.createPdf?.(docDefinition).download(filename);
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

function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false);
	useEffect(() => {
		const mql = window.matchMedia(query);
		const onChange = () => setMatches(mql.matches);
		onChange();
		if (typeof mql.addEventListener === 'function') {
			mql.addEventListener('change', onChange);
			return () => mql.removeEventListener('change', onChange);
		}
		const legacy = mql as unknown as {
			addListener?: (listener: () => void) => void;
			removeListener?: (listener: () => void) => void;
		};
		legacy.addListener?.(onChange);
		return () => legacy.removeListener?.(onChange);
	}, [query]);
	return matches;
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
				className={`${BUTTON_MOTION_DARK} pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur disabled:opacity-50`}
			>
				<X className="h-7 w-7" />
			</button>
			<button
				type="button"
				disabled={disabled}
				onClick={onLike}
				aria-label="Tak"
				className={`${BUTTON_MOTION_DARK} pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur disabled:opacity-50`}
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
				className={`${BUTTON_MOTION} mt-1 text-xs font-semibold text-white/90 underline underline-offset-2 supports-[hover:hover]:hover:text-white`}
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

	const isWords = left.source === 'manual' && right.source === 'manual';
	const [leftTilt, setLeftTilt] = useState(0);
	const [rightTilt, setRightTilt] = useState(0);
	const leftSrc = left.imageUrl || '/globe.svg';
	const rightSrc = right.imageUrl || '/globe.svg';
	const leftAccent = useMemo(() => pickWordAccent(left.title), [left.title]);
	type Accent = ReturnType<typeof pickWordAccent>;
	const rightAccent: Accent = useMemo(() => pickWordAccent(right.title), [right.title]);
	return (
		<div className="w-full">
			<div className="mb-2 flex items-center justify-between">
				<p className="text-sm font-semibold">Randka w ciemno</p>
				<p className="text-xs text-zinc-500">{statsText}</p>
			</div>

			<div className="grid grid-cols-2 gap-3 sm:gap-4">
				<div
					className={`relative overflow-hidden rounded-3xl border border-black/8 bg-zinc-100 dark:border-white/[.145] dark:bg-zinc-900 ${
						isWords && leftTilt > 0 ? styles.wordTiltLeft : ''
					}`}
					key={isWords ? `words-left-${leftTilt}` : undefined}
				>
					{!isWords && showLeftDescription && left.description ? (
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
										className={`${BUTTON_MOTION_DARK} inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white`}
									>
										<X className="h-5 w-5" />
									</button>
								</div>
								<p className="mt-2 text-sm text-white/90">{left.description}</p>
							</div>
						</div>
					) : null}
					{isWords ? (
						<div className="relative flex aspect-2/3 w-full items-center justify-center p-6 text-center">
							<div className={`pointer-events-none absolute inset-0 ${leftAccent.bgClass}`} aria-hidden="true" />
							<div className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-zinc-700 dark:bg-white/10 dark:text-white/80">
								{(() => {
									const Icon = pickWordIcon(left.title);
									return <Icon className="h-5 w-5" />;
								})()}
							</div>
							<p className="relative text-xl font-semibold leading-tight text-zinc-900 dark:text-white sm:text-2xl">
								{left.title}
							</p>
						</div>
					) : (
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
					)}

					{leftPopKey ? (
						<div key={leftPopKey} className="pointer-events-none absolute inset-0 flex items-center justify-center">
							<span
								className={`${styles.choicePop} inline-flex h-16 w-16 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur`}
							>
								<Heart className="h-8 w-8" />
							</span>
						</div>
					) : null}

					{!isWords ? (
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
										className={`${BUTTON_MOTION} text-left text-xs font-semibold text-white/90 underline underline-offset-2 disabled:opacity-60 supports-[hover:hover]:hover:text-white`}
									>
										Zobacz opis
									</button>
								</div>
							</div>
						</div>
					) : null}
					{isWords ? (
						<div className="pointer-events-none absolute inset-x-0 bottom-6 flex items-center justify-center">
							<button
								type="button"
								disabled={disabled}
								onClick={() => {
								setLeftTilt((n) => n + 1);
								onPickLeft();
							}}
								aria-label="Wybierz lewą kartę"
							className={`${BUTTON_MOTION_DARK} pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur disabled:opacity-50 sm:h-14 sm:w-14`}
							>
								<Heart className="h-7 w-7" />
							</button>
						</div>
					) : (
						<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
							<button
								type="button"
								disabled={disabled}
								onClick={onPickLeft}
								aria-label="Wybierz lewą kartę"
								className={`${BUTTON_MOTION_DARK} pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur disabled:opacity-50`}
							>
								<Heart className="h-7 w-7" />
							</button>
						</div>
					)}
				</div>

				<div
					className={`relative overflow-hidden rounded-3xl border border-black/8 bg-zinc-100 dark:border-white/[.145] dark:bg-zinc-900 ${
						isWords && rightTilt > 0 ? styles.wordTiltRight : ''
					}`}
					key={isWords ? `words-right-${rightTilt}` : undefined}
				>
					{!isWords && showRightDescription && right.description ? (
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
										className={`${BUTTON_MOTION_DARK} inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white`}
									>
										<X className="h-5 w-5" />
									</button>
								</div>
								<p className="mt-2 text-sm text-white/90">{right.description}</p>
							</div>
						</div>
					) : null}
					{isWords ? (
						<div className="relative flex aspect-2/3 w-full items-center justify-center p-6 text-center">
							<div className={`pointer-events-none absolute inset-0 ${rightAccent.bgClass}`} aria-hidden="true" />
							<div className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-zinc-700 dark:bg-white/10 dark:text-white/80">
								{(() => {
									const Icon = pickWordIcon(right.title);
									return <Icon className="h-5 w-5" />;
								})()}
							</div>
							<p className="relative text-xl font-semibold leading-tight text-zinc-900 dark:text-white sm:text-2xl">
								{right.title}
							</p>
						</div>
					) : (
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
					)}

					{rightPopKey ? (
						<div key={rightPopKey} className="pointer-events-none absolute inset-0 flex items-center justify-center">
							<span
								className={`${styles.choicePop} inline-flex h-16 w-16 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur`}
							>
								<Heart className="h-8 w-8" />
							</span>
						</div>
					) : null}

					{!isWords ? (
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
										className={`${BUTTON_MOTION} text-left text-xs font-semibold text-white/90 underline underline-offset-2 disabled:opacity-60 supports-[hover:hover]:hover:text-white`}
									>
										Zobacz opis
									</button>
								</div>
							</div>
						</div>
					) : null}
					{isWords ? (
						<div className="pointer-events-none absolute inset-x-0 bottom-6 flex items-center justify-center">
							<button
								type="button"
								disabled={disabled}
								onClick={() => {
								setRightTilt((n) => n + 1);
								onPickRight();
							}}
								aria-label="Wybierz prawą kartę"
							className={`${BUTTON_MOTION_DARK} pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur disabled:opacity-50 sm:h-14 sm:w-14`}
							>
								<Heart className="h-7 w-7" />
							</button>
						</div>
					) : (
						<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
							<button
								type="button"
								disabled={disabled}
								onClick={onPickRight}
								aria-label="Wybierz prawą kartę"
								className={`${BUTTON_MOTION_DARK} pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur disabled:opacity-50`}
							>
								<Heart className="h-7 w-7" />
							</button>
						</div>
					)}
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

			<div className="mt-4 flex justify-end">
				<BuyCoffeeToButton />
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
	const [blindParent, setBlindParent] = useState<'movies' | 'words'>('movies');
	const [blindWordsSubcategory, setBlindWordsSubcategory] = useState<WordPairsSubcategoryId>('adjectives');
	const [quizPackId, setQuizPackId] = useState<QuizPackId>('mix');
	const [quizSolo, setQuizSolo] = useState(false);
	const [categoryOpen, setCategoryOpen] = useState(false);
	const categoryRef = useRef<HTMLDivElement | null>(null);
	const [code, setCode] = useState('');
	const [room, setRoom] = useState<RoomView | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [copiedCode, setCopiedCode] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const isMobile = useMediaQuery('(max-width: 640px)');
	const [descriptionModal, setDescriptionModal] = useState<{ title: string; text: string } | null>(null);

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

	const roomMaxParticipants = room?.maxParticipants ?? 2;
	const isReady = room ? room.participantsCount === roomMaxParticipants : false;
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
		if (roomMaxParticipants !== 2) return false;
		if (room.participantsCount !== 2) return false;
		if (room.mode === 'match') {
			if (!currentMatchCard) return false;
			const votes = room.matchVotesByCardId?.[currentMatchCard.id] ?? 0;
			return myMatchVotedIds.has(currentMatchCard.id) && votes < 2;
		}

		if (room.mode === 'quiz') {
			const quiz = room.quiz;
			if (!quiz) return false;
			if (quiz.status !== 'in_progress') return false;
			const qid = quiz.questionIds[quiz.currentIndex];
			if (!qid) return false;
			const myAnswer = quiz.answersByClientId?.[clientId]?.[qid];
			const votes = quiz.votesByQuestionIndex?.[String(quiz.currentIndex)] ?? 0;
			return Boolean(myAnswer) && votes < 2;
		}

		if (!currentRound) return false;
		const votes = room.blindVotesByRoundIndex?.[String(currentRound.index)] ?? 0;
		return myBlindVotedRoundIndexes.has(currentRound.index) && votes < 2;
	}, [room, roomMaxParticipants, currentMatchCard, currentRound, myMatchVotedIds, myBlindVotedRoundIndexes, clientId]);

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
				genreId,
				packId: mode === 'quiz' ? quizPackId : undefined,
				solo: mode === 'quiz' ? quizSolo : undefined,
				blindTopic: mode === 'blind' ? blindParent : undefined,
				wordsSubcategory: mode === 'blind' && blindParent === 'words' ? blindWordsSubcategory : undefined,
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

	const quiz = room?.mode === 'quiz' ? room.quiz ?? null : null;
	const quizIsFinished = Boolean(quiz && quiz.status === 'completed');
	const quizQuestionId = quiz ? quiz.questionIds[quiz.currentIndex] ?? null : null;
	const quizQuestion = quizQuestionId ? getQuestionById(quizQuestionId) : null;
	const myQuizOptionId = quiz && quizQuestionId ? quiz.answersByClientId?.[clientId]?.[quizQuestionId] ?? null : null;
	const quizProgressText = quiz ? `${Math.min(quiz.currentIndex + 1, quiz.totalQuestions)}/${quiz.totalQuestions}` : '';

	const tipsTopic =
		!room ? 'modes' : room.mode === 'quiz' ? 'quiz' : room.mode === 'blind' ? (inferredBlindTopic ?? blindParent) : 'movies';
	const tipsCategoryLabel =
		tipsTopic === 'modes'
			? null
			: room?.mode === 'quiz'
			? (QUIZ_PACKS[quiz?.packId ?? quizPackId]?.label ?? null)
			: tipsTopic === 'words'
			? WORD_PAIRS_SUBCATEGORIES.find((s) => s.id === blindWordsSubcategory)?.label ?? null
			: selectedMovieCategoryLabel;

	const tipsViewLabel = useMemo(() => {
		if (!room) return 'Start';
		if (room.mode === 'match') {
			if (isMatched && matchCard) return `Pierwszy match — zgodność: ${matchCard.title}`;
			if (!isReady) return 'Pierwszy match — czekam na 2. osobę';
			if (waitingForPartner) return 'Pierwszy match — czekam na wybór partnera';
			return 'Pierwszy match — głosowanie';
		}
		if (room.mode === 'blind') {
			if (blindIsFinished) return tipsTopic === 'words' ? 'Randka w ciemno — Hasła — podsumowanie' : 'Randka w ciemno — podsumowanie';
			if (!isReady) return tipsTopic === 'words' ? 'Randka w ciemno — Hasła — czekam na 2. osobę' : 'Randka w ciemno — czekam na 2. osobę';
			if (waitingForPartner) return tipsTopic === 'words' ? 'Randka w ciemno — Hasła — czekam na wybór partnera' : 'Randka w ciemno — czekam na wybór partnera';
			return tipsTopic === 'words' ? 'Randka w ciemno — Hasła — wybór' : 'Randka w ciemno — wybór';
		}
		// quiz
		const maxP = room.maxParticipants ?? 2;
		const solo = maxP === 1;
		if (quizIsFinished) return solo ? 'Gusta — Solo — wyniki' : 'Gusta — wyniki';
		if (!isReady) return solo ? 'Gusta — Solo' : 'Gusta — czekam na 2. osobę';
		if (waitingForPartner) return 'Gusta — czekam na odpowiedź partnera';
		return solo ? 'Gusta — Solo — pytanie' : 'Gusta — pytanie';
	}, [room, isMatched, matchCard, isReady, waitingForPartner, blindIsFinished, tipsTopic, quizIsFinished]);

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

	async function submitQuiz(optionId: string) {
		if (!room || room.mode !== 'quiz') return;
		if (!quizQuestionId) return;
		await postJson<{ room: RoomView }>('/api/rooms/quiz/answer', {
			roomId: room.roomId,
			clientId,
			questionId: quizQuestionId,
			optionId,
		});
	}

	const [quizSummaryLoading, setQuizSummaryLoading] = useState(false);
	const [quizSummaryError, setQuizSummaryError] = useState<string | null>(null);

	async function generateQuizSummary(fresh = false) {
		if (!room || room.mode !== 'quiz') return;
		setQuizSummaryError(null);
		setQuizSummaryLoading(true);
		try {
			const res = await postJson<{ room: RoomView; cached?: boolean }>('/api/rooms/quiz/ai-summary', {
				roomId: room.roomId,
				fresh,
			});
			setRoom(res.room);
		} catch (e) {
			setQuizSummaryError(e instanceof Error ? e.message : 'Nieznany błąd.');
		} finally {
			setQuizSummaryLoading(false);
		}
	}

	return (
		<div className="relative min-h-screen font-sans text-zinc-50">
			<AnimatedBackground text="❤️ MADE WITH LOVE ❤️" />
			<div className="relative z-10 min-h-screen">
				{descriptionModal ? (
					<div
						role="dialog"
						aria-label="Opis"
						className="fixed inset-0 z-70 flex items-end p-4"
						onPointerDown={() => setDescriptionModal(null)}
					>
						<div
							className="w-full rounded-3xl border border-white/10 bg-zinc-950/60 p-4 text-white backdrop-blur-xl"
							onPointerDown={(e) => e.stopPropagation()}
							data-testid="description-modal"
						>
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="text-sm font-semibold text-white/95">{descriptionModal.title}</p>
									<p className="mt-0.5 text-xs text-white/60">Opis</p>
								</div>
								<button
									type="button"
									onClick={() => setDescriptionModal(null)}
									className={`${BUTTON_MOTION_DARK} inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white`}
									aria-label="Zamknij opis"
								>
									<X className="h-5 w-5" />
								</button>
							</div>
							<p className="mt-3 whitespace-pre-wrap text-sm text-white/90">{descriptionModal.text}</p>
						</div>
					</div>
				) : null}
			<a
				href="https://buycoffee.to/mothman910"
				target="_blank"
				rel="noreferrer noopener"
				aria-label="Postaw kawę na buycoffee.to"
				title="Postaw kawę"
				className={`${BUTTON_MOTION_SOFT} fixed bottom-20 right-4 z-60 inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 px-4 text-sm font-semibold text-white/90 backdrop-blur-xl ring-1 ring-white shadow-[0_0_14px_2px] shadow-orange-400/70 supports-[hover:hover]:hover:ring-white supports-[hover:hover]:hover:shadow-[0_0_18px_3px] supports-[hover:hover]:hover:shadow-orange-400/90`}
				style={{
					backgroundImage:
						'linear-gradient(90deg, rgba(131, 58, 180, 0.3) 0%, rgba(253, 29, 29, 0.3) 50%, rgba(252, 176, 69, 0.3) 100%)',
				}}
			>
				<Image
					src="/images/logo-sygnet.png"
					alt=""
					width={244}
					height={158}
					className="h-4 w-auto object-contain"
					priority={false}
				/>
				Postaw kawę
			</a>
			<AiTipsFab
				context={{
					topic: tipsTopic,
					mode: (room?.mode ?? 'none'),
					categoryLabel: tipsCategoryLabel,
					viewLabel: tipsViewLabel,
					waitingForPartner,
					isReady,
					participantsCount: room?.participantsCount,
					maxParticipants: room?.maxParticipants,
					currentTitle: room?.mode === 'match' ? (currentMatchCard?.title ?? null) : null,
					leftTitle: room?.mode === 'blind' ? (currentRound?.left.title ?? null) : null,
					rightTitle: room?.mode === 'blind' ? (currentRound?.right.title ?? null) : null,
					leftDescription: room?.mode === 'blind' ? (currentRound?.left.description ?? null) : null,
					rightDescription: room?.mode === 'blind' ? (currentRound?.right.description ?? null) : null,
					quizPackLabel: room?.mode === 'quiz' ? (QUIZ_PACKS[quiz?.packId ?? quizPackId]?.label ?? null) : null,
					quizStatus: room?.mode === 'quiz' ? (quiz?.status ?? null) : null,
					quizProgress: room?.mode === 'quiz' ? quizProgressText : null,
					quizQuestionPrompt: room?.mode === 'quiz' ? (quizQuestion?.prompt ?? null) : null,
					quizSolo: room?.mode === 'quiz' ? ((room?.maxParticipants ?? 2) === 1) : undefined,
					quizAgreementPercent:
						room?.mode === 'quiz' ? (quiz?.summary?.agreementPercent ?? null) : null,
				}}
			/>
			<button
				type="button"
				onClick={() => void toggleFullscreen()}
				className={`${BUTTON_MOTION_SOFT} fixed bottom-4 right-4 z-50 inline-flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white/90 backdrop-blur-xl`}
				aria-label={isFullscreen ? 'Wyjdź z pełnego ekranu' : 'Pełny ekran'}
				title={isFullscreen ? 'Wyjdź z pełnego ekranu' : 'Pełny ekran'}
			>
				{isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
				{isFullscreen ? 'Zwiń' : 'Pełny ekran'}
			</button>
			<main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-6 pb-32">
				<header className="flex items-start justify-between gap-3">
					<div>
						<h1 className={`${styles.brandTitle} text-2xl tracking-tight text-white/95 mb-3.5`}>
							Decyzjomat dla par 💕
						</h1>
						<p className="mt-1 text-xs text-white/60">Wybór filmu na kartach + porównanie wyborów na 2 urządzeniach</p>
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
							} ${BUTTON_MOTION}`}
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
							} ${BUTTON_MOTION}`}
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
							} ${BUTTON_MOTION}`}
						>
							Gusta
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
									} ${BUTTON_MOTION}`}
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
									} ${BUTTON_MOTION}`}
								>
									Hasła
								</button>
							</div>
						</div>
					) : null}

					{mode === 'quiz' ? (
						<div className="mt-3">
							<p className="text-xs font-semibold text-white/60">Wariant</p>
							<div className="mt-1 flex gap-2">
								<button
									type="button"
									onClick={() => setQuizSolo(false)}
									className={`h-10 flex-1 rounded-full text-sm font-semibold ${
										!quizSolo
											? 'border border-white/10 bg-white/15 text-white'
											: 'border border-white/10 bg-white/5 text-white/80'
									} ${BUTTON_MOTION}`}
								>
									Dla par
								</button>
								<button
									type="button"
									onClick={() => setQuizSolo(true)}
									className={`h-10 flex-1 rounded-full text-sm font-semibold ${
										quizSolo
											? 'border border-white/10 bg-white/15 text-white'
											: 'border border-white/10 bg-white/5 text-white/80'
									} ${BUTTON_MOTION}`}
								>
									Solo
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
										className={`${BUTTON_MOTION_SOFT} flex h-10 w-full items-center justify-between rounded-full border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white/90 backdrop-blur-xl`}
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
										className={`${BUTTON_MOTION_SOFT} flex h-10 w-full items-center justify-between rounded-full border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white/90 backdrop-blur-xl`}
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
											? (Object.keys(QUIZ_PACKS) as QuizPackId[]).map((packId) => {
													const selected = packId === quizPackId;
													const label = QUIZ_PACKS[packId]?.label ?? packId;
													if (selected) {
														return (
															<button
																type="button"
																role="option"
																aria-selected="true"
																key={packId}
																onClick={() => {
																	setQuizPackId(packId);
																	setCategoryOpen(false);
																}}
																className={`${BUTTON_MOTION} flex w-full items-center justify-between rounded-r-xl rounded-l-none bg-white/10 px-3 py-2 text-left text-sm font-semibold hover:bg-white/15 focus:bg-white/15 focus:outline-none`}
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
															key={packId}
															onClick={() => {
																setQuizPackId(packId);
																setCategoryOpen(false);
															}}
															className={`${BUTTON_MOTION} flex w-full items-center justify-between rounded-r-xl rounded-l-none px-3 py-2 text-left text-sm font-semibold hover:bg-white/10 focus:bg-white/10 focus:outline-none`}
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
														className={`${BUTTON_MOTION} flex w-full items-center justify-between rounded-r-xl rounded-l-none bg-white/10 px-3 py-2 text-left text-sm font-semibold hover:bg-white/15 focus:bg-white/15 focus:outline-none`}
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
														className={`${BUTTON_MOTION} flex w-full items-center justify-between rounded-r-xl rounded-l-none px-3 py-2 text-left text-sm font-semibold hover:bg-white/10 focus:bg-white/10 focus:outline-none`}
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
															className={`${BUTTON_MOTION} flex w-full items-center justify-between rounded-r-xl rounded-l-none bg-white/10 px-3 py-2 text-left text-sm font-semibold hover:bg-white/15 focus:bg-white/15 focus:outline-none`}
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
														className={`${BUTTON_MOTION} flex w-full items-center justify-between rounded-r-xl rounded-l-none px-3 py-2 text-left text-sm font-semibold hover:bg-white/10 focus:bg-white/10 focus:outline-none`}
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
							className={`${BUTTON_MOTION_SOFT} h-10 flex-1 rounded-full border border-white/10 bg-white/15 text-sm font-semibold text-white disabled:opacity-50`}
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
							className={`${BUTTON_MOTION} h-10 w-20 rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white/90 disabled:opacity-50 supports-[hover:hover]:hover:bg-white/10`}
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
								className={`${BUTTON_MOTION} inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white/80 supports-[hover:hover]:hover:bg-white/10`}
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
								{room.participantsCount}/{roomMaxParticipants} połączone{' '}
								{isReady ? '— START' : roomMaxParticipants === 1 ? '' : '— czekam na drugą osobę'}
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
											<div className="mt-4 flex justify-center">
												<BuyCoffeeToButton />
											</div>
										</div>
									</div>
								) : null}

								{currentMatchCard ? (
									<TinderCard
										card={currentMatchCard}
										badge={!isReady ? 'Czekam na 2. osobę' : waitingForPartner ? 'Czekam na wybór partnera' : null}
										disabled={!isReady || isMatched || myMatchVotedIds.has(currentMatchCard.id)}
										expanded={expandedCardIds.has(currentMatchCard.id)}
										onToggleExpanded={() => {
											if (isMobile && currentMatchCard.description) {
												setDescriptionModal({ title: currentMatchCard.title, text: currentMatchCard.description });
												return;
											}
											setExpandedCardIds((prev) => {
												const next = new Set(prev);
												if (next.has(currentMatchCard.id)) next.delete(currentMatchCard.id);
												else next.add(currentMatchCard.id);
												return next;
											});
										}}
										onNope={() => void submitMatch('nope')}
										onLike={() => void submitMatch('like')}
									/>
								) : (
									<p className="text-sm text-white/60">Brak kart.</p>
								)}
							</div>
						) : room.mode === 'quiz' ? (
							<div className="space-y-4">
								{quiz ? (
									<div className="flex items-center justify-between">
										<p className="text-xs font-semibold text-white/60">
											Pakiet: <span className="text-white/85">{QUIZ_PACKS[quiz.packId]?.label ?? quiz.packId}</span>
										</p>
										<p className="text-xs font-semibold text-white/60">{quizIsFinished ? 'Zakończone' : quizProgressText}</p>
									</div>
								) : null}

								{!quiz ? (
									<p className="text-sm text-white/60">Brak danych quizu.</p>
								) : quizIsFinished ? (
									<div className="space-y-4">
										<div className="rounded-2xl border border-white/10 bg-white/5 p-3">
											<p className="text-sm font-semibold text-white/95">Wynik</p>
											{roomMaxParticipants !== 1 && quiz.summary?.agreementPercent != null ? (
												<p className="mt-1 text-xs text-white/70">Zgodność: {quiz.summary.agreementPercent}%</p>
											) : null}
											<div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60">
												<span className="inline-flex items-center gap-2">
													<span className="h-2 w-2 rounded-full bg-white/80" /> Ty
												</span>
												{roomMaxParticipants !== 1 ? (
													<span className="inline-flex items-center gap-2">
														<span className="h-2 w-2 rounded-full bg-white/50" /> Partner
													</span>
												) : null}
												<span className="inline-flex items-center gap-2">
													<span className="h-2 w-px bg-white/35" /> Środek osi
												</span>
											</div>
											<p className="mt-2 text-xs text-white/60">
												Jak liczymy punkty: każda odpowiedź dodaje/odejmuje punkty na wybranych osiach, a wynik osi to suma z całego testu.
												Wynik ujemny ciągnie w lewo, dodatni w prawo
												{roomMaxParticipants !== 1 ? '; „Różnica” to odległość między Waszymi wynikami.' : '.'}
												Skala min/0/max pod termometrem jest liczona z możliwych odpowiedzi w tym konkretnym zestawie pytań.
											</p>
										</div>

										<div className="space-y-3">
											{QUIZ_AXES.map((axisId) => {
												const partnerId = room.participantClientIds.find((id) => id !== clientId) ?? null;
												const me = quiz.scoresByClientId?.[clientId]?.[axisId] ?? 0;
												const partner =
													roomMaxParticipants !== 1 && partnerId
														? quiz.scoresByClientId?.[partnerId]?.[axisId] ?? 0
														: 0;
												const diff = Math.abs(me - partner);
												const range = computeAxisScoreRange(quiz.questionIds, axisId);
												const denom = Math.max(1, range.max - range.min);
												const zeroPct = clamp(((0 - range.min) / denom) * 100, 0, 100);
												const mePct = clamp(((me - range.min) / denom) * 100, 0, 100);
												const partnerPct = clamp(((partner - range.min) / denom) * 100, 0, 100);
												const poles = splitAxisPoles(axisId);

												return (
													<div key={axisId} className="rounded-2xl border border-white/10 bg-white/5 p-3">
														<div className="flex items-start justify-between gap-2">
															<p className="text-xs font-semibold text-white/85">{getAxisLabel(axisId)}</p>
															{roomMaxParticipants !== 1 ? (
																<p className="text-xs text-white/60">Różnica: {diff}</p>
															) : null}
														</div>

														<div className="mt-2">
															<div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
																<div
																	className={`absolute top-0 h-2 w-px -translate-x-1/2 bg-white/35 ${pctToLeftClass(zeroPct)}`}
																/>
																<div
																	className={`absolute top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-white/80 ${pctToLeftClass(mePct)}`}
																/>
																{roomMaxParticipants !== 1 ? (
																	<div
																		className={`absolute top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-white/50 ${pctToLeftClass(partnerPct)}`}
																	/>
																) : null}
															</div>
															<div className="relative mt-1 h-4 text-[10px] text-white/45">
																<span className="absolute left-0 tabular-nums">{range.min}</span>
																<span className={`absolute top-0 -translate-x-1/2 tabular-nums ${pctToLeftClass(zeroPct)}`}>
																	0
																</span>
																<span className="absolute right-0 tabular-nums">{range.max}</span>
															</div>
															<div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-white/60">
																<span className="truncate">{poles.left}</span>
																<span className="truncate">{poles.right}</span>
															</div>
															<div className="mt-1 flex items-center justify-between gap-3 text-[11px] text-white/60">
																<span>Ty: {me}</span>
																{roomMaxParticipants !== 1 ? <span>Partner: {partner}</span> : null}
															</div>
														</div>
													</div>
												);
											})}
										</div>

										<div className="flex gap-2">
											<button
												type="button"
												onClick={() =>
													downloadGustyPdf({ filename: `gusta-${room.code}.pdf`, room, clientId, quizAxes: QUIZ_AXES })
												}
												className="h-10 flex-1 rounded-full border border-white/10 bg-white/15 text-sm font-semibold text-white"
											>
												Pobierz PDF
											</button>
										</div>

										<div className="rounded-2xl border border-white/10 bg-white/5 p-3">
											<div className="flex items-center justify-between gap-2">
												<p className="text-sm font-semibold text-white/95">Podsumowanie</p>
												{roomMaxParticipants !== 1 ? (
													<button
														type="button"
														onClick={() => void generateQuizSummary(Boolean(quiz.aiSummary?.text))}
														disabled={quizSummaryLoading}
														className="h-8 rounded-full border border-white/10 bg-white/10 px-3 text-xs font-semibold text-white/90 disabled:opacity-50"
													>
														{quizSummaryLoading
															? quiz.aiSummary?.text
																? 'Odświeżam…'
																: 'Generuję…'
															: quiz.aiSummary?.text
															? 'Odśwież'
															: 'Generuj'}
												</button>
											) : null}
										</div>

										{roomMaxParticipants === 1 ? (
											<p className="mt-2 text-xs text-white/60">Podsumowanie jest dostępne w wariancie „Dla par”.</p>
										) : (
											<>
												{quizSummaryError ? <p className="mt-2 text-xs text-red-400">{quizSummaryError}</p> : null}
												{quiz.aiSummary?.text ? (
													<div className="mt-3">{renderMarkdownLite(quiz.aiSummary.text)}</div>
												) : (
													<p className="mt-2 text-xs text-white/60">Kliknij „Generuj”, żeby dostać krótkie, konkretne zasady kompromisu.</p>
												)}
											</>
										)}
									</div>

										<div className="flex justify-end">
											<BuyCoffeeToButton />
										</div>
									</div>
								) : (
									<div className="space-y-3">
										{!isReady && roomMaxParticipants === 2 ? (
											<p className="text-xs font-semibold text-white/60">Połączcie się we dwoje, żeby zacząć.</p>
										) : null}
										{quizQuestion ? (
											<div className="rounded-2xl border border-white/10 bg-white/5 p-3">
												<p className="text-sm font-semibold text-white/95">{quizQuestion.prompt}</p>
												<p className="mt-1 text-xs text-white/60">Wybierz najbliższą odpowiedź.</p>
											</div>
										) : (
											<p className="text-sm text-white/60">Brak pytania.</p>
										)}

										{quizQuestion ? (
											<div className="space-y-2">
												{quizQuestion.options.map((opt) => {
													const selected = opt.id === myQuizOptionId;
													const disabled = !isReady || Boolean(myQuizOptionId);
													return (
														<button
															key={opt.id}
															type="button"
															onClick={() => void submitQuiz(opt.id)}
															disabled={disabled}
															className={`w-full rounded-2xl border px-3 py-3 text-left text-sm font-semibold backdrop-blur-xl disabled:opacity-60 ${
															selected
																? 'border-white/10 bg-white/15 text-white'
																: 'border-white/10 bg-white/5 text-white/90 hover:bg-white/10'
														}`}
													>
														<div className="flex items-center justify-between gap-2">
															<span className="truncate">{opt.label}</span>
															{selected ? <Check className="h-4 w-4 text-white/80" /> : null}
														</div>
													</button>
													);
												})}
											</div>
										) : null}

										{myQuizOptionId ? (
											<p className="text-xs font-semibold text-white/60">
												Wybrane{roomMaxParticipants === 1 ? '.' : '. Czekam na partnera…'}
											</p>
										) : null}
									</div>
								)}
							</div>
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
