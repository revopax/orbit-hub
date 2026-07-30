import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import pandas as pd
from extractors.sheets_reader import read_sheet
from config import SHEET_PAID_ID

def clean_num(v):
    try: return float(str(v).replace(',','').replace('$','').strip() or 0)
    except: return 0

def extract() -> dict:
    print("[LinkedIn] Leyendo LinkedIn_Paid_OK...")
    df = read_sheet(SHEET_PAID_ID, "LinkedIn_Paid_OK")
    print(f"[LinkedIn] {len(df)} filas, columnas: {list(df.columns)}")

    gasto       = df["Gasto"].apply(clean_num).sum()        if "Gasto"        in df.columns else 0
    impresiones = df["Impresiones"].apply(clean_num).sum()  if "Impresiones"  in df.columns else 0
    clics       = df["Clics"].apply(clean_num).sum()        if "Clics"        in df.columns else 0
    resultados  = df["Resultados_Totales"].apply(clean_num).sum() if "Resultados_Totales" in df.columns else 0
    ctr = (clics / impresiones * 100) if impresiones > 0 else 0
    cpc = (gasto / clics) if clics > 0 else 0

    udn_col = next((c for c in df.columns if "UDN" in c.upper()), None)
    gasto_por_udn = []
    if udn_col and "Gasto" in df.columns:
        g = df.groupby(udn_col)["Gasto"].apply(lambda x: x.apply(clean_num).sum()).reset_index()
        gasto_por_udn = [{"udn": r[udn_col], "gasto": round(r["Gasto"], 2)} for _, r in g.iterrows()]

    return {
        "kpis": {
            "gasto":        round(gasto, 2),
            "impresiones":  int(impresiones),
            "clics":        int(clics),
            "resultados":   round(resultados, 2),
            "ctr":          round(ctr, 2),
            "cpc":          round(cpc, 2),
        },
        "gasto_por_udn": gasto_por_udn,
        "raw_columns":   list(df.columns),
    }
