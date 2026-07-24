import re, urllib.request, json
import pandas as pd
from pathlib import Path
from rapidfuzz import process, fuzz

SUPABASE_URL = "https://maszpgfnbonwftxobryi.supabase.co/rest/v1"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hc3pwZ2ZuYm9ud2Z0eG9icnlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQyMDI3NCwiZXhwIjoyMDkyOTk2Mjc0fQ.Pw_Ba5Btnf7VMGhhnAjpSSLCDN3w_cJTQRp-pQw9w7s"
BASE_DIR  = Path(__file__).parent
PARQUET   = BASE_DIR / "data" / "df_maestro.parquet"
DENUE_PAR = BASE_DIR / "data" / "denue_nacional.parquet"
SCORE_MIN = 80
GENERIC   = {"gmail.com","hotmail.com","yahoo.com","outlook.com","icloud.com","live.com","me.com","hotmail.es","yahoo.com.mx","live.com.mx"}

def sb_all(tabla, campos, page=1000):
    hdrs = {"apikey":SUPABASE_KEY,"Authorization":f"Bearer {SUPABASE_KEY}"}
    rows, off = [], 0
    while True:
        url = f"{SUPABASE_URL}/{tabla}?select={','.join(campos)}&limit={page}&offset={off}"
        req = urllib.request.Request(url, headers=hdrs)
        with urllib.request.urlopen(req) as r: batch = json.loads(r.read())
        if not batch: break
        rows.extend(batch); print(f"  Supabase: {len(rows):,}…", end="\r")
        if len(batch) < page: break
        off += page
    print(); return rows

def raiz(dominio):
    if not dominio or pd.isna(dominio): return ""
    d = re.sub(r"^(www\.|m\.|mx\.|us\.|co\.|mail\.)","", dominio.lower().strip())
    return d.split(".")[0].replace("-"," ").strip()

def catalogo_denue(path):
    print("  Cargando DENUE…")
    dn = pd.read_parquet(path, columns=["nom_estab","codigo_act","raz_social"])
    def norm(s):
        if pd.isna(s): return ""
        s = re.sub(r"[^\w\s]"," ", str(s).upper().strip())
        for x in ["SA DE CV","S DE RL","SAPI DE CV","SC","AC","IAP","SA","SRL"]:
            s = re.sub(rf"\b{x}\b","",s)
        return re.sub(r"\s+"," ",s).strip()
    dn["nn"] = dn["raz_social"].fillna(dn["nom_estab"]).apply(norm)
    dn["s2"] = dn["codigo_act"].astype(str).str[:2]
    dn["s3"] = dn["codigo_act"].astype(str).str[:3]
    m2 = dn.groupby("nn",sort=False)["s2"].agg(lambda x: x.mode().iloc[0]).reset_index()
    m3 = dn.groupby("nn",sort=False)["s3"].agg(lambda x: x.mode().iloc[0]).reset_index()
    cat = m2.merge(m3,on="nn")
    cat = cat[cat["nn"].str.len()>2]
    print(f"  Catálogo: {len(cat):,} empresas")
    return cat

def main():
    print("="*55); print("  match_domain.py — Capa 0"); print("="*55)
    df = pd.read_parquet(PARQUET)
    sin = df["fuente_scian"].isin(["nan","None"]) | df["fuente_scian"].isna()
    print(f"\nSin sector: {sin.sum():,} / {len(df):,}")

    print("\nDescargando Supabase…")
    sb = pd.DataFrame(sb_all("concentrado_v3",["id_registro","hs_email_domain","website"]))
    sb["id_registro"] = sb["id_registro"].astype(str)

    df["_id"] = df["ID de registro"].astype(str)
    dfj = df[sin].merge(sb.rename(columns={"hs_email_domain":"dom","website":"web"}),
                        left_on="_id", right_on="id_registro", how="left")
    cand = dfj[dfj["dom"].notna() & ~dfj["dom"].isin(GENERIC)].copy()
    cand["busq"] = cand["dom"].apply(raiz)
    cand = cand[cand["busq"].str.len()>2]
    print(f"Candidatos con dominio: {len(cand):,}")

    cat = catalogo_denue(DENUE_PAR)
    nombres = cat["nn"].tolist()

    print(f"\nFuzzy match de {len(cand):,} dominios…")
    res = []
    for i,(idx,row) in enumerate(cand.iterrows()):
        if i%1000==0: print(f"  {i}/{len(cand)}…",end="\r")
        m = process.extractOne(row["busq"],nombres,scorer=fuzz.token_set_ratio,score_cutoff=SCORE_MIN)
        if m:
            nm,sc,pos = m
            res.append({"ID de registro":row["ID de registro"],"s2":cat.iloc[pos]["s2"],"s3":cat.iloc[pos]["s3"],"sc":sc})
    print(f"\nMatches: {len(res):,}")

    if not res: print("Sin matches. Baja SCORE_MIN."); return
    dr = pd.DataFrame(res)
    dr["ID de registro"] = dr["ID de registro"].astype(str)
    df["_id"] = df["_id"].astype(str)
    df = df.merge(dr.rename(columns={"ID de registro":"_id"}),on="_id",how="left")

    from scian_map_3d import SCIAN_2_NOMBRE
    mask = sin & df["s2"].notna()
    print(f"Actualizando {mask.sum():,} leads…")
    df.loc[mask,"SCIAN_2"]      = df.loc[mask,"s2"]
    df.loc[mask,"SCIAN_3"]      = df.loc[mask,"s3"]
    df.loc[mask,"fuente_scian"] = "domain_match"
    df.loc[mask,"SCIAN_nombre"] = df.loc[mask,"s2"].map(SCIAN_2_NOMBRE)
    df.loc[mask,"Match_Score"]  = df.loc[mask,"sc"]
    df.drop(columns=["_id","s2","s3","sc"],inplace=True)
    df.to_parquet(PARQUET,index=False)

    print("\n=== Cobertura final ===")
    print(df["fuente_scian"].value_counts(dropna=False))
    cl = df["fuente_scian"].isin(["denue_match","mapeo_hubspot","domain_match"]).sum()
    print(f"\nClasificados: {cl:,}/{len(df):,} ({100*cl//len(df)}%)")
    print("→ Corre: python3 pipeline/generate_data.py")

if __name__=="__main__": main()
