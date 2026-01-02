import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { createElement } from 'react';

export const runtime = 'edge';

function clampInt(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
}

export async function GET(
	_request: NextRequest,
	ctx: { params: Promise<{ size: string }> },
) {
	const { size: sizeParam } = await ctx.params;
	const parsed = Number.parseInt(sizeParam, 10);
	const side = Number.isFinite(parsed) ? clampInt(parsed, 16, 1024) : 32;

	const radius = Math.round(side * 0.2);
	const fontSize = Math.round(side * 0.62);
	const tw = `h-full w-full flex items-center justify-center bg-black text-white font-black rounded-[${radius}px] text-[${fontSize}px]`;

	return new ImageResponse(
		createElement('div', { tw } as unknown as Record<string, unknown>, 'D'),
		{ width: side, height: side },
	);
}
