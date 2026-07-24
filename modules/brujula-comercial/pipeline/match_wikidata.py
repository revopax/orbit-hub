"""
match_wikidata.py — Capa 2b: Clasificación por Wikidata API
"""
import pandas as pd
import requests
import time
import os

CHECKPOINT = 'data/wikidata_results.parquet'
MAESTRO    = 'data/df_maestro.parquet'

WIKIDATA_SCIAN_MAP = {
    'food': '31', 'beverage': '31', 'brewery': '31', 'winery': '31',
    'pharmaceutical': '32', 'chemical': '32', 'cosmetic': '32',
    'automotive': '33', 'electronics': '33', 'machinery': '33',
    'textile': '31', 'clothing': '31', 'tobacco': '31',
    'manufacturing': '31', 'consumer goods': '31',
    'retail': '46', 'supermarket': '46', 'department store': '46',
    'wholesale': '43', 'distribution': '43',
    'consulting': '54', 'software': '54', 'technology': '54',
    'information technology': '54', 'engineering': '54',
    'accounting': '54', 'law': '54', 'research': '54',
    'bank': '52', 'insurance': '52', 'financial': '52',
    'fintech': '52', 'investment': '52', 'credit': '52',
    'media': '51', 'advertising': '51', 'publishing': '51',
    'broadcasting': '51', 'telecommunication': '51',
    'streaming': '51', 'entertainment': '71',
    'hospital': '62', 'health': '62', 'medical': '62',
    'education': '61', 'university': '61', 'school': '61',
    'construction': '23', 'real estate': '53',
    'transport': '48', 'logistics': '48', 'airline': '48',
    'mining': '21', 'oil': '21', 'energy': '22',
    'agriculture': '11', 'government': '93',
    'hospitality': '72', 'restaurant': '72', 'hotel': '72',
}

SCIAN_NOMBRE = {
    '11':'Agricultura y ganadería','21':'Minería y petróleo',
    '22':'Electricidad y agua','23':'Construcción',
    '31':'Manufactura','32':'Manufactura','33':'Manufactura',
    '43':'Comercio al por mayor','46':'Comercio al por menor',
    '48':'Transportes y logística','51':'Telecomunicaciones y medios',
    '52':'Servicios financieros y seguros','53':'Servicios inmobiliarios',
    '54':'Servicios profesionales y TI','56':'Servicios de apoyo a negocios',
    '61':'Servicios educativos','62':'Servicios de salud',
    '71':'Entretenimiento y esparcimiento','72':'Alojamiento y restaurantes',
    '81':'Otros servicios','93':'Gobierno',
}

def buscar_wikidata(nombre_empresa):
    try:
        url = "https://www.wikidata.org/w/api.php"
        headers = {'User-Agent': 'BrujulaComercial/1.0 (diego.lunal@elektra.com.mx)'}
        params = {
            'action': 'wbsearchentities',
            'search': nombre_empresa,
            'language': 'en',
            'type': 'item',
            'limit': 3,
            'format': 'json'
        }
        resp = requests.get(url, params=params, headers=headers, timeout=10)
        data = resp.json()

        if not data.get('search'):
            return None, None, None, 0.0

        entity_id = data['search'][0]['id']
        entity_label = data['search'][0].get('label', '')
        entity_desc = data['search'][0].get('description', '').lower()

        params2 = {
            'action': 'wbgetentities',
            'ids': entity_id,
            'props': 'claims',
            'format': 'json'
        }
        resp2 = requests.get(url, params=params2, headers=headers, timeout=10)
        data2 = resp2.json()
        claims = data2.get('entities', {}).get(entity_id, {}).get('claims', {})

        industria_raw = ''
        for prop in ['P452', 'P31']:
            if prop in claims:
                for claim in claims[prop]:
                    try:
                        qid = claim['mainsnak']['datavalue']['value']['id']
                        r = requests.get(url, headers=headers, params={
                            'action': 'wbgetentities',
                            'ids': qid,
                            'props': 'labels',
                            'languages': 'en',
                            'format': 'json'
                        }, timeout=10)
                        label = r.json().get('entities', {}).get(qid, {})                                .get('labels', {}).get('en', {}).get('value', '')
                        if label:
                            industria_raw = label.lower()
                            break
                    except:
                        continue
                if industria_raw:
                    break

        if not industria_raw:
            industria_raw = entity_desc

        scian = None
        for keyword, codigo in WIKIDATA_SCIAN_MAP.items():
            if keyword in industria_raw:
                scian = codigo
                break

        confianza = 0.9 if scian else 0.5
        return entity_label, industria_raw, scian, confianza

    except Exception as e:
        print(f"    Error: {e}")
        return None, None, None, 0.0


