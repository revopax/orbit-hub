# ============================================================
# MOTOR 1 — Identidad: HubSpot × DENUE (Jaro-Winkler)
# v2 — Fixes:
#   1. drop_duplicates aleatorio → moda estadística por nombre
#   2. partial_ratio eliminado (infla scores con falsos positivos)
#   3. umbral_alto subido a 0.90 (más exigente, menos ruido)
# ============================================================
import pandas as pd
import numpy as np
import unicodedata
import re
from joblib import Parallel, delayed
from rapidfuzz import fuzz as rfuzz
from config import (
    COL_EMPRESA, COL_UDN, COL_TIPO, UDNS_VALIDAS, DENUE_PARQUET
)

STOPWORDS = {
    'sa','de','cv','sab','sapi','rl','srl','ac','iap','sc',
    'sociedad','anonima','variable','capital','limitada',
    'group','grupo','holding','corp','corporation','inc',
    'the','los','las','el','la','y','e','of','and',
}

NOMBRES_BASURA = {
    'X','S','M','N','-','--','---','.','..','...',
    'NA','NO','YO','SI','SN','S/N','SA','SC','CV',
    'AC','DE','Y','E','XXX','TBD','TBA','N/A','NULL',
    '1','2','3','15','52','121','650',
    'PRUEBA','TEST','CLIENTE','EMPRESA','LEAD','CONTACTO',
    'SIN NOMBRE','SIN EMPRESA','NO APLICA','AUTOMATIZACION',
}


def normalizar(texto: str) -> str:
    if pd.isna(texto):
        return ""
    t = str(texto).upper()
    t = unicodedata.normalize('NFKD', t)
    t = t.encode('ascii', 'ignore').decode('ascii')
    t = re.sub(r'[^A-Z0-9\s]', ' ', t)
    tokens = [w for w in t.split() if w not in STOPWORDS and len(w) > 1]
    return ' '.join(tokens)


def score_match(a: str, b: str) -> float:
    """
    v2: usa solo token_sort_ratio y token_set_ratio.
    partial_ratio eliminado — generaba falsos positivos al encontrar
    subcadenas cortas dentro de nombres largos de DENUE.
    """
    if not a or not b:
        return 0.0
    return max(
        rfuzz.token_sort_ratio(a, b),
        rfuzz.token_set_ratio(a, b),
    ) / 100.0


def _match_lead(nombre: str,
                denue_nombres: np.ndarray,
                denue_scian2: np.ndarray,
                denue_scian3: np.ndarray,
                umbral_alto: float,
                umbral_bajo: float) -> tuple:
    """Devuelve (status, scian_2, scian_3, score)."""
    if not nombre:
        return ('sin_match', None, None, 0.0)

    scores  = [score_match(nombre, d) for d in denue_nombres]
    idx_max = int(np.argmax(scores))
    score   = scores[idx_max]

    if score >= umbral_alto:
        return ('match_alto', denue_scian2[idx_max], denue_scian3[idx_max], round(score, 4))
    elif score >= umbral_bajo:
        return ('match_bajo', denue_scian2[idx_max], denue_scian3[idx_max], round(score, 4))
    return ('sin_match', None, None, 0.0)


def construir_catalogo_denue(denue_parquet_path: str) -> pd.DataFrame:
    """
    v2: construye catálogo usando MODA estadística por nombre_match.
    Captura TANTO scian_2 (para cruce con IGAE) COMO scian_3 (para drill-down en UI).

    Por qué la moda:
    - DENUE registra establecimientos físicos, no empresas.
    - "WALMART" aparece como tiendas (46), bodegas (43), oficinas (56).
    - drop_duplicates() elegía el primer registro = orden aleatorio del parquet.
    - La moda toma el giro con MÁS registros → el giro principal real.

    Resultado con scian_3:
    - "WALMART" → scian_2=46, scian_3=462 (Autoservicio y departamentales)
    - "BIMBO"   → scian_2=31, scian_3=311 (Industria alimentaria)
    - "BBVA"    → scian_2=52, scian_3=522 (Banca múltiple)
    """
    print("── Cargando DENUE nacional ──")
    df = pd.read_parquet(denue_parquet_path, columns=['nombre_match', 'codigo_act'])

    # Extraer 2d y 3d desde codigo_act (DENUE usa hasta 6 dígitos)
    codigo_str    = df['codigo_act'].astype(str).str.strip()
    df['scian_2'] = codigo_str.str[:2]
    df['scian_3'] = codigo_str.str[:3]

    print(f"  DENUE total (establecimientos): {len(df):>10,}")

    # Filtrar nombres basura antes de agrupar
    df_limpio = df[
        df['nombre_match'].notna() &
        (df['nombre_match'].str.strip() != '') &
        (~df['nombre_match'].str.strip().str.upper().isin(NOMBRES_BASURA)) &
        (df['nombre_match'].str.strip().str.len() >= 3)
    ].copy()

    print(f"  Registros después de limpieza:  {len(df_limpio):>10,}")

    # ── Moda para scian_2 (para cruce IGAE) ──────────────────
    moda_2 = (
        df_limpio
        .groupby('nombre_match', sort=False)['scian_2']
        .agg(lambda x: x.mode().iloc[0])
        .rename('scian_2')
    )

    # ── Moda para scian_3 (para drill-down en UI) ─────────────
    # Solo considera subsectores consistentes con el scian_2 ganador
    # para evitar casos donde la moda de scian_3 no corresponde a la moda de scian_2
    moda_3 = (
        df_limpio
        .groupby('nombre_match', sort=False)['scian_3']
        .agg(lambda x: x.mode().iloc[0])
        .rename('scian_3')
    )

    df_catalogo = pd.concat([moda_2, moda_3], axis=1).reset_index()

    # Validar consistencia: scian_3 debe empezar con scian_2
    # Si no coinciden (raro pero posible en casos de empate), usar scian_2 + "0"
    mask_incons = df_catalogo['scian_3'].str[:2] != df_catalogo['scian_2']
    df_catalogo.loc[mask_incons, 'scian_3'] = df_catalogo.loc[mask_incons, 'scian_2'] + '0'

    print(f"  Catálogo único (por moda):       {len(df_catalogo):>10,}")
    print(f"  Reducción vs drop_duplicates:    {len(df_limpio)-len(df_catalogo):>10,} menos filas")
    print(f"  Inconsistencias scian_2/3 corr.: {mask_incons.sum():>10,}")

    return df_catalogo


