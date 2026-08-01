#!/usr/bin/env python3
"""
Google Ads Search Terms → Supabase (gads_search_terms)
Uso:
  python3 pipeline_redes/gads_search_terms.py            # últimos 90 días
  python3 pipeline_redes/gads_search_terms.py 2024-01-01 # desde fecha
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta
from google.ads.googleads.client import GoogleAdsClient
from supabase import create_client

# ── Config ────────────────────────────────────────────────────────────────────
YAML_PATH   = os.path.join(os.path.dirname(__file__), 'google-ads.yaml')
SUPA_URL    = os.getenv('NEXT_PUBLIC_SUPABASE_URL_ANALYTICS', '')
SUPA_KEY    = os.getenv('SUPABASE_SERVICE_ROLE_KEY_ANALYTICS', '')

CUSTOMER_IDS = {
    "House Of Films":   "3855421374",
    "Marketing United": "7808833947",
    "Mexa Creativa":    "4569516217",
    "Neracode":         "2873229368",
    "ResearchLand":     "3600313256",
    "UPAX":             "4133258749",
    "UiX":              "3533941860",
    "Zeus":             "2929880650",
}

TIPO_MAP = {
    'SEARCH': 'Búsqueda', 'VIDEO': 'Video', 'DEMAND_GEN': 'Demand Gen',
}

def log(msg, level='INFO'):
    icons = {'INFO': '→', 'OK': '✅', 'WARN': '⚠️', 'ERROR': '🔥', 'START': '🚀', 'DONE': '🎯'}
    icon = icons.get(level, '→')
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {icon} {msg}", flush=True)

def get_env():
    """Lee .env.local si no hay vars de entorno."""
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    env = {}
    if os.path.exists(env_path):
        for line in open(env_path):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env

def extract_search_terms(client, udn, cid, start_date, end_date):
    service = client.get_service("GoogleAdsService")
    query = f"""
        SELECT
            segments.date,
            campaign.name,
            campaign.advertising_channel_type,
            ad_group.name,
            search_term_view.search_term,
            search_term_view.status,
            segments.keyword.info.match_type,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions
        FROM search_term_view
        WHERE segments.date BETWEEN '{start_date}' AND '{end_date}'
          AND metrics.impressions > 0
    """
    rows = []
    try:
        for r in service.search(customer_id=cid, query=query):
            fecha = str(r.segments.date)
            mes   = fecha[:7]
            tipo  = TIPO_MAP.get(
                str(r.campaign.advertising_channel_type.name).upper(),
                str(r.campaign.advertising_channel_type.name)
            )
            match = str(r.segments.keyword.info.match_type.name)
            rows.append({
                "fecha":          fecha,
                "mes":            mes,
                "udn":            udn,
                "campana":        r.campaign.name,
                "tipo_campana":   tipo,
                "grupo_anuncios": r.ad_group.name,
                "search_term":    r.search_term_view.search_term,
                "match_type":     match,
                "status":         str(r.search_term_view.status.name),
                "impresiones":    int(r.metrics.impressions),
                "clics":          int(r.metrics.clicks),
                "costo":          round(r.metrics.cost_micros / 1e6, 4),
                "conversiones":   round(r.metrics.conversions, 4),
            })
    except Exception as e:
        log(f"  ✗ {udn}: {e}")
    return rows

def upsert_supabase(supa, rows):
    if not rows:
        return 0
    # Deduplicar por clave única antes del upsert
    seen = {}
    for r in rows:
        key = (r['fecha'], r['udn'], r['campana'], r['grupo_anuncios'], r['search_term'])
        if key not in seen:
            seen[key] = r
        else:
            # Acumular métricas si hay duplicado
            seen[key]['impresiones'] += r['impresiones']
            seen[key]['clics']       += r['clics']
            seen[key]['costo']       += r['costo']
            seen[key]['conversiones']+= r['conversiones']
    deduped = list(seen.values())
    # Batch de 500
    total = 0
    for i in range(0, len(deduped), 500):
        batch = deduped[i:i+500]
        supa.table('gads_search_terms').upsert(
            batch,
            on_conflict='fecha,udn,campana,grupo_anuncios,search_term'
        ).execute()
        total += len(batch)
    return total

def main():
    env = get_env()
    url = SUPA_URL or env.get('NEXT_PUBLIC_SUPABASE_URL_MBR', '')
    key = SUPA_KEY or env.get('SUPABASE_SERVICE_ROLE_KEY_MBR', '')
    if not url or not key:
        log("ERROR: faltan SUPABASE_URL/KEY en .env.local"); sys.exit(1)

    start_date = sys.argv[1] if len(sys.argv) > 1 else \
                 (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
    end_date   = datetime.now().strftime('%Y-%m-%d')
    log(f"Rango: {start_date} → {end_date}")

    client = GoogleAdsClient.load_from_storage(YAML_PATH)
    supa   = create_client(url, key)

    total_insertados = 0
    for udn, cid_fmt in CUSTOMER_IDS.items():
        log(f"→ {udn} ({cid_fmt})...")
        rows = extract_search_terms(client, udn, cid_fmt, start_date, end_date)
        log(f"  {len(rows)} términos encontrados")
        n = upsert_supabase(supa, rows)
        log(f"  ✓ {n} filas upserted")
        total_insertados += n

    log(f"\n✅ Total insertado: {total_insertados} filas")

if __name__ == '__main__':
    main()
