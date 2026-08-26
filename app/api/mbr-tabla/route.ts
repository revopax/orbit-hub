import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL_MBR || 'https://wuwhcljeigskajjoyghv.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY_MBR || '';

export async function GET(request: Request) {
  try {
    if (!SERVICE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY_MBR no configurada' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    if (!table) {
      return NextResponse.json({ error: 'Falta parametro table' }, { status: 400 });
    }

    const forwardParams = new URLSearchParams(searchParams);
    forwardParams.delete('table');

    const range = request.headers.get('range');
    const headers: Record<string, string> = {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    };
    if (range) {
      headers['Range'] = range;
      headers['Prefer'] = 'count=exact';
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${forwardParams.toString()}`, { headers });
    const data = await res.json();

    return NextResponse.json(data, {
      status: res.status,
      headers: { 'Content-Range': res.headers.get('content-range') || '' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
