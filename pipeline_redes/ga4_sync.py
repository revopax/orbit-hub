"""
ga4_sync.py — Extrae datos de GA4 (10 propiedades UDN) y sincroniza a Supabase.
Reemplaza el flujo legacy de Colab (que escribia a Google Sheets).
Corre: python3 pipeline_redes/ga4_sync.py
"""
import os, time
from datetime import datetime, timedelta
from dotenv import load_dotenv
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric
from google.oauth2 import service_account
from supabase import create_client

load_dotenv()

SERVICE_ACCOUNT_FILE = os.getenv("GA4_SERVICE_ACCOUNT_PATH")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

PROPERTY_IDS = {
    "House Of Films": "482014265", "Marketing United": "470522987",
    "Mexa Creativa": "438562881", "Neracode": "486660932",
    "Promo Espacio": "438542691", "ResearchLand": "406795002",
    "UiX": "467307048", "Zeus": "408511840",
    "Ceci Fallabrino": "438544106", "UPAX": "350972195"
}

GLOBAL_START_DATE = "2025-01-01"
DAYS_TO_RECHECK = 7

REPORT_METRICS = [
    Metric(name="sessions"), Metric(name="totalUsers"),
    Metric(name="newUsers"), Metric(name="screenPageViews"),
    Metric(name="engagedSessions"), Metric(name="averageSessionDuration"),
    Metric(name="eventCount"), Metric(name="keyEvents")
]
METRIC_KEYS = ["sessions","total_users","new_users","screen_page_views",
               "engaged_sessions","avg_session_duration","event_count","key_events"]

DIMS_TOTALS = [Dimension(name="date"), Dimension(name="sessionDefaultChannelGroup"), Dimension(name="sessionSourceMedium")]
DIMS_TOTALES_DIA = [Dimension(name="date")]
DIMS_PAGES  = [Dimension(name="date"), Dimension(name="pagePath"), Dimension(name="pageTitle"),
               Dimension(name="sessionDefaultChannelGroup"), Dimension(name="sessionSourceMedium")]


def get_clients():
    b64_creds = os.getenv("GA4_SERVICE_ACCOUNT_B64")
    if b64_creds:
        # Entorno CI (GitHub Actions): credencial viene como secret en base64
        import base64, json
        creds_dict = json.loads(base64.b64decode(b64_creds))
        creds = service_account.Credentials.from_service_account_info(
            creds_dict, scopes=['https://www.googleapis.com/auth/analytics.readonly'])
    else:
        # Entorno local: credencial viene de archivo
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=['https://www.googleapis.com/auth/analytics.readonly'])
    analytics_client = BetaAnalyticsDataClient(credentials=creds)
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return analytics_client, supabase


def get_start_date(supabase, table_name):
    try:
        res = supabase.table(table_name).select("fecha").order("fecha", desc=True).limit(1).execute()
        if not res.data:
            return GLOBAL_START_DATE
        last_date = datetime.strptime(res.data[0]["fecha"], "%Y-%m-%d")
        recheck = last_date - timedelta(days=DAYS_TO_RECHECK)
        global_dt = datetime.strptime(GLOBAL_START_DATE, "%Y-%m-%d")
        return max(recheck, global_dt).strftime("%Y-%m-%d")
    except Exception as e:
        print(f"  ⚠ No se pudo leer fecha previa ({e}), usando fecha global")
        return GLOBAL_START_DATE


def run_report(client, prop_id, prop_name, start, end, dims, tipo):
    request = RunReportRequest(
        property=f"properties/{prop_id}", dimensions=dims, metrics=REPORT_METRICS,
        date_ranges=[DateRange(start_date=start, end_date=end)], limit=100000
    )
    rows_out = []
    try:
        response = client.run_report(request)
        for row in response.rows:
            d_vals = [v.value for v in row.dimension_values]
            fecha = f"{d_vals[0][:4]}-{d_vals[0][4:6]}-{d_vals[0][6:]}"
            m_vals = [v.value for v in row.metric_values]
            metrics_dict = dict(zip(METRIC_KEYS, [float(v) for v in m_vals]))

            if tipo == "totales":
                registro = {
                    "udn": prop_name, "fecha": fecha,
                    "canal_grupo": d_vals[1], "fuente_medio": d_vals[2],
                    **metrics_dict,
                }
            elif tipo == "totales_dia":
                registro = {
                    "udn": prop_name, "fecha": fecha,
                    **metrics_dict,
                }
            else:
                registro = {
                    "udn": prop_name, "fecha": fecha,
                    "page_path": d_vals[1], "page_title": d_vals[2],
                    "canal_grupo": d_vals[3], "fuente_medio": d_vals[4],
                    **metrics_dict,
                }
            rows_out.append(registro)
        return rows_out
    except Exception as e:
        print(f"  ❌ Error API en {prop_name}: {e}")
        return []


def upsert_batch(supabase, table_name, rows, conflict_cols):
    if not rows:
        return
    # Deduplicar por llave de conflicto (quedarse con la ultima ocurrencia)
    dedup = {}
    for r in rows:
        key = tuple(r[c] for c in conflict_cols)
        dedup[key] = r
    rows = list(dedup.values())

    BATCH = 500
    total = 0
    for i in range(0, len(rows), BATCH):
        chunk = rows[i:i+BATCH]
        supabase.table(table_name).upsert(chunk, on_conflict=",".join(conflict_cols)).execute()
        total += len(chunk)
    print(f"  ✅ {total} filas upserted en {table_name} (dedup aplicado)")


def main():
    print("🚀 GA4 Sync — extracción y carga a Supabase")
    analytics_client, supabase = get_clients()
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    tasks = [
        ("ga4_totales", DIMS_TOTALS, "totales", ["udn", "fecha", "canal_grupo", "fuente_medio"]),
        ("ga4_paginas", DIMS_PAGES, "paginas", ["udn", "fecha", "page_path", "canal_grupo", "fuente_medio"]),
        ("ga4_totales_dia", DIMS_TOTALES_DIA, "totales_dia", ["udn", "fecha"]),
    ]

    for table_name, dims, tipo, conflict_cols in tasks:
        start_date = get_start_date(supabase, table_name)
        print(f"\n📊 {table_name} | desde {start_date} hasta {yesterday}")

        all_rows = []
        for name, p_id in PROPERTY_IDS.items():
            data = run_report(analytics_client, p_id, name, start_date, yesterday, dims, tipo)
            all_rows.extend(data)
            print(f"  · {name}: {len(data)} filas")
            time.sleep(0.2)

        upsert_batch(supabase, table_name, all_rows, conflict_cols)

    print("\n🏁 Proceso completado.")


if __name__ == "__main__":
    main()
