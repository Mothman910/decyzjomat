import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const runtime = 'nodejs';

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

function isHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

function fallbackImageForRequest(request: Request): string {
	return new URL('/globe.svg', request.url).toString();
}

function resolveMaybeRelativeUrl(value: string | null, baseUrl: string): string | null {
	if (!value) return null;
	try {
		return new URL(value, baseUrl).toString();
	} catch {
		return null;
	}
}

function pickMeta(
	$: cheerio.CheerioAPI,
	selectors: Array<{ attr: 'property' | 'name'; key: string }>,
): string | null {
	for (const selector of selectors) {
		const raw = $(`meta[${selector.attr}="${selector.key}"]`).attr('content');
		const value = raw?.trim();
		if (value) return value;
	}
	return null;
}

export async function POST(request: Request): Promise<NextResponse<ScrapeMetadataResponse>> {
	const fallbackImage = fallbackImageForRequest(request);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json(
			{
				success: false,
				url: '',
				title: null,
				description: null,
				image: fallbackImage,
				error: 'Nieprawidłowe body (oczekiwano JSON).',
			},
			{ status: 400 },
		);
	}

	const inputUrl = (body as { url?: unknown } | null)?.url;
	if (typeof inputUrl !== 'string' || !inputUrl.trim()) {
		return NextResponse.json(
			{
				success: false,
				url: '',
				title: null,
				description: null,
				image: fallbackImage,
				error: 'Brak pola "url" (string).',
			},
			{ status: 400 },
		);
	}

	const url = inputUrl.trim();
	if (!isHttpUrl(url)) {
		return NextResponse.json(
			{
				success: false,
				url,
				title: null,
				description: null,
				image: fallbackImage,
				error: 'URL musi zaczynać się od http:// lub https://',
			},
			{ status: 400 },
		);
	}

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 8000);

		const response = await fetch(url, {
			method: 'GET',
			redirect: 'follow',
			signal: controller.signal,
			headers: {
				'user-agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'accept-language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
			},
		});

		clearTimeout(timeout);

		if (!response.ok) {
			return NextResponse.json({
				success: false,
				url,
				title: null,
				description: null,
				image: fallbackImage,
				error: `Nie udało się pobrać strony (HTTP ${response.status}).`,
			});
		}

		const contentType = response.headers.get('content-type') ?? '';
		if (!contentType.toLowerCase().includes('text/html')) {
			return NextResponse.json({
				success: false,
				url,
				title: null,
				description: null,
				image: fallbackImage,
				error: 'URL nie zwrócił HTML (text/html).',
			});
		}

		const html = await response.text();
		const $ = cheerio.load(html);

		const ogTitle = pickMeta($, [{ attr: 'property', key: 'og:title' }]);
		const htmlTitle = $('title').first().text().trim() || null;
		const title = ogTitle ?? htmlTitle;

		const description =
			pickMeta($, [
				{ attr: 'property', key: 'og:description' },
				{ attr: 'name', key: 'description' },
			]) ?? null;

		const rawImage =
			pickMeta($, [
				{ attr: 'property', key: 'og:image' },
				{ attr: 'name', key: 'twitter:image' },
			]) ?? null;

		const image = resolveMaybeRelativeUrl(rawImage, response.url) ?? fallbackImage;

		return NextResponse.json({
			success: true,
			url,
			title,
			description,
			image,
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Nieznany błąd.';
		return NextResponse.json({
			success: false,
			url,
			title: null,
			description: null,
			image: fallbackImage,
			error: `Nie udało się odczytać metadanych (możliwe blokowanie botów). ${message}`,
		});
	}
}
