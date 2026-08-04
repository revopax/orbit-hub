#!/usr/bin/env python3
"""
gads_keyword_volumes.py
Volumen de mercado (México) por keyword vía
KeywordPlanIdeaService.generate_keyword_historical_metrics.
Puebla keyword_market_volumes en Supabase (wuwhcljeigskajjoyghv).
Fuente de keywords: seo_keyword_research (udn, categoria, keyword).
"""
import sys, os, time, json
from collections import defaultdict
import requests
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

# ---------- Config ----------
YAML_PATH   = "pipeline_redes/google-ads.yaml"
ENV_PATH    = "pipeline_redes/.env"     # SUPABASE_URL / SUPABASE_SERVICE_KEY
CUSTOMER_ID = "3533941860"
LANGUAGE_ID = "1003"                    # Español
GEO_TARGET  = "2484"                    # México
BATCH_SIZE  = 1000                      # historical_metrics admite hasta 10K
SLEEP_BETWEEN = 1.0

MONTH_MAP = {
    "JANUARY":1,"FEBRUARY":2,"MARCH":3,"APRIL":4,"MAY":5,"JUNE":6,
    "JULY":7,"AUGUST":8,"SEPTEMBER":9,"OCTOBER":10,"NOVEMBER":11,"DECEMBER":12
}

# ---------- Utilidades ----------
def load_env(path):
    env = {}
    if not os.path.exists(path):
        return env
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env

def fetch_keywords(sb_url, sb_key):
    url = f"{sb_url}/rest/v1/seo_keyword_research"
    base_headers = {"apikey": sb_key, "Authorization": f"Bearer {sb_key}"}
    params = {"select": "udn,categoria,keyword"}
    rows, offset, page = [], 0, 1000
    while True:
        h = dict(base_headers)
        h["Range-Unit"] = "items"
        h["Range"] = f"{offset}-{offset+page-1}"
        r = requests.get(url, headers=h, params=params)
        r.raise_for_status()
        batch = r.json()
        rows.extend(batch)
        if len(batch) < page:
            break
        offset += page
    return rows

def get_historical_metrics(client, keywords):
    svc = client.get_service("KeywordPlanIdeaService")
    req = client.get_type("GenerateKeywordHistoricalMetricsRequest")
    req.customer_id = CUSTOMER_ID
    req.language = f"languageConstants/{LANGUAGE_ID}"
    req.geo_target_constants.append(f"geoTargetConstants/{GEO_TARGET}")
    req.keyword_plan_network = client.enums.KeywordPlanNetworkEnum.GOOGLE_SEARCH
    req.keywords.extend(keywords)
    return svc.generate_keyword_historical_metrics(request=req)

def build_rows(udn, categoria, kw_text, metrics):
    rows = []
    try:
        comp = metrics.competition.name
    except Exception:
        comp = str(metrics.competition)
    comp_idx = metrics.competition_index
    avg = metrics.avg_monthly_searches
    for mv in metrics.monthly_search_volumes:
        mnum = MONTH_MAP.get(mv.month.name)
        if not mnum:
            continue
        rows.append({
            "udn": udn,
            "categoria": categoria,
            "keyword": kw_text,
            "avg_monthly_searches": avg,
            "competition": comp,
            "competition_index": comp_idx,
            "mes": f"{mv.year}-{mnum:02d}",
            "busquedas_mes": mv.monthly_searches,
        })
    return rows

def upsert_rows(sb_url, sb_key, rows):
    url = f"{sb_url}/rest/v1/keyword_market_volumes?on_conflict=udn,keyword,mes"
    headers = {
        "apikey": sb_key,
        "Authorization": f"Bearer {sb_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    CHUNK = 500
    for i in range(0, len(rows), CHUNK):
        chunk = rows[i:i+CHUNK]
        r = requests.post(url, headers=headers, data=json.dumps(chunk))
        if r.status_code not in (200, 201, 204):
            print("  ! error upsert:", r.status_code, r.text[:300])
            r.raise_for_status()

# ---------- Main ----------
def main():
    env = load_env(ENV_PATH)
    sb_url = env.get("SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    sb_key = (env.get("SUPABASE_SERVICE_KEY")
              or env.get("SUPABASE_SERVICE_ROLE_KEY")
              or os.environ.get("SUPABASE_SERVICE_KEY"))
    if not sb_url or not sb_key:
        sys.exit("Faltan SUPABASE_URL / SUPABASE_SERVICE_KEY en pipeline_redes/.env")

    client = GoogleAdsClient.load_from_storage(YAML_PATH)

    print("Leyendo keywords de seo_keyword_research...")
    kws = fetch_keywords(sb_url, sb_key)
    print(f"  {len(kws)} filas leídas")

    by_udn = defaultdict(list)
    for row in kws:
        kw = (row.get("keyword") or "").strip()
        if not kw:
            continue
        by_udn[row["udn"]].append((row.get("categoria"), kw))

    total_written = 0
    for udn, pairs in by_udn.items():
        lookup = defaultdict(list)
        for categoria, kw in pairs:
            lookup[kw.lower()].append((categoria, kw))
        unique_kws = list(lookup.keys())
        print(f"\n[{udn}] {len(pairs)} pares, {len(unique_kws)} keywords únicas")

        udn_rows = []
        for i in range(0, len(unique_kws), BATCH_SIZE):
            batch = unique_kws[i:i+BATCH_SIZE]
            try:
                resp = get_historical_metrics(client, batch)
            except GoogleAdsException as ex:
                print(f"  ! GoogleAdsException batch {i}:")
                for e in ex.failure.errors:
                    print("     ", e.message)
                continue
            for result in resp.results:
                metrics = result.keyword_metrics
                # Una sola categoria/keyword por resultado: el volumen de mercado
                # no depende de la categoria, y (udn,keyword,mes) es UNIQUE.
                categoria, kw_orig = lookup.get(result.text.lower(), [(None, result.text)])[0]
                udn_rows.extend(build_rows(udn, categoria, kw_orig, metrics))
            time.sleep(SLEEP_BETWEEN)

        if udn_rows:
            _seen = set()
            _dedup = []
            for _r in udn_rows:
                _k = (_r["udn"], _r["keyword"], _r["mes"])
                if _k in _seen:
                    continue
                _seen.add(_k)
                _dedup.append(_r)
            udn_rows = _dedup
            print(f"  → upsert {len(udn_rows)} filas...")
            upsert_rows(sb_url, sb_key, udn_rows)
            total_written += len(udn_rows)

    print(f"\n✅ Listo. {total_written} filas escritas en keyword_market_volumes.")

if __name__ == "__main__":
    main()
