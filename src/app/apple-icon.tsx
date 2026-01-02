import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const contentType = 'image/png';
export const size = {
	width: 180,
	height: 180,
};

export default function AppleIcon() {
	return new ImageResponse(
		(
			<div tw="h-full w-full flex items-center justify-center bg-black text-white rounded-[36px] text-[110px] font-black">
				D
			</div>
		),
		size,
	);
}
