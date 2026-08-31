import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const udn = req.nextUrl.searchParams.get('udn');
  if (!udn) return NextResponse.json({ error: 'udn requerido' }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from('brujula_industrias_udn')
    .select('*')
    .eq('udn', udn)
    .gt('rank', 5)
    .order('rank', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { udn, filas } = body as { udn: string; filas: { sector_nombre: string; mes_pico: string }[] };
    if (!udn || !Array.isArray(filas)) {
      return NextResponse.json({ error: 'udn y filas requeridos' }, { status: 400 });
    }
    const del = await supabaseAdmin.from('brujula_industrias_udn').delete().eq('udn', udn).gt('rank', 5);
    if (del.error) {
      console.error('DELETE error:', del.error);
      return NextResponse.json({ error: 'delete: ' + del.error.message }, { status: 500 });
    }
    if (filas.length > 0) {
      const rows = filas.map((f, i) => ({
        udn,
        sector_nombre: f.sector_nombre,
        rank: 6 + i,
        mql: 0,
        leads: 0,
        temperatura: 'sin_historial',
        mes_pico: f.mes_pico,
      }));
      const { error } = await supabaseAdmin.from('brujula_industrias_udn').insert(rows);
      if (error) {
        console.error('INSERT error:', error);
        return NextResponse.json({ error: 'insert: ' + error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('POST calendario-extra fatal:', e);
    return NextResponse.json({ error: 'fatal: ' + (e?.message || String(e)) }, { status: 500 });
  }
}
