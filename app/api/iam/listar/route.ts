import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: perfiles, error: errP } = await supabaseAdmin
      .from('perfiles')
      .select('*')
      .order('created_at', { ascending: true });
    if (errP) return NextResponse.json({ error: errP.message }, { status: 400 });

    const { data: usersData, error: errU } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (errU) return NextResponse.json({ error: errU.message }, { status: 400 });

    const emailMap: Record<string,string> = {};
    for (const u of usersData.users) emailMap[u.id] = u.email ?? '';

    const merged = (perfiles ?? []).map(p => ({ ...p, email: emailMap[p.id] ?? null }));
    return NextResponse.json({ data: merged });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
