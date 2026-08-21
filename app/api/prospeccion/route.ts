import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// SCIAN_2 -> nombre oficial DENUE, homologado con pipeline Brújula
const SCIAN_MAP: Record<string, string> = {
  '11': 'Agricultura, cría y explotación de animales, aprovechamiento forestal, pesca y caza',
  '21': 'Minería',
  '22': 'Generación, transmisión y distribución de energía eléctrica, suministro de agua y de gas',
  '23': 'Construcción',
  '31': 'Industrias manufactureras', '32': 'Industrias manufactureras', '33': 'Industrias manufactureras',
  '43': 'Comercio al por mayor',
  '46': 'Comercio al por menor',
  '48': 'Transportes, correos y almacenamiento', '49': 'Transportes, correos y almacenamiento',
  '51': 'Información en medios masivos',
  '52': 'Servicios financieros y de seguros',
  '53': 'Servicios inmobiliarios y de alquiler de bienes muebles e intangibles',
  '54': 'Servicios profesionales, científicos y técnicos',
  '55': 'Corporativos',
  '56': 'Servicios de apoyo a los negocios y manejo de desechos y servicios de remediación',
  '61': 'Servicios educativos',
  '62': 'Servicios de salud y de asistencia social',
  '71': 'Servicios de esparcimiento culturales y deportivos, y otros servicios recreativos',
  '72': 'Servicios de alojamiento temporal y de preparación de alimentos y bebidas',
  '81': 'Otros servicios excepto actividades gubernamentales',
  '93': 'Actividades legislativas, gubernamentales, de impartición de justicia y de organismos internacionales y extraterritoriales',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scian2 = searchParams.get('scian2');
    const subrama4d = searchParams.get('subrama4d');
    const perOcuParam = searchParams.get('per_ocu');
    const perOcuList = perOcuParam ? perOcuParam.split(',') : [];
    const mode = searchParams.get('mode') || 'tree';

    if (mode === 'tree') {
      // Modo árbol: conteos agregados vía función SQL conteo_prospeccion (agrupa en Postgres, instantáneo)
      const { data, error } = await supabaseAdmin.rpc('conteo_prospeccion', {
        per_ocu_filtro: perOcuList.length > 0 ? perOcuList : null,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      const rows = (data || []) as { codigo_act: string; nombre_act: string; cnt: number }[];

      const ramaCount: Record<string, number> = {};
      const subramaCount: Record<string, number> = {};
      const subramaNombreCandidato: Record<string, { nombre: string; cnt: number }> = {};
      let total = 0;

      for (const row of rows) {
        const codigo = row.codigo_act || '';
        const cnt = Number(row.cnt) || 0;
        const s2 = codigo.slice(0, 2);
        const s4 = codigo.slice(0, 4);
        ramaCount[s2] = (ramaCount[s2] || 0) + cnt;
        subramaCount[s4] = (subramaCount[s4] || 0) + cnt;
        if (!subramaNombreCandidato[s4] || cnt > subramaNombreCandidato[s4].cnt) {
          subramaNombreCandidato[s4] = { nombre: row.nombre_act, cnt };
        }
        total += cnt;
      }

      const ramas = Object.entries(ramaCount)
        .map(([codigo, count]) => ({ codigo, nombre: SCIAN_MAP[codigo] || codigo, count }))
        .sort((a, b) => b.count - a.count);

      const subramas = Object.entries(subramaCount)
        .map(([codigo, count]) => ({ codigo, scian2: codigo.slice(0, 2), nombre: subramaNombreCandidato[codigo]?.nombre || codigo, count }))
        .sort((a, b) => b.count - a.count);

      return NextResponse.json({ ramas, subramas, total });
    }

    if (mode === 'detalle') {
      // Modo detalle: lista de establecimientos filtrados, limitado a 200
      let query = supabaseAdmin
        .from('denue_prospeccion')
        .select('raz_social, nom_estab, codigo_act, nombre_act, per_ocu, latitud, longitud, telefono, correoelec, municipio, entidad')
        .limit(200);

      if (scian2) query = query.like('codigo_act', `${scian2}%`);
      if (subrama4d) query = query.like('codigo_act', `${subrama4d}%`);
      if (perOcuList.length > 0) query = query.in('per_ocu', perOcuList);

      const { data, error } = await query;
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      return NextResponse.json({ data: data || [] });
    }

    return NextResponse.json({ error: 'mode inválido, usa tree o detalle' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
