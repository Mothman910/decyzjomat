import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const contentType = 'image/png';
export const size = {
	width: 32,
	height: 32,
};

export default function Icon() {
	return new ImageResponse(
		(
			<div tw="h-full w-full flex items-center justify-center bg-black text-white rounded-[6px] text-[20px] font-black">
				D
			</div>
		),
		size,
	);
}
