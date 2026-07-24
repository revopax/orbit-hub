"""
match_capa0.py — Pipeline Capa 0 completo (cascada)

Flujo por registro:
  1. Ya tiene fuente_scian clasificada → skip
  2. Tiene Nombre de la empresa → fuzzy match vs DENUE nombre_match
  3. Sin nombre o no matcheó → usa hs_email_domain / website de Supabase
     → extrae raíz de dominio → fuzzy match vs DENUE nombre_match

Corre: python3 pipeline/match_capa0.py

Requiere: pip install rapidfuzz supabase pandas pyarrow
"""
import re, json, pandas as pd
from pathlib import Path
from rapidfuzz import process, fuzz

# ── CONFIG ──────────────────────────────────────────────────────
PARQUET   = Path(__file__).parent / "data" / "df_maestro.parquet"
DENUE_PAR = Path(__file__).parent / "data" / "denue_nacional.parquet"
CACHE_SB  = Path(__file__).parent / "data" / "supabase_dominios.parquet"

SUPABASE_URL = "https://szxdvdbdyuxtvyvxbder.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6eGR2ZGJkeXV4dHZ5dnhiZGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzI0MDA4NSwiZXhwIjoyMDkyODE2MDg1fQ.Sfrf6jdpQgoxQBpwqQNVPHX6uwl_kFMlBTgljPbgvzs"   # ← único campo a rellenar

SCORE_MIN_NOMBRE  = 72   # umbral para match por nombre de empresa
SCORE_MIN_DOMINIO = 78   # umbral más alto para match por dominio (menos fiable)

FUENTES_OK = {"denue_match", "mapeo_hubspot", "domain_match", "nombre_match"}
# ────────────────────────────────────────────────────────────────

def normalizar(s: str) -> str:
    s = str(s or "").upper().strip()
    s = re.sub(r"[^\w\s]", " ", s)
    for sfx in [
        "SA DE CV","S DE RL DE CV","S DE RL","SAPI DE CV","SAPI",
        "SAB DE CV","SAB","SC","AC","IAP","SA","SRL",
        "DE MEXICO","MEXICO","S A DE C V","S.A. DE C.V.",
    ]:
        s = re.sub(rf"\b{re.escape(sfx)}\b", "", s)
    return re.sub(r"\s+", " ", s).strip()

def root_dominio(u: str) -> str:
    u = str(u or "").lower().strip()
    u = re.sub(r"https?://|www\.", "", u)
    u = u.split("/")[0].split("@")[-1]
    parts = u.split(".")
    if len(parts) >= 3:
        root = parts[-3]
    elif len(parts) == 2:
        root = parts[0]
    else:
        root = parts[0] if parts else ""
    root = re.sub(r"[^a-z0-9]", "", root)
    return root if len(root) > 2 and root not in {
        "gmail","hotmail","yahoo","outlook","live","protonmail",
        "icloud","me","msn","ymail","aol","zoho","googlemail",
        "correo","mail","info","admin","contact","contacto"
    } else ""

def descargar_supabase():
    if CACHE_SB.exists():
        print(f"✅ Cache Supabase encontrado ({CACHE_SB})")
        return pd.read_parquet(CACHE_SB)

    print("⬇️  Descargando dominios desde Supabase…")
    try:
        from supabase import create_client
    except ImportError:
        raise SystemExit("pip install supabase")

    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    rows, page, PAGE = [], 0, 1000
    while True:
        r = (sb.table("concentrado_v3")
               .select("id_hubspot,hs_email_domain,website")
               .range(page*PAGE, (page+1)*PAGE - 1)
               .execute())
        if not r.data:
            break
        rows.extend(r.data)
        page += 1
        if page % 10 == 0:
            print(f"  Descargados: {len(rows):,}", end="\r")

    df_sb = pd.DataFrame(rows)
    # normalizar nombre de columna ID
    for col in ["id_hubspot","ID de registro","id_registro"]:
        if col in df_sb.columns:
            df_sb = df_sb.rename(columns={col: "ID de registro"})
            break

    df_sb["ID de registro"] = df_sb["ID de registro"].astype(str)
    df_sb.to_parquet(CACHE_SB, index=False)
    print(f"✅ {len(df_sb):,} registros descargados y cacheados en {CACHE_SB}")
    return df_sb

def build_catalog():
    cat = pd.read_parquet(DENUE_PAR)
    col = "nombre_match" if "nombre_match" in cat.columns else "raz_social"
    cat["nn"] = cat[col].apply(normalizar)
    cat = cat[cat["nn"].str.len() > 3].reset_index(drop=True)
    cat["s2"] = cat["codigo_act"].astype(str).str[:2]
    cat["s3"] = cat["codigo_act"].astype(str).str[:3]
    return cat

