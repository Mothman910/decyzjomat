import { NextResponse } from 'next/server';
import { findRoomByCode, joinRoom } from '@/lib/roomStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type JoinRoomRequest = {
	code: string;
	clientId: string;
};

export async function POST(request: Request) {
	let body: JoinRoomRequest;
	try {
		body = (await request.json()) as JoinRoomRequest;
	} catch {
		return NextResponse.json({ error: 'Nieprawidłowe body (oczekiwano JSON).' }, { status: 400 });
	}

	if (!body.code || typeof body.code !== 'string') {
		return NextResponse.json({ error: 'Brak code.' }, { status: 400 });
	}
	if (!body.clientId || typeof body.clientId !== 'string') {
		return NextResponse.json({ error: 'Brak clientId.' }, { status: 400 });
	}

	const room = findRoomByCode(body.code);
	if (!room) {
		return NextResponse.json({ error: 'Nie znaleziono pokoju.' }, { status: 404 });
	}

	try {
		const view = joinRoom(room, body.clientId);
		return NextResponse.json({ room: view });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Nieznany błąd.';
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
