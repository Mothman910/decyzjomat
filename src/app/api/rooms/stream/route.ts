import { NextResponse } from 'next/server';
import { getRoom, subscribe, viewRoom } from '@/lib/roomStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sseFormat(data: unknown): string {
	return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: Request) {
	const url = new URL(request.url);
	const roomId = url.searchParams.get('roomId');

	if (!roomId) {
		return NextResponse.json({ error: 'Brak roomId.' }, { status: 400 });
	}

	const room = getRoom(roomId);
	if (!room) {
		return NextResponse.json({ error: 'Nie znaleziono pokoju.' }, { status: 404 });
	}

	const encoder = new TextEncoder();

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			// initial snapshot
			controller.enqueue(encoder.encode(sseFormat({ type: 'room:update', room: viewRoom(room) })));

			const unsubscribe = subscribe(roomId, (payload) => {
				controller.enqueue(encoder.encode(sseFormat(payload)));
			});

			const ping = setInterval(() => {
				controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`));
			}, 15000);

			request.signal.addEventListener('abort', () => {
				clearInterval(ping);
				unsubscribe();
				try {
					controller.close();
				} catch {
					// noop
				}
			});
		},
	});

	return new Response(stream, {
		status: 200,
		headers: {
			'content-type': 'text/event-stream; charset=utf-8',
			'cache-control': 'no-cache, no-transform',
			connection: 'keep-alive',
		},
	});
}