def match_batch(queries: pd.Series, nombres: list, score_min: int) -> dict:
    """Devuelve {busq: (pos, score)} para los que superan score_min."""
    result = {}
    uniq = queries.dropna().unique()
    for i, q in enumerate(uniq):
        if i % 500 == 0:
            print(f"  {i:,}/{len(uniq):,}…", end="\r")
        m = process.extractOne(
            q, nombres,
            scorer=fuzz.token_set_ratio,
            score_cutoff=score_min
        )
        if m:
            _, sc, pos = m
            result[q] = (pos, float(sc))
    print()
    return result

def main():
    print("="*58)
    print("  match_capa0.py — Capa 0 cascada (nombre + dominio)")
    print("="*58)

    df = pd.read_parquet(PARQUET)
    df["_id"] = df["ID de registro"].astype(str)

    sin = ~df["fuente_scian"].isin(FUENTES_OK)
    print(f"Sin sector: {sin.sum():,} / {len(df):,}")

    cat = build_catalog()
    nombres = cat["nn"].tolist()
    print(f"Catálogo DENUE: {len(nombres):,} nombres\n")

    # ── PASO 1: match por nombre de empresa ─────────────────────
    # Usar nombre_busqueda (generado por enriquecer_nombres.py)
    # que ya incluye limpieza, validación y enriquecimiento por dominio
    col_busq = "nombre_busqueda" if "nombre_busqueda" in df.columns else "Nombre de la empresa"
    if col_busq == "nombre_busqueda":
        print("  ✅ Usando nombre_busqueda (enriquecido)")
    else:
        print("  ⚠️  nombre_busqueda no encontrado — usando Nombre de la empresa")
    cand_nombre = df[sin & df[col_busq].notna()].copy()
    cand_nombre["busq"] = cand_nombre[col_busq].apply(
        lambda x: x if col_busq == "nombre_busqueda" else normalizar(x)
    )
    cand_nombre = cand_nombre[cand_nombre["busq"].str.len() > 3]
    uniq_n = cand_nombre["busq"].nunique()
    print(f"▶ Paso 1 — Match por nombre: {len(cand_nombre):,} candidatos ({uniq_n:,} únicos)")
    hits_n = match_batch(cand_nombre["busq"], nombres, SCORE_MIN_NOMBRE)
    print(f"  Matches: {len(hits_n):,} de {uniq_n:,} únicos\n")

    # ── PASO 2: obsoleto ─────────────────────────────────────────
    # enriquecer_nombres.py ya consolidó nombre + dominio + website
    # en el campo "nombre_busqueda" — no se necesita Paso 2 separado
    hits_d = {}
    cand_dom = pd.DataFrame()
    print("▶ Paso 2 — omitido (nombre_busqueda ya incluye enriquecimiento por dominio)")
    # ── APLICAR RESULTADOS AL PARQUET ────────────────────────────
    total_aplicados = 0

    def aplicar(cand_df, hits, fuente):
        nonlocal total_aplicados
        if cand_df.empty or not hits:
            return
        for idx, row in cand_df.iterrows():
            if row["busq"] not in hits:
                continue
            pos, sc = hits[row["busq"]]
            codigo = str(cat.iloc[pos]["codigo_act"])
            df.at[idx, "SCIAN_2"]      = codigo[:2]
            df.at[idx, "fuente_scian"] = fuente
            df.at[idx, "Match_Score"]  = sc
            df.at[idx, "Match_INEGI"]  = cat.iloc[pos]["nn"]
            total_aplicados += 1

    aplicar(cand_nombre, hits_n, "nombre_match")
    if not cand_dom.empty:
        aplicar(cand_dom, hits_d, "domain_match")

    print(f"Total actualizados en parquet: {total_aplicados:,}")

    # limpiar columnas temporales
    df.drop(columns=["_id","_sb_dom","_sb_web"], errors="ignore", inplace=True)
    if 'Match_Score' in df.columns:
        df['Match_Score'] = pd.to_numeric(df['Match_Score'], errors='coerce')
    df.to_parquet(PARQUET, index=False)

    print("\n=== Cobertura final ===")
    print(df["fuente_scian"].value_counts(dropna=False))
    cl = df["fuente_scian"].isin(FUENTES_OK | {"nombre_match","domain_match"}).sum()
    print(f"\nClasificados: {cl:,}/{len(df):,} ({100*cl//len(df)}%)")

    print("\n→ Siguiente: python3 pipeline/generate_data.py")

if __name__ == "__main__":
    main()
