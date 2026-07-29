import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, password, nombre, rol, udns, creado_por, permisos } = await req.json();
    if (!email || !password || !nombre || !rol) return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
    const udn = rol === 'admin' ? null : (udns ?? []).join(',');
    const { error: perfilError } = await supabaseAdmin.from('perfiles').insert({
      id: authData.user.id, nombre, rol, udn, activo: true,
      creado_por: creado_por ?? null, permisos: permisos ?? null, updated_at: new Date().toISOString()
    });
    if (perfilError) return NextResponse.json({ error: perfilError.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