def run():
    print("=== Match Wikidata — Capa 2b ===")
    df = pd.read_parquet(MAESTRO)

    sin_denue = df[
        ~df['fuente_scian'].isin(['denue_match', 'mapeo_hubspot'])
    ][['nombre_norm', 'Nombre de la empresa']].drop_duplicates('nombre_norm')
    sin_denue = sin_denue[
        sin_denue['nombre_norm'].notna() &
        (sin_denue['nombre_norm'].str.strip() != '') &
        (sin_denue['nombre_norm'].str.strip() != 'nan')
    ]
    print(f"Empresas sin DENUE: {len(sin_denue):,}")

    if os.path.exists(CHECKPOINT):
        ya = pd.read_parquet(CHECKPOINT)
        ids_ya = set(ya['nombre_norm'].tolist())
        pendientes = sin_denue[~sin_denue['nombre_norm'].isin(ids_ya)]
        print(f"Ya procesadas: {len(ya):,} | Pendientes: {len(pendientes):,}")
    else:
        ya = pd.DataFrame()
        pendientes = sin_denue

    if len(pendientes) == 0:
        print("✅ Todo procesado")
        return

    nombres = pendientes['nombre_norm'].tolist()
    nombres_orig = pendientes['Nombre de la empresa'].tolist()
    resultados = []
    procesadas = 0
    CHECKPOINT_N = 50
    errores_consec = 0

    for norm, orig in zip(nombres, nombres_orig):
        buscar = orig if orig and str(orig).strip() not in ['nan', ''] else norm
        entity_label, industria, scian, confianza = buscar_wikidata(buscar)

        if entity_label is None:
            errores_consec += 1
        else:
            errores_consec = 0

        if errores_consec >= 10:
            print(f"\n🛑 10 errores consecutivos. Guardando checkpoint...")
            break

        resultados.append({
            'nombre_norm':        norm,
            'Nombre de la empresa': orig,
            'Empresa_Wikidata':   entity_label or '',
            'Industria_Wikidata': industria or '',
            'SCIAN_2_Wikidata':   scian,
            'SCIAN_nombre_Wiki':  SCIAN_NOMBRE.get(scian, '') if scian else '',
            'Confianza_Wikidata': confianza,
            'Fuente':             'wikidata' if scian else 'wikidata_sin_match',
        })

        procesadas += 1
        time.sleep(0.3)

        if procesadas % CHECKPOINT_N == 0 or procesadas == len(nombres):
            df_nuevos = pd.DataFrame(resultados)
            combined = pd.concat([ya, df_nuevos], ignore_index=True) if len(ya) > 0 else df_nuevos
            combined.to_parquet(CHECKPOINT, index=False)
            encontrados = sum(1 for r in resultados if r['SCIAN_2_Wikidata'])
            pct = procesadas / len(nombres) * 100
            print(f"  Checkpoint {procesadas:,}/{len(nombres):,} ({pct:.1f}%) — {encontrados} con SCIAN")

    if resultados:
        df_final = pd.DataFrame(resultados)
        combined = pd.concat([ya, df_final], ignore_index=True) if len(ya) > 0 else df_final
        combined.to_parquet(CHECKPOINT, index=False)
        con_scian = combined['SCIAN_2_Wikidata'].notna().sum()
        print(f"\n✅ Completado: {len(combined):,} empresas")
        print(f"   Con SCIAN: {con_scian:,} ({con_scian/len(combined)*100:.1f}%)")

if __name__ == "__main__":
    run()
