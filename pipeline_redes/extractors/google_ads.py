import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import pandas as pd
from extractors.sheets_reader import read_sheet
from config import SHEET_PAID_ID, TAB_GOOGLE_GRAL, TAB_GOOGLE_GEO, TAB_GOOGLE_KEYWORDS

def clean_num(v):
    try: return float(str(v).replace(',','').replace('$','').strip() or 0)
    except: return 0

def extract() -> dict:
    print("[Google Ads] Leyendo Gral...")
    df = read_sheet(SHEET_PAID_ID, TAB_GOOGLE_GRAL)
    print(f"[Google Ads] {len(df)} filas, columnas: {list(df.columns)}")

    gasto       = df['Gasto'].apply(clean_num).sum()       if 'Gasto'       in df.columns else 0
    impresiones = df['Impresiones'].apply(clean_num).sum() if 'Impresiones'  in df.columns else 0
    clics       = df['Clics'].apply(clean_num).sum()       if 'Clics'        in df.columns else 0
    conversiones= df['Conversiones'].apply(clean_num).sum()if 'Conversiones' in df.columns else 0
    ctr = (clics / impresiones * 100) if impresiones > 0 else 0
    cpc = (gasto / clics) if clics > 0 else 0

    # Por UDN
    udn_col = next((c for c in df.columns if 'UDN' in c.upper()), None)
    gasto_por_udn = []
    if udn_col and 'Gasto' in df.columns:
        g = df.groupby(udn_col)['Gasto'].apply(lambda x: x.apply(clean_num).sum()).reset_index()
        gasto_por_udn = [{'udn': r[udn_col], 'gasto': round(r['Gasto'], 2)} for _, r in g.iterrows()]

    # Geo
    geo = []
    try:
        df_geo = read_sheet(SHEET_PAID_ID, TAB_GOOGLE_GEO)
        if 'Estado_Republica' in df_geo.columns and 'Gasto' in df_geo.columns:
            g = df_geo.groupby('Estado_Republica')['Gasto'].apply(lambda x: x.apply(clean_num).sum())
            geo = [{'estado': k, 'gasto': round(v,2)} for k,v in g.nlargest(10).items()]
    except Exception as e:
        print(f"[Google Ads] Warning geo: {e}")

    return {
        "kpis": {
            "gasto":        round(gasto, 2),
            "impresiones":  int(impresiones),
            "clics":        int(clics),
            "conversiones": round(conversiones, 2),
            "ctr":          round(ctr, 2),
            "cpc":          round(cpc, 2),
        },
        "gasto_por_udn": gasto_por_udn,
        "geo_top10":     geo,
        "raw_columns":   list(df.columns),
    }
