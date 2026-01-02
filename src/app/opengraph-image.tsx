import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const contentType = 'image/png';
export const size = {
	width: 1200,
	height: 630,
};

export default function OpenGraphImage() {
	return new ImageResponse(
		(
			<div tw="h-full w-full flex flex-col justify-between bg-black text-white p-[72px]">
				<div tw="flex flex-col gap-[18px]">
					<div tw="text-[86px] font-extrabold tracking-[-1px]">Decyzjomat</div>
					<div tw="text-[34px] opacity-90 max-w-[980px] leading-[1.2]">
						Szybka, lekka gra w decyzje: karty, głosowanie i quiz „Gusta”.
					</div>
				</div>

				<div tw="flex items-center justify-between gap-6 text-[24px] opacity-85">
					<div>Wejdź i zagraj ze znajomymi</div>
					<div tw="flex items-center justify-center w-[84px] h-[84px] rounded-full bg-white/10 border-2 border-white/20 text-[44px] font-extrabold">
						D
					</div>
				</div>
			</div>
		),
		size,
	);
}
