import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import pandas as pd
from extractors.sheets_reader import read_sheet
from config import SHEET_PAID_ID

def clean_num(v):
    try: return float(str(v).replace(',','').replace('$','').strip() or 0)
    except: return 0

def extract() -> dict:
    print("[META] Leyendo MASTER_PAID_PERFORMANCE_OK...")
    df = read_sheet(SHEET_PAID_ID, "MASTER_PAID_PERFORMANCE_OK")
    print(f"[META] {len(df)} filas totales")
    print(f"[META] Plataformas: {df['Plataforma'].unique().tolist()}")

    df_meta = df[df["Plataforma"].str.upper().str.contains("META|FACEBOOK|INSTAGRAM", na=False)]
    print(f"[META] {len(df_meta)} filas META")

    gasto       = df_meta["Gasto"].apply(clean_num).sum()        if "Gasto"        in df_meta.columns else 0
    impresiones = df_meta["Impresiones"].apply(clean_num).sum()  if "Impresiones"  in df_meta.columns else 0
    clics       = df_meta["Clics"].apply(clean_num).sum()        if "Clics"        in df_meta.columns else 0
    resultados  = df_meta["Resultados_Totales"].apply(clean_num).sum() if "Resultados_Totales" in df_meta.columns else 0
    ctr = (clics / impresiones * 100) if impresiones > 0 else 0
    cpc = (gasto / clics) if clics > 0 else 0

    udn_col = next((c for c in df_meta.columns if "UDN" in c.upper()), None)
    gasto_por_udn = []
    if udn_col and "Gasto" in df_meta.columns:
        g = df_meta.groupby(udn_col)["Gasto"].apply(lambda x: x.apply(clean_num).sum()).reset_index()
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
