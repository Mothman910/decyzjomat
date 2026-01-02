import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Decyzjomat',
		short_name: 'Decyzjomat',
		description:
			'Karty, głosowanie i quiz „Gusta” — szybka, lekka gra w decyzje na wspólny wieczór.',
		start_url: '/',
		display: 'standalone',
		background_color: '#000000',
		theme_color: '#000000',
		icons: [
			{ src: '/icons/192', sizes: '192x192', type: 'image/png' },
			{ src: '/icons/512', sizes: '512x512', type: 'image/png' },
			{ src: '/apple-icon', sizes: '180x180', type: 'image/png', purpose: 'any' },
		],
	};
}
