import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import pandas as pd
from extractors.sheets_reader import read_sheet
from config import SHEET_GA4_ID, TAB_GA4_TOTALES, TAB_GA4_PAGINAS

def clean_num(v):
    try: return float(str(v).replace(',','').replace('%','').strip() or 0)
    except: return 0

def extract() -> dict:
    print("[GA4] Leyendo totales...")
    df = read_sheet(SHEET_GA4_ID, TAB_GA4_TOTALES)
    print(f"[GA4] {len(df)} filas, columnas: {list(df.columns)}")

    sesiones  = df['Sesiones'].apply(clean_num).sum()        if 'Sesiones'         in df.columns else 0
    usuarios  = df['Usuarios'].apply(clean_num).sum()        if 'Usuarios'         in df.columns else 0
    rebote    = df['Tasa_Rebote'].apply(clean_num).mean()    if 'Tasa_Rebote'      in df.columns else 0
    duracion  = df['Duracion_Promedio'].apply(clean_num).mean() if 'Duracion_Promedio' in df.columns else 0

    # Top páginas
    paginas = []
    try:
        df_pag = read_sheet(SHEET_GA4_ID, TAB_GA4_PAGINAS)
        pag_col = next((c for c in df_pag.columns if 'pagina' in c.lower() or 'page' in c.lower()), None)
        if pag_col and 'Sesiones' in df_pag.columns:
            g = df_pag.groupby(pag_col)['Sesiones'].apply(lambda x: x.apply(clean_num).sum())
            paginas = [{'pagina': k, 'sesiones': int(v)} for k,v in g.nlargest(10).items()]
    except Exception as e:
        print(f"[GA4] Warning páginas: {e}")

    return {
        "kpis": {
            "sesiones": int(sesiones),
            "usuarios": int(usuarios),
            "tasa_rebote":      round(rebote, 1),
            "duracion_promedio": round(duracion, 0),
        },
        "top_paginas": paginas,
        "raw_columns": list(df.columns),
    }
