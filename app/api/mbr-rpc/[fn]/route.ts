import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL_MBR || 'https://wuwhcljeigskajjoyghv.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY_MBR || '';

export async function POST(request: Request, { params }: { params: Promise<{ fn: string }> }) {
  try {
    if (!SERVICE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY_MBR no configurada' }, { status: 500 });
    }

    const { fn } = await params;
    const body = await request.text();

    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
