import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { id, rol, udns, activo, editado_por, udn_madre, nivel_jerarquico, reporta_a, vistas, permisos } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    const udn = rol === 'admin' ? null : (udns ?? []).join(',');
    const { error } = await supabaseAdmin.from('perfiles').update({
      rol, udn, activo,
      udn_madre: udn_madre ?? null,
      nivel_jerarquico: nivel_jerarquico ?? null,
      reporta_a: reporta_a ?? null,
      vistas: (vistas ?? []).join(',') || null,
      permisos: permisos ?? null,
      editado_por: editado_por ?? null,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
