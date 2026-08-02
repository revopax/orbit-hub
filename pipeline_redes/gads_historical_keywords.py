#!/usr/bin/env python3
"""
Google Ads Search Terms → Supabase (gads_search_terms) — agregado MENSUAL
Uso:
  python3 pipeline_redes/gads_historical_keywords.py            # últimos 90 días
  python3 pipeline_redes/gads_historical_keywords.py 2024-01-01 # desde fecha
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta
from collections import defaultdict
from google.ads.googleads.client import GoogleAdsClient
from supabase import create_client

YAML_PATH = os.path.join(os.path.dirname(__file__), 'google-ads.yaml')
SUPA_URL  = os.getenv('NEXT_PUBLIC_SUPABASE_URL_MBR', '')
SUPA_KEY  = os.getenv('SUPABASE_SERVICE_ROLE_KEY_MBR', '')

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
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {icons.get(level,'→')} {msg}", flush=True)

def get_env():
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    env = {}
    if os.path.exists(env_path):
        for line in open(env_path):
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env

def extract_and_aggregate(client, udn, cid, start_date, end_date):
    """Extrae search terms y agrega por mes+campana+término."""
    service = client.get_service("GoogleAdsService")
    query = f"""
        SELECT
            segments.date,
            campaign.name,
            campaign.advertising_channel_type,
            search_term_view.search_term,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions
        FROM search_term_view
        WHERE segments.date BETWEEN '{start_date}' AND '{end_date}'
          AND metrics.impressions > 0
    """
    # Agrega en memoria por mes+campana+término
    agg = defaultdict(lambda: {'impresiones': 0, 'clics': 0, 'costo': 0.0, 'conversiones': 0.0, 'tipo_campana': ''})
    raw_count = 0
    try:
        for r in service.search(customer_id=cid, query=query):
            mes   = str(r.segments.date)[:7]  # 'YYYY-MM'
            camp  = r.campaign.name
            term  = r.search_term_view.search_term
            tipo  = TIPO_MAP.get(str(r.campaign.advertising_channel_type.name).upper(), '')
            key   = (mes, camp, term)
            agg[key]['impresiones']  += int(r.metrics.impressions)
            agg[key]['clics']        += int(r.metrics.clicks)
            agg[key]['costo']        += r.metrics.cost_micros / 1e6
            agg[key]['conversiones'] += r.metrics.conversions
            agg[key]['tipo_campana']  = tipo
            raw_count += 1
    except Exception as e:
        log(f"{udn}: {e}", 'ERROR')
        return [], 0

    rows = []
    for (mes, camp, term), v in agg.items():
        rows.append({
            "mes":          mes,
            "udn":          udn,
            "campana":      camp,
            "tipo_campana": v['tipo_campana'],
            "search_term":  term,
            "impresiones":  v['impresiones'],
            "clics":        v['clics'],
            "costo":        round(v['costo'], 4),
            "conversiones": round(v['conversiones'], 4),
        })
    return rows, raw_count

def upsert_supabase(supa, rows):
    if not rows:
        return 0
    total = 0
    for i in range(0, len(rows), 500):
        batch = rows[i:i+500]
        supa.table('gads_search_terms').upsert(
            batch,
            on_conflict='mes,udn,campana,search_term'
        ).execute()
        total += len(batch)
    return total

def main():
    env = get_env()
    url = SUPA_URL or env.get('NEXT_PUBLIC_SUPABASE_URL_MBR', '')
    key = SUPA_KEY or env.get('SUPABASE_SERVICE_ROLE_KEY_MBR', '')
    if not url or not key:
        log("Faltan SUPABASE_URL/KEY en .env.local", 'ERROR'); sys.exit(1)

    start_date = sys.argv[1] if len(sys.argv) > 1 else \
                 (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
    end_date   = datetime.now().strftime('%Y-%m-%d')
    log(f"Rango: {start_date} → {end_date}", 'START')

    client = GoogleAdsClient.load_from_storage(YAML_PATH)
    supa   = create_client(url, key)

    total = 0
    for udn, cid in CUSTOMER_IDS.items():
        log(f"{udn} ({cid})...")
        rows, raw = extract_and_aggregate(client, udn, cid, start_date, end_date)
        log(f"{udn}: {raw:,} registros diarios → {len(rows):,} filas mensuales agregadas")
        n = upsert_supabase(supa, rows)
        log(f"{udn}: {n:,} filas upserted", 'OK')
        total += n

    log(f"Total insertado: {total:,} filas mensuales", 'DONE')

if __name__ == '__main__':
    main()
