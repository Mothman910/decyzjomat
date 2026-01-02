import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const contentType = 'image/png';
export const size = {
	width: 1200,
	height: 630,
};

export default function TwitterImage() {
	return new ImageResponse(
		(
			<div tw="h-full w-full flex flex-col justify-between bg-black text-white p-[72px]">
				<div tw="flex flex-col gap-[18px]">
					<div tw="text-[86px] font-extrabold tracking-[-1px]">Decyzjomat</div>
					<div tw="text-[34px] opacity-90 max-w-[980px] leading-[1.2]">
						Karty, głosowanie i quiz „Gusta” — szybka gra na wspólny wieczór.
					</div>
				</div>
				<div tw="text-[24px] opacity-85">Udostępnij i grajcie razem</div>
			</div>
		),
		size,
	);
}