def run_match(df_hubspot: pd.DataFrame,
              umbral_alto: float = 0.90,
              umbral_bajo: float = 0.78) -> pd.DataFrame:
    """
    v2 — umbrales ajustados:
    - umbral_alto: 0.90 (antes 0.85) — más exigente, menos falsos positivos
    - umbral_bajo: 0.78 (antes 0.72) — rango medio más limpio
    Los leads entre 0.78-0.90 quedan como 'match_bajo' para revisión manual.
    """
    df_catalogo = construir_catalogo_denue(DENUE_PARQUET)

    denue_nombres = df_catalogo['nombre_match'].values
    denue_scian2  = df_catalogo['scian_2'].values
    denue_scian3  = df_catalogo['scian_3'].values if 'scian_3' in df_catalogo.columns else None

    df_hubspot = df_hubspot.copy()
    df_hubspot['nombre_norm'] = df_hubspot[COL_EMPRESA].apply(normalizar)

    # Filtrar nombres basura en HubSpot antes del match
    mask_valido = (
        df_hubspot['nombre_norm'].notna() &
        (df_hubspot['nombre_norm'].str.strip() != '') &
        (~df_hubspot['nombre_norm'].str.strip().str.upper().isin(NOMBRES_BASURA)) &
        (df_hubspot['nombre_norm'].str.len() >= 3)
    )

    nombres_leads = df_hubspot['nombre_norm'].tolist()
    total = len(nombres_leads)
    validos = mask_valido.sum()

    print(f"  Total leads:     {total:,}")
    print(f"  Con nombre válido: {validos:,}")
    print(f"  Sin nombre / basura: {total - validos:,} → se marcan sin_match directamente")
    print(f"  Procesando con joblib paralelo…")

    resultados = Parallel(n_jobs=-1, verbose=5)(
        delayed(_match_lead)(
            nombre if mask_valido.iloc[i] else '',
            denue_nombres, denue_scian2,
            denue_scian3 if denue_scian3 is not None else np.array([None]*len(denue_nombres)),
            umbral_alto, umbral_bajo
        )
        for i, nombre in enumerate(nombres_leads)
    )

    df_hubspot['Match_Status'] = [r[0] for r in resultados]
    df_hubspot['SCIAN_2']      = [r[1] for r in resultados]
    df_hubspot['SCIAN_3']      = [r[2] for r in resultados]
    df_hubspot['Match_Score']  = [r[3] for r in resultados]

    from config import SCIAN_MAP
    df_hubspot['SCIAN_nombre'] = df_hubspot['SCIAN_2'].map(SCIAN_MAP)
    df_hubspot['fuente_scian'] = df_hubspot['Match_Status'].map({
        'match_alto': 'denue_match',
        'match_bajo': 'denue_match_bajo',
        'sin_match':  None,
    })

    print(f"\n✅ Match DENUE v2 completado — {total:,} leads procesados")
    counts = df_hubspot['Match_Status'].value_counts()
    print(counts.to_string())
    print(f"\nCobertura DENUE: {((counts.get('match_alto',0)+counts.get('match_bajo',0))/total*100):.1f}%")

    return df_hubspot


if __name__ == '__main__':
    import pandas as pd
    from pathlib import Path

    PARQUET = Path('data/df_maestro.parquet')
    df = pd.read_parquet(PARQUET)

    # Solo registros sin Match_Status (nunca pasaron por DENUE)
    sin_match = df['Match_Status'].isna() | (df['Match_Status'] == 'None')
    print(f'Registros sin DENUE match: {sin_match.sum():,}')

    if sin_match.sum() == 0:
        print('Nada que procesar.')
    else:
        nuevos = df[sin_match][['ID de registro', 'Nombre de la empresa']].copy()
        resultados = run_match(nuevos)

        # Fusionar resultados al maestro
        cols = ['ID de registro', 'Match_Status', 'SCIAN_2', 'SCIAN_3',
                'Match_Score', 'SCIAN_nombre', 'fuente_scian']
        res = resultados[cols].set_index('ID de registro')
        for col in cols[1:]:
            if col in res.columns:
                df.loc[sin_match, col] = df.loc[sin_match, 'ID de registro'].map(res[col])

        df.to_parquet(PARQUET, index=False)
        print(f'Maestro actualizado: {PARQUET}')
