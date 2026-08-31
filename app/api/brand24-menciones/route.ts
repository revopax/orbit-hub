import { NextResponse } from 'next/server';

const CLASIFICACION: { patrones: string[]; tipo: string }[] = [
  { patrones: ['nuevas tiendas', 'abrirá sucursales', 'amplía su presencia', 'entra al mercado mexicano'], tipo: 'Expansión' },
  { patrones: ['ronda de inversión', 'levanta capital', 'cierra ronda serie'], tipo: 'Inversión' },
  { patrones: ['nuevo director de marketing', 'nuevo cmo'], tipo: 'Cambio de puesto' },
];

function clasificar(texto: string): string {
  const t = (texto || '').toLowerCase();
  for (const c of CLASIFICACION) {
    if (c.patrones.some(p => t.includes(p))) return c.tipo;
  }
  return 'Otro';
}

export async function GET() {
  const apiKey = process.env.BRAND24_API_KEY;
  const projectId = process.env.BRAND24_PROJECT_ID;
  if (!apiKey || !projectId) {
    return NextResponse.json({ error: 'Faltan credenciales de Brand24' }, { status: 500 });
  }

  const hoy = new Date();
  const hace7dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  try {
    const url = `https://api-data.brand24.com/api-data/v1/project/${projectId}/mentions?date_from=${fmt(hace7dias)}&date_to=${fmt(hoy)}&limit=50`;
    const res = await fetch(url, { headers: { 'X-Api-Key': apiKey }, next: { revalidate: 300 } });
    const json = await res.json();

    if (json.status !== 'success') {
      return NextResponse.json({ error: json.message || 'Error de Brand24' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
    }

    const results = (json.message?.results ?? []).map((m: any) => {
      const textoCompleto = `${m.title || ''} ${m.content || ''}`;
      return {
        fecha: m.date,
        hora: m.time,
        titulo: m.title || m.content?.slice(0, 80) || 'Mención',
        contenido: m.content || '',
        fuente: m.host || m.source || 'Brand24',
        sentimiento: m.sentiment,
        tipo: clasificar(textoCompleto),
      };
    });

    return NextResponse.json({ data: results });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'fatal' }, { status: 500 });
  }
}
