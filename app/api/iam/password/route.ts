import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
export async function POST(req: Request) {
  try {
    const { id, password, editado_por } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 });
    }
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, { password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await supabaseAdmin.from('perfiles').update({
      editado_por: editado_por ?? null,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
