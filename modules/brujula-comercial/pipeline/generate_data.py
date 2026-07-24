# ============================================================
# BRÚJULA COMERCIAL — Generador de datos para el frontend
# ============================================================
import os

import os, sys, json, re, math, warnings
import json as _json
from pathlib import Path as _Path
_ICP_PATH = _Path(__file__).parent / "data" / "icp_data.json"
_ICP: dict = _json.loads(_ICP_PATH.read_text(encoding="utf-8")) if _ICP_PATH.exists() else {}

def _normalizar_empresa(s: str) -> str:
    import re as _re
    s = str(s).upper().strip()
    s = _re.sub(r"[^\w\s]", " ", s)
    s = _re.sub(r"\s+", " ", s)
    for sfx in ["SA DE CV","S DE RL","SAPI DE CV","SC","AC","IAP","SA","SRL",
                "DE MEXICO","DE MÉXICO","MEXICO","S A DE C V"]:
        s = _re.sub(rf"\b{sfx}\b", "", s)
    return s.strip()

def _icp_match(empresa: str, udn_id: str, scian_2: str) -> dict:
    """Retorna campos ICP para una empresa dada su UDN y SCIAN_2."""
    perfil = _ICP.get(str(udn_id).strip(), {})
    if not perfil:
        return {}
    key = _normalizar_empresa(empresa)
    cuentas = perfil.get("cuentas_objetivo", [])
    es_co = key in cuentas
    tier = ""
    if es_co:
        tiers = perfil.get("tiers_por_industria", {})
        if tiers:
            tier = list(tiers.keys())[0]
        else:
            tier = "Cuenta Objetivo"
    sc2 = str(scian_2)[:2] if scian_2 else ""
    scian_match = bool(sc2 and sc2 in perfil.get("scian_2_icp", []))
    return {
        "es_cuenta_objetivo": es_co,
        "tier": tier,
        "icp_industria_match": scian_match,
        "decisor": perfil.get("decisor", ""),
    }

import pandas as pd
import numpy as np
from datetime import datetime

warnings.filterwarnings('ignore')
sys.path.insert(0, os.path.dirname(__file__))

from config import (
    SHEET_HUBSPOT_ID, SHEET_HUBSPOT_TAB,
    SHEET_OUTPUT_ID,  SHEET_OUTPUT_TAB,
    COL_EMPRESA, COL_UDN, COL_FECHA,
    UDNS_VALIDAS, IGAE_SECTOR_COLS,
)

try:
    from scian_map_3d import SCIAN_3_NOMBRE
except ImportError:
    SCIAN_3_NOMBRE = {}

SHEET_BUDGET_ID  = "1Xd1CFY4gwxmKV8OHti9a1XjCmO2Q5NtUlGulfgbxtaE"
SHEET_BUDGET_TAB = "Budget GDD 2026 (Escalonado)"

COL_FECHA_LEAD  = "Fecha Lead / propuesta"
COL_GENERADO    = "Generado por"
COL_ESTADO      = "Estado lead / etapa del negocio / resultado de reunión"
COL_ID          = "ID de registro"

UDN_ID_MAP = {
    "UIX":              "UIX",
    "Marketing United": "MU",
    "Promo Espacio":    "PE",
    "Zeus":             "ZU",
    "Neracode":         "NC",
    "House Of Films":   "HOF",
    "Research Land":    "RL",
    "Mexa Creativa":    "MEXA",
}
UDN_COLOR = {
    "UIX": "#8C59FE", "MU": "#DCFF00", "PE": "#FF7600",
    "ZU":  "#61ACAA", "NC": "#3E31CC", "HOF": "#94A3B8",
    "RL":  "#770EB7", "MEXA": "#FD00C7",
}
MES_ES = {
    1:"ene",2:"feb",3:"mar",4:"abr",5:"may",6:"jun",
    7:"jul",8:"ago",9:"sep",10:"oct",11:"nov",12:"dic",
}

BRUJULA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'df_brujula.parquet')


def get_gc():
    import gspread
    from google.oauth2.service_account import Credentials
    scopes = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    sa_json = os.environ.get("SERVICE_ACCOUNT_JSON")
    if sa_json:
        creds = Credentials.from_service_account_info(json.loads(sa_json), scopes=scopes)
    else:
        creds = Credentials.from_service_account_file(
            os.path.join(os.path.dirname(__file__), "credentials.json"), scopes=scopes)
    return gspread.authorize(creds)


def leer_sheet(gc, sheet_id, tab):
    print(f"  📥 {tab} …")
    ws   = gc.open_by_key(sheet_id).worksheet(tab)
    data = ws.get_all_values()
    df   = pd.DataFrame(data[1:], columns=data[0])
    print(f"     {len(df):,} filas × {len(df.columns)} cols")
    return df


def safe(v):
    if v is None:
        return None
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    return v


def fmt_money(v):
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return "$0"
    v = float(v)
    if v >= 1_000_000:
        return f"${v/1_000_000:.1f}M"
    if v >= 1_000:
        return f"${v/1_000:.0f}K"
    return f"${v:.0f}"


def accion_from_temp(t):
    return "llamar" if t == "caliente" else ("prepararse" if t == "templado" else "esperar")


def nombre_corto(s):
    return re.sub(r'^\d[\d\-]*\s+', '', str(s)).strip()


def procesar_brujula_output(df):
    df = df.copy()
    df.columns = [c.strip() for c in df.columns]
    df['fecha']       = pd.to_datetime(df['fecha'], errors='coerce')
    df['yhat']        = pd.to_numeric(df['yhat'], errors='coerce')
    df['z_score']     = pd.to_numeric(df['z_score'], errors='coerce')
    df['es_forecast'] = df['es_forecast'].astype(str).str.lower().isin(['true','1','yes'])
    # Recalcular temperatura con umbrales actuales de config.py
    from config import Z_CALIENTE, Z_TEMPLADO, Z_TIBIO
    def _temp(z):
        if pd.isna(z): return 'frio'
        if z >= Z_CALIENTE:  return 'caliente'
        if z >= Z_TEMPLADO:  return 'templado'
        if z >= Z_TIBIO:     return 'tibio'
        return 'frio'
    df['temperatura'] = df['z_score'].apply(_temp)
    return df[df['fecha'].notna() & df['sector_igae'].notna()].copy()


def procesar_hubspot(df, incluir_sin_empresa=False):
    df = df.copy()
    df.columns = [c.strip() for c in df.columns]
    df = df[df[COL_UDN].isin(UDNS_VALIDAS)].copy()
    if not incluir_sin_empresa:
        df = df[df[COL_EMPRESA].notna() & (df[COL_EMPRESA] != '')].copy()
    return df


def procesar_budget(df):
    UDN_NAMES = {
        'research land':    'RL',  'promo espacio':    'PE',
        'uix':              'UIX', 'zeus':             'ZU',
        'mexa creativa':    'MEXA','house of films':   'HOF',
        'marketing united': 'MU',  'neracode':         'NC',
    }
    budget = {uid: {} for uid in UDN_ID_MAP.values()}
    rows   = [list(r) for _, r in df.iterrows()]

    def parse_num(s):
        if not s or str(s).strip() in ('', '#DIV/0!', 'Sin Registro'):
            return None
        try:
            return float(re.sub(r'[$,\s%]', '', str(s)).strip())
        except:
            return None

    for i, row in enumerate(rows):
        col_a = str(row[0]).strip().lower() if row else ''
        uid   = UDN_NAMES.get(col_a)
        if uid is None:
            continue
        for j in range(1, 20):
            if i + j >= len(rows):
                break
            nr      = rows[i + j]
            metrica = str(nr[0]).strip() if nr else ''
            if metrica.lower() in UDN_NAMES:
                break
            c = parse_num(nr[2] if len(nr) > 2 else '')
            d = parse_num(nr[3] if len(nr) > 3 else '')
            if metrica == 'Proyectos Ganados':
                if c: budget[uid]['meta_proyectos'] = c
                if d: budget[uid]['real_proyectos']  = d
            elif metrica == 'Venta EXT':
                if c: budget[uid]['meta_revenue'] = c
                if d: budget[uid]['real_ytd']     = d
            elif metrica == 'Ticket Promedio':
                if c: budget[uid]['meta_ticket'] = c
                if d: budget[uid]['real_ticket'] = d
            elif metrica == 'Lead':
                if c: budget[uid]['meta_leads']        = c
                if d: budget[uid]['real_leads_budget']  = d

    print(f"  Budget parseado para: {[k for k,v in budget.items() if v]}")
    for uid, b in budget.items():
        if b.get('real_ytd') is not None:
            print(f"    {uid}: Real YTD=${b['real_ytd']:,.0f} | Meta=${b.get('meta_revenue',0):,.0f} | Leads={b.get('real_leads_budget',0)}")
    return budget


def calcular_timing_comercial(df_hs, uid):
    """Calcula % de contactos 2026 en momento IGAE activo (caliente o templado)"""
    try:
        if not os.path.exists(BRUJULA_PATH):
            return {'pct_total':0,'caliente':0,'templado':0,'total':0,'badge':'sin datos','color':'amber'}

        df_b = pd.read_parquet('data/df_brujula.parquet')
        col_udn = 'UDN / Pipeline'
        udn_name = next((k for k,v in UDN_ID_MAP.items() if v == uid), None)
        if not udn_name:
            return {'pct_total':0,'caliente':0,'templado':0,'total':0,'badge':'sin datos','color':'amber'}

        df_u = df_b[df_b[col_udn] == udn_name].copy()
        df_u['fecha_lead'] = pd.to_datetime(df_u['Fecha Lead / propuesta'], errors='coerce')

        # Histórico 2026 completo
        anio_actual = datetime.now().year
        df_2026 = df_u[
            (df_u['fecha_lead'].dt.year == anio_actual) &
            (df_u['temperatura'].notna())
        ]

        total = len(df_2026)
        if total == 0:
            return {'pct_total':0,'caliente':0,'templado':0,'total':0,'badge':'sin datos','color':'amber'}

        n_caliente = int((df_2026['temperatura'] == 'caliente').sum())
        n_templado = int((df_2026['temperatura'] == 'templado').sum())
        n_total_activo = n_caliente + n_templado
        pct = round(n_total_activo / total * 100, 1)

        color = 'green' if pct >= 50 else ('amber' if pct >= 30 else 'red')
        badge = f"{n_total_activo} de {total} contactos"

        return {
            'pct_total': pct,
            'caliente': n_caliente,
            'templado': n_templado,
            'total': total,
            'badge': badge,
            'color': color,
            'pct_caliente': round(n_caliente/total*100,1) if total > 0 else 0,
            'pct_templado': round(n_templado/total*100,1) if total > 0 else 0,
        }
    except Exception as e:
        print(f"  Error timing: {e}")
        return {'pct_total':0,'caliente':0,'templado':0,'total':0,'badge':'sin datos','color':'amber'}



def generar_kpis_historico(df_hs):
    """Genera KPIs por mes para filtro de periodo en frontend"""
    historico = {}

    if not os.path.exists('data/df_brujula.parquet'):
        return historico

    df_b = pd.read_parquet('data/df_brujula.parquet')
    df_b['fecha_lead'] = pd.to_datetime(df_b['Fecha Lead / propuesta'], errors='coerce')

    col_etapa = next((c for c in df_hs.columns if 'etapa' in c.lower() or 'estado lead' in c.lower()), None)

    for nombre_udn, uid in UDN_ID_MAP.items():
        historico[uid] = {}

        # Leads por mes desde df_brujula
        df_u = df_b[df_b['UDN / Pipeline'] == nombre_udn].copy()
        df_u['anio'] = df_u['fecha_lead'].dt.year
        df_u['mes']  = df_u['fecha_lead'].dt.month

        # Agrupar por año-mes
        for (anio, mes), grp in df_u.groupby(['anio', 'mes']):
            if pd.isna(anio) or pd.isna(mes):
                continue
            anio, mes = int(anio), int(mes)
            key = f"{anio}-{mes:02d}"

            total = len(grp)
            con_temp = grp[grp['temperatura'].notna()]
            n_caliente = int((con_temp['temperatura'] == 'caliente').sum())
            n_templado = int((con_temp['temperatura'] == 'templado').sum())
            n_activo   = n_caliente + n_templado
            total_temp = len(con_temp)
            pct_timing = round(n_activo / total_temp * 100, 1) if total_temp > 0 else 0

            historico[uid][key] = {
                'leads': total,
                'timing_activo': n_activo,
                'timing_total': total_temp,
                'pct_timing': pct_timing,
                'anio': anio,
                'mes': mes,
            }

    return historico

def generar_kpis(df_hs, budget):
    kpis = {}

    # Replicar filtros Looker desde HubSpot Repository
    # MBR-Opp: Tipo de objeto = negocio
    # MBR-Ganado: Etapa contains 'ganado' + Fecha Por facturar NOT NULL
    col_tipo      = next((c for c in df_hs.columns if 'tipo' in c.lower() and 'objeto' in c.lower()), None)
    col_etapa     = next((c for c in df_hs.columns if 'etapa' in c.lower() or 'estado lead' in c.lower()), None)
    col_valor_k   = next((c for c in df_hs.columns if c.lower().strip() == 'valor'), None)
    col_fecha_fac = next((c for c in df_hs.columns if 'facturar' in c.lower()), None)

    hs_kpis = {}
    for nombre_udn, uid_k in UDN_ID_MAP.items():
        df_u = df_hs[df_hs[COL_UDN] == nombre_udn].copy()
        # Para YTD usamos todos los registros — el filtro de negocio se aplica solo a proyectos
        df_u_negocio = df_u[df_u[col_tipo].astype(str).str.lower().str.contains('negocio', na=False)].copy() if col_tipo else df_u.copy()
        # Proyectos Ganados = Ganado por facturar OR ya facturados (Fecha facturado no nula)
        col_fecha_facturado = next((c for c in df_u.columns if c.lower().strip() == 'fecha facturado'), None)
        
        # Grupo 1: Ganado por facturar (etapa 5) con Fecha Por facturar no nula en 2026
        df_g1 = pd.DataFrame()
        if col_etapa and col_fecha_fac:
            df_tmp = df_u[df_u[col_etapa].astype(str).str.contains('5. Ganado por facturar', case=False, na=False)]
            df_tmp = df_tmp[df_tmp[col_fecha_fac].notna()]
            fac_dt = pd.to_datetime(df_tmp[col_fecha_fac], dayfirst=True, errors='coerce')
            df_g1  = df_tmp[fac_dt.dt.year == 2026]

        # Grupo 2: Ya facturados (Fecha facturado no nula en 2026)
        df_g2 = pd.DataFrame()
        if col_fecha_facturado:
            df_tmp2 = df_u[df_u[col_fecha_facturado].notna()]
            fac_dt2 = pd.to_datetime(df_tmp2[col_fecha_facturado], dayfirst=True, errors='coerce')
            df_g2   = df_tmp2[fac_dt2.dt.year == 2026]

        # Unir ambos grupos sin duplicados
        # Regla: Fecha facturado en 2026
        col_fecha_fac2 = next((c for c in df_u.columns if c.strip() == 'Fecha facturado'), None)
        ytd = 0; n_proy = 0; ticket = 0
        if col_fecha_fac2 and col_valor_k:
            df_u['_fecha_fac'] = pd.to_datetime(df_u[col_fecha_fac2], dayfirst=True, errors='coerce')
            df_u['_valor']     = pd.to_numeric(
                df_u[col_valor_k].astype(str).str.replace(r'[$,]', '', regex=True),
                errors='coerce'
            )
            df_fac = df_u[df_u['_fecha_fac'].dt.year == 2026]
            vals   = df_fac['_valor'].dropna()
            ytd    = float(vals.sum())
            n_proy = int((vals > 0).sum())
            ticket = float(vals[vals > 0].mean()) if n_proy > 0 else 0
        hs_kpis[uid_k] = {'ytd': ytd, 'proy': n_proy, 'ticket': ticket}
        if ytd > 0:
            print(f"    HS {nombre_udn}: Real YTD=${ytd:,.0f} | Proyectos={n_proy} | Ticket=${ticket:,.0f}")

    for nombre, uid in UDN_ID_MAP.items():
        color = UDN_COLOR[uid]
        b     = budget.get(uid, {})
        hs    = hs_kpis.get(uid, {})
        n_leads    = int(b.get('real_leads_budget', 0) or 0)
        meta_leads = int(b.get('meta_leads', 14000) or 14000)
        real_ytd    = hs.get('ytd') or b.get('real_ytd')
        meta_rev    = b.get('meta_revenue')
        real_proy   = hs.get('proy') or b.get('real_proyectos')
        meta_proy   = b.get('meta_proyectos')
        real_ticket = hs.get('ticket') or b.get('real_ticket')
        meta_ticket = b.get('meta_ticket')
        pct_rev    = round((real_ytd / meta_rev * 100), 1) if real_ytd and meta_rev else 0
        color_ytd  = "green" if pct_rev >= 10 else ("amber" if pct_rev >= 5 else "red")
        pct_proy   = round((real_proy / meta_proy * 100), 1) if real_proy and meta_proy else 0
        badge_proy = f"{'▲' if pct_proy >= 50 else '▼'} {pct_proy:.0f}% avance"
        color_proy = "green" if pct_proy >= 80 else ("amber" if pct_proy >= 50 else "red")
        pct_leads  = round((n_leads / meta_leads * 100), 1) if meta_leads else 0
        badge_leads = f"{'▲' if pct_leads >= 50 else '▼'} {pct_leads:.0f}% vs meta"
        color_leads = "green" if pct_leads >= 80 else ("amber" if pct_leads >= 50 else "red")
        meta_mes    = round(meta_leads / 12)
        dif_ticket  = (real_ticket or 0) - (meta_ticket or 0)
        badge_ticket = f"{'▲' if dif_ticket >= 0 else '▼'} {fmt_money(abs(dif_ticket))} vs meta"
        color_ticket = "green" if dif_ticket >= 0 else ("amber" if dif_ticket > -50000 else "red")
        pct_barra   = min(round(pct_rev * (12 / max(datetime.now().month, 1))), 100)
        # Timing Comercial — contactos en momento IGAE activo
        timing = calcular_timing_comercial(df_hs, uid)

        kpis[uid] = [
            {"label":"Ingresos del Periodo", "valor":fmt_money(real_ytd) if real_ytd else "$0",       "meta":fmt_money(meta_rev) if meta_rev else "$0",  "badge":f"{pct_rev:.1f}% del año", "badgeColor":color_ytd,   "tipo":"moneda", "acento":color},
            {"label":"Proyectos ganados",     "valor":int(real_proy) if real_proy else 0,              "meta":int(meta_proy) if meta_proy else 0,          "badge":badge_proy,                "badgeColor":color_proy,  "tipo":"numero", "acento":color},
            {"label":"Ticket promedio",       "valor":fmt_money(real_ticket) if real_ticket else "$0", "meta":fmt_money(meta_ticket) if meta_ticket else "$0", "badge":badge_ticket,          "badgeColor":color_ticket,"tipo":"moneda", "acento":color},
            {"label":"Leads acumulados",      "valor":f"{n_leads:,}",                                  "meta":f"{meta_leads:,} · mes: {meta_mes:,}",      "badge":badge_leads,               "badgeColor":color_leads, "tipo":"numero", "acento":color},
            {"label":"Timing Comercial",      "valor":f"{timing['pct_total']}%",                       "meta":"",                                          "badge":timing['badge'],           "badgeColor":timing['color'], "tipo":"timing", "acento":color,
             "timingData": timing},
        ]
    return kpis


def generar_temperatura(df_hs, df_forecast):
    temp_por_udn = {}
    if os.path.exists(BRUJULA_PATH):
        df_b = pd.read_parquet(BRUJULA_PATH)
        print(f"  ✅ df_brujula: {len(df_b):,} leads con temperatura real")
        for nombre, uid in UDN_ID_MAP.items():
            df_u   = df_b[df_b['UDN / Pipeline'] == nombre]
            counts = df_u['temperatura'].value_counts()
            temp_por_udn[uid] = {
                "caliente": int(counts.get('caliente', 0)),
                "templado": int(counts.get('templado', 0)),
                "tibio":    int(counts.get('tibio',    0)),
                "frio":     int(counts.get('frio',     0)),
            }
    else:
        print("  ⚠ df_brujula.parquet no encontrado")
        fecha_max = df_forecast[~df_forecast['es_forecast']]['fecha'].max()
        df_temp   = df_forecast[df_forecast['fecha'] == fecha_max][['sector_igae','temperatura']].set_index('sector_igae')
        for nombre, uid in UDN_ID_MAP.items():
            n      = len(df_hs[df_hs[COL_UDN] == nombre])
            counts = df_temp['temperatura'].value_counts(normalize=True)
            temp_por_udn[uid] = {
                "caliente": round(n * float(counts.get('caliente', 0.30))),
                "templado": round(n * float(counts.get('templado', 0.25))),
                "tibio":    round(n * float(counts.get('tibio',    0.25))),
                "frio":     round(n * float(counts.get('frio',     0.20))),
            }
    return temp_por_udn



def generar_insights_udn(df_b, industrias_por_udn):
    """
    Genera insights accionables por UDN basados en:
    - Motivos de pérdida dominantes (radar)
    - Desbalance entre sectores calientes vs donde prospectan
    - Recomendación concreta
    """
    motivos_timing = ['No hay timing','No tiene presupuesto','No tienen presupuesto',
                      'Proyecto postergado','Proyecto cancelado']
    motivos_ejecucion = ['Sin respuesta','Sin contactabilidad','Datos incorrectos',
                         'Entregable no cumple con expectativa','No hay Fit / Alcance',
                         'No cumple rol de compra']

    insights = {}
    for nombre, uid in UDN_ID_MAP.items():
        df_u = df_b[df_b['UDN / Pipeline'] == nombre]
        if len(df_u) == 0:
            insights[uid] = []
            continue

        resultado = []

        # 1. Motivo dominante
        motivos = df_u['Motivo de descalificación / perdido'].dropna()
        motivos = motivos[motivos != '']
        if len(motivos) > 0:
            top_motivo = motivos.value_counts().index[0]
            n_motivo = motivos.value_counts().iloc[0]
            pct_motivo = round(n_motivo / len(motivos) * 100, 1)

            if top_motivo in motivos_timing:
                resultado.append({
                    'tipo': 'timing',
                    'titulo': 'El mercado dicta cuándo llegar',
                    'texto': f'Tu principal motivo de pérdida es "{top_motivo}" ({pct_motivo}% de descalificados). Esto indica que el producto/servicio sí genera interés, pero el momento de contacto no coincide con el ciclo de presupuesto del sector. Usa la curva de actividad económica arriba para identificar cuándo llegar antes de que el cliente cierre su presupuesto.',
                    'accion': 'Revisa el gráfico de actividad — prospecta 2-3 meses antes del pico proyectado'
                })
            elif top_motivo in motivos_ejecucion:
                if 'Sin respuesta' in top_motivo or 'Sin contactabilidad' in top_motivo:
                    resultado.append({
                        'tipo': 'ejecucion',
                        'titulo': 'Problema de alcance, no de timing',
                        'texto': f'"{top_motivo}" representa el {pct_motivo}% de tus pérdidas. Esto no es un problema de cuándo llegas, sino de a quién contactas o cómo. El timing correcto no resuelve esto — revisar el perfil del contacto objetivo y el canal de prospección sí puede.',
                        'accion': 'Prioriza contactos con cargo de decisión en los sectores calientes'
                    })
                elif 'Entregable' in top_motivo or 'Fit' in top_motivo:
                    resultado.append({
                        'tipo': 'propuesta',
                        'titulo': 'El momento es correcto, la propuesta no',
                        'texto': f'"{top_motivo}" como motivo dominante ({pct_motivo}%) indica que estás llegando al cliente correcto en el momento correcto, pero la propuesta de valor no conecta. El timing no es el problema aquí — la diferenciación y el entendimiento del cliente sí.',
                        'accion': 'Revisa el pitch y los entregables para los sectores donde más pierdes'
                    })

        # 2. Desbalance sectores calientes vs prospección masiva
        inds = industrias_por_udn.get(uid, [])
        calientes = [i for i in inds if i.get('temperatura') == 'caliente']
        todos = inds[:5]
        if calientes and todos:
            leads_calientes = sum(i.get('leads', 0) for i in calientes)
            leads_totales = sum(i.get('leads', 0) for i in todos)
            pct_en_caliente = round(leads_calientes / leads_totales * 100, 1) if leads_totales > 0 else 0
            if pct_en_caliente < 20:
                sector_cal = calientes[0]['nombre'] if calientes else ''
                resultado.append({
                    'tipo': 'oportunidad',
                    'titulo': 'Oportunidad desaprovechada en sector caliente',
                    'texto': f'Solo el {pct_en_caliente}% de tus leads están en sectores con temperatura caliente. "{sector_cal}" está en su mejor momento de receptividad, pero concentras la mayoría del esfuerzo en sectores en fase Esperar o Tibio. Redirigir prospección ahora puede aumentar la tasa de respuesta.',
                    'accion': f'Aumenta prospección en {sector_cal} — el mercado está receptivo ahora'
                })

        insights[uid] = resultado

    return insights

def sectores_por_timing(df_b):
    """
    Retorna top 3 sectores por UDN donde se perdio por timing/presupuesto.
    Estos son los sectores donde la Brujula tiene mayor valor.
    """
    motivos = ['No hay timing','No tiene presupuesto','No tienen presupuesto',
               'Proyecto postergado','Proyecto cancelado']
    perdidos = df_b[df_b['Motivo de descalificación / perdido'].isin(motivos)]
    resultado = {}
    for nombre, uid in UDN_ID_MAP.items():
        u = perdidos[perdidos['UDN / Pipeline'] == nombre]
        if len(u) == 0:
            resultado[uid] = []
            continue
        top = u['sector_igae'].value_counts().head(3)
        resultado[uid] = [{'nombre': s} for s in top.index if pd.notna(s) and str(s).strip()]
    return resultado

def generar_temporalidad(df_forecast, industrias_por_udn):
    all_fechas = sorted(df_forecast['fecha'].unique())
    labels     = [f"{MES_ES[f.month].capitalize()}'{str(f.year)[2:]}" for f in all_fechas]
    temporal   = {}

    for uid, inds in industrias_por_udn.items():
        if not inds:
            temporal[uid] = None
            continue

        sectores_out = []
        for ind in inds[:3]:
            mask = df_forecast['sector_igae'].apply(
                lambda s: ind['nombre'][:12].lower() in s.lower())
            df_s = df_forecast[mask].drop_duplicates('fecha').set_index('fecha')

            if len(df_s) == 0:
                continue

            yhat_max = df_s['yhat'].max()
            if not yhat_max or yhat_max == 0:
                yhat_max = 1

            historico, forecast, pct_max = [], [], []
            for f in all_fechas:
                if f in df_s.index:
                    row   = df_s.loc[f]
                    yhat  = safe(float(row['yhat'])) if pd.notna(row.get('yhat')) else None
                    is_fc = bool(row.get('es_forecast', False))
                    pct   = round((yhat / yhat_max) * 100, 1) if yhat else None
                    historico.append(None if is_fc else yhat)
                    forecast.append(yhat if is_fc else None)
                    pct_max.append(pct)
                else:
                    historico.append(None)
                    forecast.append(None)
                    pct_max.append(None)

            sectores_out.append({
                "nombre":    ind['nombre'],
                "historico": historico,
                "forecast":  forecast,
                "pctMaximo": pct_max,
            })

        temporal[uid] = {"labels": labels, "sectores": sectores_out} if sectores_out else None

    return temporal


def generar_calendario(df_forecast, industrias_por_udn):
    _mes_actual = datetime.now().month
    MESES_CAL = [pd.Timestamp(f'2026-{m:02d}-01') for m in range(_mes_actual, 13)]
    NOMBRES   = [m.upper() for m in ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][_mes_actual-1:12]]

    def estado_relativo(z_scores_mes):
        """
        Ranking relativo: clasifica cada mes vs los otros meses del periodo.
        Siempre genera variedad independientemente del ciclo macro.
        Top 25% → pico, 25-50% → prep, 50-75% → ok, bottom 25% → vacio
        """
        import numpy as np
        zs = list(z_scores_mes.values())
        if not zs or all(pd.isna(z) for z in zs):
            return {m: 'vacio' for m in z_scores_mes}
        zs_valid = [z for z in zs if not pd.isna(z)]
        p75 = np.percentile(zs_valid, 75)
        p50 = np.percentile(zs_valid, 50)
        p25 = np.percentile(zs_valid, 25)
        result = {}
        for mes, z in z_scores_mes.items():
            if pd.isna(z):
                result[mes] = 'vacio'
            elif z >= p75:
                result[mes] = 'pico'
            elif z >= p50:
                result[mes] = 'prep'
            elif z >= p25:
                result[mes] = 'ok'
            else:
                result[mes] = 'vacio'
        return result

    cals = {}
    for uid, inds in industrias_por_udn.items():
        if not inds:
            cals[uid] = None
            continue
        filas = []
        for ind in inds[:6]:
            mask = df_forecast['sector_igae'].apply(
                lambda s: ind['nombre'][:12].lower() in s.lower())
            df_s = df_forecast[mask].drop_duplicates('fecha').set_index('fecha')
            # Recolectar z_scores por mes
            z_por_mes = {}
            for mes in MESES_CAL:
                if mes in df_s.index:
                    z_por_mes[mes] = df_s.loc[mes, 'z_score']
                else:
                    z_por_mes[mes] = float('nan')
            # Ranking relativo
            estados = estado_relativo(z_por_mes)
            celdas = [estados[mes] for mes in MESES_CAL]
            filas.append({"industria": ind['nombre'], "celdas": celdas})
        cals[uid] = {"meses": NOMBRES, "filas": filas}
    return cals


def generar_picos(industrias_por_udn, df_hs=None):
    ACCION_TEXTO = {
        'caliente': 'Contactar ahora a prospectos identificados',
        'templado': 'Preparar propuesta y presentar',
        'tibio':    'Calificar leads y agendar demos',
        'frio':     'Monitorear señales del sector',
    }
    # Subramas por (UDN, sector) desde df_maestro
    subrama_lookup = {}
    try:
        _df_m = pd.read_parquet(os.path.join(os.path.dirname(__file__), 'data', 'df_maestro.parquet'))
        if "SCIAN_3" in _df_m.columns and "SCIAN_nombre" in _df_m.columns:
            _df_m = _df_m[["UDN / Pipeline", "SCIAN_nombre", "SCIAN_3"]].dropna(
                subset=["SCIAN_3", "SCIAN_nombre"])
            _df_m["SCIAN_3"] = _df_m["SCIAN_3"].astype(str).str.strip()
            _df_m = _df_m[_df_m["SCIAN_3"] != "nan"]
            for (udn, sector), grp in _df_m.groupby(["UDN / Pipeline", "SCIAN_nombre"]):
                uid_k = UDN_ID_MAP.get(udn)
                if not uid_k:
                    continue
                sector_short = nombre_corto(sector)[:20].lower()
                counts = grp["SCIAN_3"].value_counts().head(5)
                subrama_lookup[(uid_k, sector_short)] = [
                    {"scian3": code, "nombre": SCIAN_3_NOMBRE.get(code, code), "leads": int(cnt)}
                    for code, cnt in counts.items()
                ]
    except Exception as e:
        print(f"  ⚠ subramas no disponibles: {e}")

    result = {}
    for uid, inds in industrias_por_udn.items():
        rows = []
        for i in inds[:5]:
            key = (uid, i['nombre'][:20].lower())
            rows.append({
                "industria":   i['nombre'],
                "temperatura": i['temperatura'],
                "mesPico":     i['mesPico'],
                "accion":      ACCION_TEXTO.get(i['temperatura'], 'Monitorear'),
                "leadsEnBase": i['leads'],
                "subramas":    subrama_lookup.get(key, []),
            })
        result[uid] = rows
    return result


def generar_rescue(df_hs, industrias_por_udn):
    # Cargar SCIAN_nombre desde df_maestro
    try:
        import os
        _cols_m = ["Nombre de la empresa", "SCIAN_nombre"]
        _df_m   = pd.read_parquet(os.path.join(os.path.dirname(__file__), 'data', 'df_maestro.parquet'))
        if "SCIAN_3" in _df_m.columns:
            _cols_m.append("SCIAN_3")
        _df_m      = _df_m[_cols_m].drop_duplicates("Nombre de la empresa")
        scian_map  = _df_m.set_index("Nombre de la empresa")["SCIAN_nombre"].to_dict()
        scian3_map = _df_m.set_index("Nombre de la empresa")["SCIAN_3"].to_dict() if "SCIAN_3" in _df_m.columns else {}
    except Exception:
        scian_map  = {}
        scian3_map = {}
    SCIAN_IGAE_MAP = {
        "Manufactura": "Industrias manufactureras",
        "Manufactura — Alimentos": "Industrias manufactureras",
        "Manufactura — Metálica y maquinaria": "Industrias manufactureras",
        "Manufactura — Química y plásticos": "Industrias manufactureras",
        "Manufactura — Textil y calzado": "Industrias manufactureras",
        "Servicios profesionales y TI": "Servicios profesionales, científicos y técnicos",
        "Transportes y logística": "Transportes, correos y almacenamiento",
        "Servicios de salud": "Servicios de salud y de asistencia social",
        "Entretenimiento y esparcimiento": "Servicios de esparcimiento culturales y deportivos, y otros servicios recreativos",
    }
    scian_map = {k: SCIAN_IGAE_MAP.get(v, v) for k, v in scian_map.items()}
    # Cargar forecast histórico con percentiles por mes calendario (mismo mes vs años anteriores)
    try:
        import numpy as np
        df_fc = pd.read_parquet("data/df_forecast.parquet")[["fecha","sector_igae","z_score"]]
        df_fc = df_fc[df_fc["z_score"].notna()].copy()
        df_fc["sector_clean"] = df_fc["sector_igae"].str.replace(r"^\d+[-\d]*\s+", "", regex=True)
        df_fc["ym"] = df_fc["fecha"].dt.to_period("M").astype(str)
        df_fc["mes"] = df_fc["fecha"].dt.month
        fase_hist = {}
        for sector, grp in df_fc.groupby("sector_clean"):
            for mes, grp_mes in grp.groupby("mes"):
                p75 = np.percentile(grp_mes["z_score"], 75)
                p50 = np.percentile(grp_mes["z_score"], 50)
                p25 = np.percentile(grp_mes["z_score"], 25)
                for _, r in grp_mes.iterrows():
                    z = r["z_score"]
                    if z >= p75:   fase = "caliente"
                    elif z >= p50: fase = "templado"
                    elif z >= p25: fase = "tibio"
                    else:          fase = "frio"
                    fase_hist[(sector, r["ym"])] = fase
    except Exception:
        fase_hist = {}
    estados_perd = ['perd', 'no califica', 'descalif', 'cerrada', 'cancelad', 'lost']

    # Lookup mesPico por nombre de industria
    mes_pico_lookup = {}
    for uid_inds in industrias_por_udn.values():
        for ind in uid_inds:
            nombre = ind.get('nombre', '')
            mes = ind.get('mesPico', 'N/D')
            if nombre and mes != 'N/D':
                mes_pico_lookup[nombre.lower()[:20]] = mes

    # Detectar columnas dinámicamente
    cols = df_hs.columns.tolist()
    col_motivo    = next((c for c in cols if 'motivo' in c.lower()), None)
    col_fecha_mql = next((c for c in cols if 'fecha' in c.lower() and 'mql' in c.lower()), None)
    col_valor     = next((c for c in cols if c.lower().strip() == 'valor'), None)
    col_ind       = next((c for c in cols if 'industria' in c.lower()), None)
    col_generado  = next((c for c in cols if 'generado' in c.lower()), None)
    col_fecha_cre = next((c for c in cols if 'creaci' in c.lower() and 'fecha' in c.lower()), None)
    col_estado    = next((c for c in cols if any(x in c.lower() for x in ['estado lead','etapa','resultado'])), None)

    MES_NUM = {'ene':1,'feb':2,'mar':3,'abr':4,'may':5,'jun':6,
               'jul':7,'ago':8,'sep':9,'oct':10,'nov':11,'dic':12}
    hoy = pd.Timestamp.now()

    rescue = {}
    for nombre_udn, uid in UDN_ID_MAP.items():
        df_u = df_hs[df_hs[COL_UDN] == nombre_udn].copy()

        if col_estado:
            mask = df_u[col_estado].astype(str).str.lower().str.contains(
                '|'.join(estados_perd), na=False)
            df_perd = df_u[mask]
        else:
            df_perd = df_u.head(0)

        rows = []
        seen = set()
        for _, row in df_perd.iterrows():
            empresa = str(row.get(COL_EMPRESA, '') or '').strip()
            if not empresa or empresa.lower() in ('nan', '') or empresa in seen:
                continue
            seen.add(empresa)

            # Industria real del lead
            ind_raw = ''
            if col_ind:
                v = row.get(col_ind, '')
                ind_raw = str(v).strip() if v and not pd.isna(v) else ''
            if ind_raw.lower() == 'nan':
                ind_raw = ''

            # mesPico por industria real
            mes_pico = 'N/D'
            key_ind  = ind_raw.lower()[:20]
            for key, mes in mes_pico_lookup.items():
                if key and (key in key_ind or key_ind in key):
                    mes_pico = mes
                    break

            # Motivo real de descalificación
            motivo = ''
            if col_motivo:
                m = row.get(col_motivo, '')
                motivo = str(m).strip() if m and not pd.isna(m) else ''
            if not motivo or motivo == 'nan':
                motivo = 'Sin registro'

            # Fecha MQL / evaluando
            fecha_perd = ''
            if col_fecha_mql:
                fp = row.get(col_fecha_mql)
                try:
                    if fp and not pd.isna(fp):
                        fecha_perd = pd.Timestamp(fp).strftime('%b %Y').lower()
                except Exception:
                    fecha_perd = ''

            # Valor real
            valor = 0
            if col_valor:
                v = row.get(col_valor, 0)
                try:
                    valor = int(float(str(v).replace(',', '').replace('$', '') or 0)) if v and not pd.isna(v) else 0
                except Exception:
                    valor = 0

            # Acción según distancia al pico
            accion = 'esperar'
            if mes_pico != 'N/D':
                try:
                    partes = mes_pico.lower().split()
                    m_num  = MES_NUM.get(partes[0], 0)
                    yr     = int(partes[1])
                    diff   = (yr - hoy.year) * 12 + m_num - hoy.month
                    if diff <= 1:
                        accion = 'llamar'
                    elif diff <= 3:
                        accion = 'prepararse'
                except Exception:
                    accion = 'esperar'

            _s3   = str(scian3_map.get(empresa, "")).strip()
            _snom = SCIAN_3_NOMBRE.get(_s3, "") if _s3 and _s3 != "nan" else ""
            rows.append({
                "empresa":        empresa,
                "industria":      scian_map.get(empresa, ind_raw) or 'Sin industria',
                "scian3":         _s3 if _s3 != "nan" else "",
                "subrama":        _snom,
                "motivoPerdida":  motivo,
                "detallePerdida": str(row.get('Detalle de descalificación / Perdido', '') or row.get('detalle_descalificacion_perdido', '') or '').strip(),
                "fechaPerdido":   fecha_perd,
                "valor":          valor,
                "mesPico":        mes_pico,
                "generadoPor":    str(row.get(col_generado, "") or "").strip() if col_generado else "",
                "fechaCreacion":  pd.Timestamp(row.get(col_fecha_cre)).strftime("%b %Y").lower() if col_fecha_cre and row.get(col_fecha_cre) and not pd.isna(row.get(col_fecha_cre)) else "",
                "faseAlContactar": (lambda ym: fase_hist.get((scian_map.get(empresa, ind_raw), ym), "") if ym >= "2026-04" else "")(pd.Timestamp(row.get(col_fecha_cre)).strftime("%Y-%m") if col_fecha_cre and row.get(col_fecha_cre) and not pd.isna(row.get(col_fecha_cre)) else ""),
                "accion":         accion,
            })

        rows.sort(key=lambda r: r['valor'], reverse=True)
        rescue[uid] = rows[:300]
    return rescue



UDN_NOMBRE_MAP = {v: k for k, v in UDN_ID_MAP.items()}

def _clasificar_etapa_funnel(row):
    """Clasifica una fila en una etapa del funnel (Lead/MQL/SQL/Oportunidad/Valor/Cliente)
    y devuelve la fecha relevante para esa etapa. Aislado del IGAE — solo se usa en
    empresas_pico / Cross-sell, nunca en generar_temperatura/industrias/calendario."""
    def _get(col):
        v = row.get(col)
        if v is None:
            return None
        try:
            if pd.isna(v):
                return None
        except Exception:
            pass
        s = str(v).strip()
        return s if s and s.lower() != 'nan' else None

    tipo_obj = (_get('Tipo de objeto') or '').lower()
    etapa    = (_get('Estado lead / etapa del negocio / resultado de reunión') or '')
    puesto   = (_get('Puesto / Tipo de negocio / Tipo de reunión') or '').lower()

    fecha_lead      = _get('Fecha Lead / propuesta')
    fecha_mql       = _get('Fecha MQL / evaluando')
    fecha_creacion  = _get('Fecha creación / reunión')
    fecha_facturado = _get('Fecha facturado')
    fecha_por_fact  = _get('Fecha Por facturar')

    es_contacto = 'contacto' in tipo_obj
    es_negocio  = 'negocio' in tipo_obj
    es_reunion  = 'reuni' in tipo_obj

    # Cliente ($ y #) — mismo filtro base, Negocio + Fecha facturado no nula
    if es_negocio and fecha_facturado:
        return ('cliente', fecha_facturado[:10])

    # Valor — Negocio, usa Fecha Por facturar (sin requerir facturado aun)
    if es_negocio and fecha_por_fact:
        return ('valor', fecha_por_fact[:10])

    # Oportunidad — Negocio, Fecha creacion/reunion
    if es_negocio and fecha_creacion:
        return ('oportunidad', fecha_creacion[:10])

    # SQL — Reunion, Puesto/Tipo = Credenciales, Etapa = Completada
    if es_reunion and 'credencial' in puesto and etapa.lower() == 'completada' and fecha_creacion:
        return ('sql', fecha_creacion[:10])

    # MQL — Contacto, Fecha MQL/evaluando no nula
    if es_contacto and fecha_mql:
        return ('mql', fecha_mql[:10])

    # Lead — Contacto, Fecha Lead/propuesta no nula
    if es_contacto and fecha_lead:
        return ('lead', fecha_lead[:10])

    return (None, None)


def generar_empresas_pico(df_hs, industrias_por_udn):
    """Empresas reales de HubSpot por UDN x sector para la tabla expandible."""
    try:
        _df_m = pd.read_parquet(os.path.join(os.path.dirname(__file__), 'data', 'df_maestro.parquet'))
    except Exception as e:
        print(f"  ⚠ empresas_pico no disponible: {e}")
        return {}

    cols_needed = ['Nombre de la empresa', 'UDN / Pipeline', 'SCIAN_nombre', 'SCIAN_3', 'SCIAN_3_nombre', 'Tipo de objeto', 'Estado lead / etapa del negocio / resultado de reunión',
                   'Generado por', 'Fecha creación / reunión', 'Motivo de descalificación / perdido',
                   'Valor', 'Fecha Perdido', 'Estado lead / etapa del negocio / resultado de reunión',
                   'Fecha Lead / propuesta', 'Fecha MQL / evaluando', 'Fecha Por facturar', 'Fecha facturado',
                   'Puesto / Tipo de negocio / Tipo de reunión']
    cols_ok = [c for c in cols_needed if c in _df_m.columns]
    _df_m = _df_m[cols_ok].copy()
    _df_m['_uid'] = _df_m['UDN / Pipeline'].map(UDN_ID_MAP)
    _df_m = _df_m.dropna(subset=['_uid', 'Nombre de la empresa', 'SCIAN_nombre'])

    result = {}
    for uid, inds in industrias_por_udn.items():
        sectores_top = [i['nombre'] for i in inds]
        df_u = _df_m[(_df_m['_uid'] == uid) & (_df_m['SCIAN_nombre'].isin(sectores_top))]
        empresas = []
        _rank_funnel = {'lead': 1, 'mql': 2, 'sql': 3, 'oportunidad': 4, 'valor': 5, 'cliente': 6, None: 0}
        mejores = {}
        for _, row in df_u.iterrows():
            emp = str(row.get('Nombre de la empresa', '')).strip()
            if not emp:
                continue
            valor_raw = str(row.get('Valor', '') or '')
            _etapa_funnel, _fecha_relevante = _clasificar_etapa_funnel(row)
            candidato = {
                'empresa':      emp,
                'sector':       str(row.get('SCIAN_nombre', '')),
                'scian3':       str(row.get('SCIAN_3', '') or ''),
                'subrama':      str(row.get('SCIAN_3_nombre', '') or ''),
                'tipoObjeto':   str(row['Tipo de objeto']) if 'Tipo de objeto' in row.index else '',
                'etapa':        str(row['Estado lead / etapa del negocio / resultado de reunión'].iloc[0] if hasattr(row['Estado lead / etapa del negocio / resultado de reunión'], 'iloc') else row['Estado lead / etapa del negocio / resultado de reunión']) if 'Estado lead / etapa del negocio / resultado de reunión' in row.index else '',

                'generadoPor':  str(row.get('Generado por', '') or ''),
                'fechaCreacion': str(row.get('Fecha creación / reunión', '') or '')[:10],
                'motivoPerdida': str(row.get('Motivo de descalificación / perdido', '') or ''),
                'valor':        valor_raw,
                'fechaPerdido': str(row.get('Fecha Perdido', '') or '')[:10],
                'etapaFunnel':  _etapa_funnel,
                'fechaRelevante': _fecha_relevante,
                **_icp_match(emp, uid, str(row.get('SCIAN_3', '') or '')[:2]),
            }
            actual = mejores.get(emp)
            if actual is None or _rank_funnel.get(_etapa_funnel, 0) >= _rank_funnel.get(actual['etapaFunnel'], 0):
                mejores[emp] = candidato
        empresas = list(mejores.values())
        result[uid] = empresas
        print(f"  empresas_pico {uid}: {len(empresas)} empresas únicas")
    return result


def leer_hubspot_supabase():
    """Lee concentrado_v3 desde caché local o Supabase si no existe."""
    import os
    CACHE_PATH = os.path.join(os.path.dirname(__file__), "data", "supabase_concentrado.parquet")
    if os.path.exists(CACHE_PATH):
        print("  \U0001f4e5 Supabase concentrado_v3 (caché local) \u2026")
        df = pd.read_parquet(CACHE_PATH)
    else:
        from supabase import create_client as _create_client
        _URL = "https://maszpgfnbonwftxobryi.supabase.co"
        _KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hc3pwZ2ZuYm9ud2Z0eG9icnlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQyMDI3NCwiZXhwIjoyMDkyOTk2Mjc0fQ.Pw_Ba5Btnf7VMGhhnAjpSSLCDN3w_cJTQRp-pQw9w7s"
        print("  \U0001f4e5 Supabase concentrado_v3 (descargando) \u2026")
        sb = _create_client(_URL, _KEY)
        rows, page = [], 0
        while True:
            r = sb.table("concentrado_v3").select("*").range(page*1000, page*1000+999).execute()
            if not r.data: break
            rows.extend(r.data)
            page += 1
        df = pd.DataFrame(rows)
        df.to_parquet(CACHE_PATH, index=False)
    df = df.rename(columns={
        "unidad_negocio": "UDN / Pipeline",
        "nombre_empresa": "Nombre de la empresa",
        "tipo_objeto": "Tipo de objeto",
        "fecha": "Fecha creación / reunión",
        "estado": "Estado lead / etapa del negocio / resultado de reunión",
        "motivo_descalificacion_perdido": "Motivo de descalificación / perdido",
        "detalle_descalificacion_perdido": "Detalle de descalificación / Perdido",
        "generado_por": "Generado por",
        "fuente_adquisicion": "Fuente adquisición",
        "contacto_convertido_por": "Contacto convertido por",
        "fuente_conversion": "Fuente conversión",
        "fecha_lead_propuesta": "Fecha Lead / propuesta",
        "fecha_mql_evaluando": "Fecha MQL / evaluando",
        "valor": "Valor",
        "fecha_cerrado": "Fecha de cerrado",
        "fecha_cierre": "Fecha Cierre",
        "fecha_por_facturar": "Fecha Por facturar",
        "fecha_facturado": "Fecha facturado",
        "fecha_perdido": "Fecha Perdido",
        "cargo_negocio_reunion": "Cargo / Nombre del negocio / Nombre de reunión",
        "puesto_tipo_negocio_reunion": "Puesto / Tipo de negocio / Tipo de reunión",
        "propietario": "Propietario del contacto / negocio / reunión creada por",
        "equipo": "Equipo",
        "numero_actividades_venta": "Número de actividades de venta",
        "fecha_ultimo_contacto": "Fecha de último contacto",
        "industria": "Industria",
        "area": "Área",
        "segmento_lead_score": "Segmento de Lead Score",
        "score_interaccion": "Score interacción",
        "score_adecuacion": "Score adecuación",
        "id_registro": "ID de registro",
    })
    print(f"     {len(df):,} filas x {len(df.columns)} cols")
    return df

# ============================================================
# BRÚJULA COMERCIAL — Generador de datos para el frontend
# ============================================================
import os

import os, sys, json, re, math, warnings
import json as _json
from pathlib import Path as _Path
_ICP_PATH = _Path(__file__).parent / "data" / "icp_data.json"
_ICP: dict = _json.loads(_ICP_PATH.read_text(encoding="utf-8")) if _ICP_PATH.exists() else {}

def _normalizar_empresa(s: str) -> str:
    import re as _re
    s = str(s).upper().strip()
    s = _re.sub(r"[^\w\s]", " ", s)
    s = _re.sub(r"\s+", " ", s)
    for sfx in ["SA DE CV","S DE RL","SAPI DE CV","SC","AC","IAP","SA","SRL",
                "DE MEXICO","DE MÉXICO","MEXICO","S A DE C V"]:
        s = _re.sub(rf"\b{sfx}\b", "", s)
    return s.strip()

def _icp_match(empresa: str, udn_id: str, scian_2: str) -> dict:
    """Retorna campos ICP para una empresa dada su UDN y SCIAN_2."""
    perfil = _ICP.get(str(udn_id).strip(), {})
    if not perfil:
        return {}
    key = _normalizar_empresa(empresa)
    cuentas = perfil.get("cuentas_objetivo", [])
    es_co = key in cuentas
    tier = ""
    if es_co:
        tiers = perfil.get("tiers_por_industria", {})
        if tiers:
            tier = list(tiers.keys())[0]
        else:
            tier = "Cuenta Objetivo"
    sc2 = str(scian_2)[:2] if scian_2 else ""
    scian_match = bool(sc2 and sc2 in perfil.get("scian_2_icp", []))
    return {
        "es_cuenta_objetivo": es_co,
        "tier": tier,
        "icp_industria_match": scian_match,
        "decisor": perfil.get("decisor", ""),
    }

import pandas as pd
import numpy as np
from datetime import datetime

warnings.filterwarnings('ignore')
sys.path.insert(0, os.path.dirname(__file__))

from config import (
    SHEET_HUBSPOT_ID, SHEET_HUBSPOT_TAB,
    SHEET_OUTPUT_ID,  SHEET_OUTPUT_TAB,
    COL_EMPRESA, COL_UDN, COL_FECHA,
    UDNS_VALIDAS, IGAE_SECTOR_COLS,
)

try:
    from scian_map_3d import SCIAN_3_NOMBRE
except ImportError:
    SCIAN_3_NOMBRE = {}

SHEET_BUDGET_ID  = "1Xd1CFY4gwxmKV8OHti9a1XjCmO2Q5NtUlGulfgbxtaE"
SHEET_BUDGET_TAB = "Budget GDD 2026 (Escalonado)"

COL_FECHA_LEAD  = "Fecha Lead / propuesta"
COL_GENERADO    = "Generado por"
COL_ESTADO      = "Estado lead / etapa del negocio / resultado de reunión"
COL_ID          = "ID de registro"

UDN_ID_MAP = {
    "UIX":              "UIX",
    "Marketing United": "MU",
    "Promo Espacio":    "PE",
    "Zeus":             "ZU",
    "Neracode":         "NC",
    "House Of Films":   "HOF",
    "Research Land":    "RL",
    "Mexa Creativa":    "MEXA",
}
UDN_COLOR = {
    "UIX": "#8C59FE", "MU": "#DCFF00", "PE": "#FF7600",
    "ZU":  "#61ACAA", "NC": "#3E31CC", "HOF": "#94A3B8",
    "RL":  "#770EB7", "MEXA": "#FD00C7",
}
MES_ES = {
    1:"ene",2:"feb",3:"mar",4:"abr",5:"may",6:"jun",
    7:"jul",8:"ago",9:"sep",10:"oct",11:"nov",12:"dic",
}

BRUJULA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'df_brujula.parquet')


def get_gc():
    import gspread
    from google.oauth2.service_account import Credentials
    scopes = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    sa_json = os.environ.get("SERVICE_ACCOUNT_JSON")
    if sa_json:
        creds = Credentials.from_service_account_info(json.loads(sa_json), scopes=scopes)
    else:
        creds = Credentials.from_service_account_file(
            os.path.join(os.path.dirname(__file__), "credentials.json"), scopes=scopes)
    return gspread.authorize(creds)


def leer_sheet(gc, sheet_id, tab):
    print(f"  📥 {tab} …")
    ws   = gc.open_by_key(sheet_id).worksheet(tab)
    data = ws.get_all_values()
    df   = pd.DataFrame(data[1:], columns=data[0])
    print(f"     {len(df):,} filas × {len(df.columns)} cols")
    return df


def safe(v):
    if v is None:
        return None
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    return v


def fmt_money(v):
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return "$0"
    v = float(v)
    if v >= 1_000_000:
        return f"${v/1_000_000:.1f}M"
    if v >= 1_000:
        return f"${v/1_000:.0f}K"
    return f"${v:.0f}"


def accion_from_temp(t):
    return "llamar" if t == "caliente" else ("prepararse" if t == "templado" else "esperar")


def nombre_corto(s):
    return re.sub(r'^\d[\d\-]*\s+', '', str(s)).strip()


def procesar_brujula_output(df):
    df = df.copy()
    df.columns = [c.strip() for c in df.columns]
    df['fecha']       = pd.to_datetime(df['fecha'], errors='coerce')
    df['yhat']        = pd.to_numeric(df['yhat'], errors='coerce')
    df['z_score']     = pd.to_numeric(df['z_score'], errors='coerce')
    df['es_forecast'] = df['es_forecast'].astype(str).str.lower().isin(['true','1','yes'])
    # Recalcular temperatura con umbrales actuales de config.py
    from config import Z_CALIENTE, Z_TEMPLADO, Z_TIBIO
    def _temp(z):
        if pd.isna(z): return 'frio'
        if z >= Z_CALIENTE:  return 'caliente'
        if z >= Z_TEMPLADO:  return 'templado'
        if z >= Z_TIBIO:     return 'tibio'
        return 'frio'
    df['temperatura'] = df['z_score'].apply(_temp)
    return df[df['fecha'].notna() & df['sector_igae'].notna()].copy()


def procesar_hubspot(df, incluir_sin_empresa=False):
    df = df.copy()
    df.columns = [c.strip() for c in df.columns]
    df = df[df[COL_UDN].isin(UDNS_VALIDAS)].copy()
    if not incluir_sin_empresa:
        df = df[df[COL_EMPRESA].notna() & (df[COL_EMPRESA] != '')].copy()
    return df


def procesar_budget(df):
    UDN_NAMES = {
        'research land':    'RL',  'promo espacio':    'PE',
        'uix':              'UIX', 'zeus':             'ZU',
        'mexa creativa':    'MEXA','house of films':   'HOF',
        'marketing united': 'MU',  'neracode':         'NC',
    }
    budget = {uid: {} for uid in UDN_ID_MAP.values()}
    rows   = [list(r) for _, r in df.iterrows()]

    def parse_num(s):
        if not s or str(s).strip() in ('', '#DIV/0!', 'Sin Registro'):
            return None
        try:
            return float(re.sub(r'[$,\s%]', '', str(s)).strip())
        except:
            return None

    for i, row in enumerate(rows):
        col_a = str(row[0]).strip().lower() if row else ''
        uid   = UDN_NAMES.get(col_a)
        if uid is None:
            continue
        for j in range(1, 20):
            if i + j >= len(rows):
                break
            nr      = rows[i + j]
            metrica = str(nr[0]).strip() if nr else ''
            if metrica.lower() in UDN_NAMES:
                break
            c = parse_num(nr[2] if len(nr) > 2 else '')
            d = parse_num(nr[3] if len(nr) > 3 else '')
            if metrica == 'Proyectos Ganados':
                if c: budget[uid]['meta_proyectos'] = c
                if d: budget[uid]['real_proyectos']  = d
            elif metrica == 'Venta EXT':
                if c: budget[uid]['meta_revenue'] = c
                if d: budget[uid]['real_ytd']     = d
            elif metrica == 'Ticket Promedio':
                if c: budget[uid]['meta_ticket'] = c
                if d: budget[uid]['real_ticket'] = d
            elif metrica == 'Lead':
                if c: budget[uid]['meta_leads']        = c
                if d: budget[uid]['real_leads_budget']  = d

    print(f"  Budget parseado para: {[k for k,v in budget.items() if v]}")
    for uid, b in budget.items():
        if b.get('real_ytd') is not None:
            print(f"    {uid}: Real YTD=${b['real_ytd']:,.0f} | Meta=${b.get('meta_revenue',0):,.0f} | Leads={b.get('real_leads_budget',0)}")
    return budget


def calcular_timing_comercial(df_hs, uid):
    """Calcula % de contactos 2026 en momento IGAE activo (caliente o templado)"""
    try:
        if not os.path.exists(BRUJULA_PATH):
            return {'pct_total':0,'caliente':0,'templado':0,'total':0,'badge':'sin datos','color':'amber'}

        df_b = pd.read_parquet('data/df_brujula.parquet')
        col_udn = 'UDN / Pipeline'
        udn_name = next((k for k,v in UDN_ID_MAP.items() if v == uid), None)
        if not udn_name:
            return {'pct_total':0,'caliente':0,'templado':0,'total':0,'badge':'sin datos','color':'amber'}

        df_u = df_b[df_b[col_udn] == udn_name].copy()
        df_u['fecha_lead'] = pd.to_datetime(df_u['Fecha Lead / propuesta'], errors='coerce')

        # Histórico 2026 completo
        anio_actual = datetime.now().year
        df_2026 = df_u[
            (df_u['fecha_lead'].dt.year == anio_actual) &
            (df_u['temperatura'].notna())
        ]

        total = len(df_2026)
        if total == 0:
            return {'pct_total':0,'caliente':0,'templado':0,'total':0,'badge':'sin datos','color':'amber'}

        n_caliente = int((df_2026['temperatura'] == 'caliente').sum())
        n_templado = int((df_2026['temperatura'] == 'templado').sum())
        n_total_activo = n_caliente + n_templado
        pct = round(n_total_activo / total * 100, 1)

        color = 'green' if pct >= 50 else ('amber' if pct >= 30 else 'red')
        badge = f"{n_total_activo} de {total} contactos"

        return {
            'pct_total': pct,
            'caliente': n_caliente,
            'templado': n_templado,
            'total': total,
            'badge': badge,
            'color': color,
            'pct_caliente': round(n_caliente/total*100,1) if total > 0 else 0,
            'pct_templado': round(n_templado/total*100,1) if total > 0 else 0,
        }
    except Exception as e:
        print(f"  Error timing: {e}")
        return {'pct_total':0,'caliente':0,'templado':0,'total':0,'badge':'sin datos','color':'amber'}



def generar_kpis_historico(df_hs):
    """Genera KPIs por mes para filtro de periodo en frontend"""
    historico = {}

    if not os.path.exists('data/df_brujula.parquet'):
        return historico

    df_b = pd.read_parquet('data/df_brujula.parquet')
    df_b['fecha_lead'] = pd.to_datetime(df_b['Fecha Lead / propuesta'], errors='coerce')

    col_etapa = next((c for c in df_hs.columns if 'etapa' in c.lower() or 'estado lead' in c.lower()), None)

    for nombre_udn, uid in UDN_ID_MAP.items():
        historico[uid] = {}

        # Leads por mes desde df_brujula
        df_u = df_b[df_b['UDN / Pipeline'] == nombre_udn].copy()
        df_u['anio'] = df_u['fecha_lead'].dt.year
        df_u['mes']  = df_u['fecha_lead'].dt.month

        # Agrupar por año-mes
        for (anio, mes), grp in df_u.groupby(['anio', 'mes']):
            if pd.isna(anio) or pd.isna(mes):
                continue
            anio, mes = int(anio), int(mes)
            key = f"{anio}-{mes:02d}"

            total = len(grp)
            con_temp = grp[grp['temperatura'].notna()]
            n_caliente = int((con_temp['temperatura'] == 'caliente').sum())
            n_templado = int((con_temp['temperatura'] == 'templado').sum())
            n_activo   = n_caliente + n_templado
            total_temp = len(con_temp)
            pct_timing = round(n_activo / total_temp * 100, 1) if total_temp > 0 else 0

            historico[uid][key] = {
                'leads': total,
                'timing_activo': n_activo,
                'timing_total': total_temp,
                'pct_timing': pct_timing,
                'anio': anio,
                'mes': mes,
            }

    return historico

def generar_kpis(df_hs, budget):
    kpis = {}

    # Replicar filtros Looker desde HubSpot Repository
    # MBR-Opp: Tipo de objeto = negocio
    # MBR-Ganado: Etapa contains 'ganado' + Fecha Por facturar NOT NULL
    col_tipo      = next((c for c in df_hs.columns if 'tipo' in c.lower() and 'objeto' in c.lower()), None)
    col_etapa     = next((c for c in df_hs.columns if 'etapa' in c.lower() or 'estado lead' in c.lower()), None)
    col_valor_k   = next((c for c in df_hs.columns if c.lower().strip() == 'valor'), None)
    col_fecha_fac = next((c for c in df_hs.columns if 'facturar' in c.lower()), None)

    hs_kpis = {}
    for nombre_udn, uid_k in UDN_ID_MAP.items():
        df_u = df_hs[df_hs[COL_UDN] == nombre_udn].copy()
        # Para YTD usamos todos los registros — el filtro de negocio se aplica solo a proyectos
        df_u_negocio = df_u[df_u[col_tipo].astype(str).str.lower().str.contains('negocio', na=False)].copy() if col_tipo else df_u.copy()
        # Proyectos Ganados = Ganado por facturar OR ya facturados (Fecha facturado no nula)
        col_fecha_facturado = next((c for c in df_u.columns if c.lower().strip() == 'fecha facturado'), None)
        
        # Grupo 1: Ganado por facturar (etapa 5) con Fecha Por facturar no nula en 2026
        df_g1 = pd.DataFrame()
        if col_etapa and col_fecha_fac:
            df_tmp = df_u[df_u[col_etapa].astype(str).str.contains('5. Ganado por facturar', case=False, na=False)]
            df_tmp = df_tmp[df_tmp[col_fecha_fac].notna()]
            fac_dt = pd.to_datetime(df_tmp[col_fecha_fac], dayfirst=True, errors='coerce')
            df_g1  = df_tmp[fac_dt.dt.year == 2026]

        # Grupo 2: Ya facturados (Fecha facturado no nula en 2026)
        df_g2 = pd.DataFrame()
        if col_fecha_facturado:
            df_tmp2 = df_u[df_u[col_fecha_facturado].notna()]
            fac_dt2 = pd.to_datetime(df_tmp2[col_fecha_facturado], dayfirst=True, errors='coerce')
            df_g2   = df_tmp2[fac_dt2.dt.year == 2026]

        # Unir ambos grupos sin duplicados
        # Regla: Fecha facturado en 2026
        col_fecha_fac2 = next((c for c in df_u.columns if c.strip() == 'Fecha facturado'), None)
        ytd = 0; n_proy = 0; ticket = 0
        if col_fecha_fac2 and col_valor_k:
            df_u['_fecha_fac'] = pd.to_datetime(df_u[col_fecha_fac2], dayfirst=True, errors='coerce')
            df_u['_valor']     = pd.to_numeric(
                df_u[col_valor_k].astype(str).str.replace(r'[$,]', '', regex=True),
                errors='coerce'
            )
            df_fac = df_u[df_u['_fecha_fac'].dt.year == 2026]
            vals   = df_fac['_valor'].dropna()
            ytd    = float(vals.sum())
            n_proy = int((vals > 0).sum())
            ticket = float(vals[vals > 0].mean()) if n_proy > 0 else 0
        hs_kpis[uid_k] = {'ytd': ytd, 'proy': n_proy, 'ticket': ticket}
        if ytd > 0:
            print(f"    HS {nombre_udn}: Real YTD=${ytd:,.0f} | Proyectos={n_proy} | Ticket=${ticket:,.0f}")

    for nombre, uid in UDN_ID_MAP.items():
        color = UDN_COLOR[uid]
        b     = budget.get(uid, {})
        hs    = hs_kpis.get(uid, {})
        n_leads    = int(b.get('real_leads_budget', 0) or 0)
        meta_leads = int(b.get('meta_leads', 14000) or 14000)
        real_ytd    = hs.get('ytd') or b.get('real_ytd')
        meta_rev    = b.get('meta_revenue')
        real_proy   = hs.get('proy') or b.get('real_proyectos')
        meta_proy   = b.get('meta_proyectos')
        real_ticket = hs.get('ticket') or b.get('real_ticket')
        meta_ticket = b.get('meta_ticket')
        pct_rev    = round((real_ytd / meta_rev * 100), 1) if real_ytd and meta_rev else 0
        color_ytd  = "green" if pct_rev >= 10 else ("amber" if pct_rev >= 5 else "red")
        pct_proy   = round((real_proy / meta_proy * 100), 1) if real_proy and meta_proy else 0
        badge_proy = f"{'▲' if pct_proy >= 50 else '▼'} {pct_proy:.0f}% avance"
        color_proy = "green" if pct_proy >= 80 else ("amber" if pct_proy >= 50 else "red")
        pct_leads  = round((n_leads / meta_leads * 100), 1) if meta_leads else 0
        badge_leads = f"{'▲' if pct_leads >= 50 else '▼'} {pct_leads:.0f}% vs meta"
        color_leads = "green" if pct_leads >= 80 else ("amber" if pct_leads >= 50 else "red")
        meta_mes    = round(meta_leads / 12)
        dif_ticket  = (real_ticket or 0) - (meta_ticket or 0)
        badge_ticket = f"{'▲' if dif_ticket >= 0 else '▼'} {fmt_money(abs(dif_ticket))} vs meta"
        color_ticket = "green" if dif_ticket >= 0 else ("amber" if dif_ticket > -50000 else "red")
        pct_barra   = min(round(pct_rev * (12 / max(datetime.now().month, 1))), 100)
        # Timing Comercial — contactos en momento IGAE activo
        timing = calcular_timing_comercial(df_hs, uid)

        kpis[uid] = [
            {"label":"Ingresos del Periodo", "valor":fmt_money(real_ytd) if real_ytd else "$0",       "meta":fmt_money(meta_rev) if meta_rev else "$0",  "badge":f"{pct_rev:.1f}% del año", "badgeColor":color_ytd,   "tipo":"moneda", "acento":color},
            {"label":"Proyectos ganados",     "valor":int(real_proy) if real_proy else 0,              "meta":int(meta_proy) if meta_proy else 0,          "badge":badge_proy,                "badgeColor":color_proy,  "tipo":"numero", "acento":color},
            {"label":"Ticket promedio",       "valor":fmt_money(real_ticket) if real_ticket else "$0", "meta":fmt_money(meta_ticket) if meta_ticket else "$0", "badge":badge_ticket,          "badgeColor":color_ticket,"tipo":"moneda", "acento":color},
            {"label":"Leads acumulados",      "valor":f"{n_leads:,}",                                  "meta":f"{meta_leads:,} · mes: {meta_mes:,}",      "badge":badge_leads,               "badgeColor":color_leads, "tipo":"numero", "acento":color},
            {"label":"Timing Comercial",      "valor":f"{timing['pct_total']}%",                       "meta":"",                                          "badge":timing['badge'],           "badgeColor":timing['color'], "tipo":"timing", "acento":color,
             "timingData": timing},
        ]
    return kpis


def generar_temperatura(df_hs, df_forecast):
    temp_por_udn = {}
    if os.path.exists(BRUJULA_PATH):
        df_b = pd.read_parquet(BRUJULA_PATH)
        print(f"  ✅ df_brujula: {len(df_b):,} leads con temperatura real")
        for nombre, uid in UDN_ID_MAP.items():
            df_u   = df_b[df_b['UDN / Pipeline'] == nombre]
            counts = df_u['temperatura'].value_counts()
            temp_por_udn[uid] = {
                "caliente": int(counts.get('caliente', 0)),
                "templado": int(counts.get('templado', 0)),
                "tibio":    int(counts.get('tibio',    0)),
                "frio":     int(counts.get('frio',     0)),
            }
    else:
        print("  ⚠ df_brujula.parquet no encontrado")
        fecha_max = df_forecast[~df_forecast['es_forecast']]['fecha'].max()
        df_temp   = df_forecast[df_forecast['fecha'] == fecha_max][['sector_igae','temperatura']].set_index('sector_igae')
        for nombre, uid in UDN_ID_MAP.items():
            n      = len(df_hs[df_hs[COL_UDN] == nombre])
            counts = df_temp['temperatura'].value_counts(normalize=True)
            temp_por_udn[uid] = {
                "caliente": round(n * float(counts.get('caliente', 0.30))),
                "templado": round(n * float(counts.get('templado', 0.25))),
                "tibio":    round(n * float(counts.get('tibio',    0.25))),
                "frio":     round(n * float(counts.get('frio',     0.20))),
            }
    return temp_por_udn


def generar_industrias(df_hs, df_forecast):
    """
    Top 5 industrias por UDN desde df_brujula.parquet.
    El parquet ya tiene todos los campos: sector_igae, temperatura,
    Generado por, Estado lead, Fecha Lead.
    Solo leads con Fecha Lead no nula. Histórico completo 2023-2026.
    """
    hoy = pd.Timestamp.now()

    import numpy as _np
    _mes_actual = datetime.now().month
    MESES_CAL = [pd.Timestamp(f'2026-{m:02d}-01') for m in range(_mes_actual, 13)]
    df_fut = df_forecast[(df_forecast['es_forecast']) & (df_forecast['fecha'].isin(MESES_CAL))]
    mes_pico_sector = {}
    if len(df_fut):
        for sector, grp in df_fut.groupby('sector_igae'):
            grp_c = grp[grp['fecha'].isin(MESES_CAL)].drop_duplicates('fecha').set_index('fecha')
            z_por_mes = {m: grp_c.loc[m, 'z_score'] if m in grp_c.index else float('nan') for m in MESES_CAL}
            validos = [z for z in z_por_mes.values() if not pd.isna(z)]
            if not validos:
                continue
            p75 = _np.percentile(validos, 75)
            picos = [m for m, z in z_por_mes.items() if not pd.isna(z) and z >= p75]
            f = min(picos) if picos else max(z_por_mes, key=lambda m: z_por_mes[m] if not pd.isna(z_por_mes[m]) else -999)
            mes_pico_sector[sector] = f"{MES_ES[f.month]} {f.year}"

    fecha_max_hist = df_forecast[~df_forecast['es_forecast']]['fecha'].max()
    df_temp_actual = (
        df_forecast[df_forecast['fecha'] == fecha_max_hist]
        [['sector_igae','temperatura']]
        .drop_duplicates('sector_igae')
        .set_index('sector_igae')
    )

    orden_temp = {'caliente':0,'templado':1,'tibio':2,'frio':3}
    industrias_por_udn = {}

    if not os.path.exists(BRUJULA_PATH):
        print("  ⚠ df_brujula.parquet no encontrado")
        for nombre, uid in UDN_ID_MAP.items():
            industrias_por_udn[uid] = []
        return industrias_por_udn

    # Parquet ya tiene todos los campos necesarios
    df_b = pd.read_parquet(BRUJULA_PATH)
    df_leads = df_b.copy()

    print(f"  Leads con Fecha Lead: {len(df_leads):,}")

    for nombre, uid in UDN_ID_MAP.items():
        df_u = df_leads[df_leads['UDN / Pipeline'] == nombre]

        if len(df_u) == 0:
            industrias_por_udn[uid] = []
            continue

        df_u_valid = df_u[df_u['sector_igae'].notna() & (df_u['sector_igae'].astype(str).str.strip() != '')].copy()

        if len(df_u_valid) == 0:
            industrias_por_udn[uid] = []
            continue

        # Asegurar que existan empresas válidas con nombre real antes de meter la industria al Top
        if COL_EMPRESA in df_u_valid.columns:
            df_con_empresa = df_u_valid[
                df_u_valid[COL_EMPRESA].notna() & 
                (~df_u_valid[COL_EMPRESA].astype(str).str.lower().isin(["nan", "", "none"]))
            ]
        else:
            df_con_empresa = df_u_valid

        top = (
            df_u_valid.groupby('sector_igae')
            .size()
            .reset_index(name='leads')
            .sort_values('leads', ascending=False)
            .head(8)
        )

        industrias = []
        for _, row in top.iterrows():
            sector  = row['sector_igae']
            df_sec  = df_u_valid[df_u_valid['sector_igae'] == sector]
            n_leads = int(row['leads'])

            # Comparación exacta con los valores reales del parquet
            if COL_GENERADO in df_sec.columns:
                gen_col = df_sec[COL_GENERADO].fillna('').astype(str).str.strip()
                n_mkt   = int((gen_col == 'Marketing').sum())
                n_com   = int((gen_col == 'Comercial').sum())
            else:
                n_mkt, n_com = 0, 0

            if COL_ESTADO in df_sec.columns:
                est_col    = df_sec[COL_ESTADO].fillna('').astype(str)
                n_perdidos = int(est_col.str.contains(
                    'Descalificado|Perdido|No califica|Cerrada perdida',
                    case=False, na=False
                ).sum())
            else:
                n_perdidos = 0


            # Top 3 empresas reales de la base para este sector/UDN
            top_empresas = []
            try:
                empresas_validas = df_sec[COL_EMPRESA].dropna().astype(str)
                empresas_validas = empresas_validas[~empresas_validas.str.lower().isin(["nan","","none"])]
                top_empresas = empresas_validas.value_counts().head(3).index.tolist()
            except Exception:
                top_empresas = []
            temp  = str(df_temp_actual.loc[sector, 'temperatura']) if sector in df_temp_actual.index else 'frio'
            mes_p = mes_pico_sector.get(sector, 'N/D')

            industrias.append({
                "nombre":         nombre_corto(sector),
                "temperatura":    temp,
                "mesPico":        mes_p,
                "accion":         accion_from_temp(temp),
                "leads":          n_leads,
                "leadsMkt":       n_mkt,
                "leadsComercial": n_com,
                "leadsPerdidos":  n_perdidos,
                "ejemplos":       top_empresas,
            })

        industrias.sort(key=lambda x: (-x['leads'], orden_temp.get(x['temperatura'], 4)))
        industrias_por_udn[uid] = industrias[:5]

        if industrias:
            top1 = industrias[0]
            print(f"  {uid}: {len(df_u):,} leads → {top1['nombre']} ({top1['temperatura']}) "
                  f"Mkt:{top1['leadsMkt']} Com:{top1['leadsComercial']} Perd:{top1['leadsPerdidos']}")

    return industrias_por_udn


def generar_temporalidad(df_forecast, industrias_por_udn):
    all_fechas = sorted(df_forecast['fecha'].unique())
    labels     = [f"{MES_ES[f.month].capitalize()}'{str(f.year)[2:]}" for f in all_fechas]
    temporal   = {}

    for uid, inds in industrias_por_udn.items():
        if not inds:
            temporal[uid] = None
            continue

        sectores_out = []
        for ind in inds[:3]:
            mask = df_forecast['sector_igae'].apply(
                lambda s: ind['nombre'][:12].lower() in s.lower())
            df_s = df_forecast[mask].drop_duplicates('fecha').set_index('fecha')

            if len(df_s) == 0:
                continue

            yhat_max = df_s['yhat'].max()
            if not yhat_max or yhat_max == 0:
                yhat_max = 1

            historico, forecast, pct_max = [], [], []
            for f in all_fechas:
                if f in df_s.index:
                    row   = df_s.loc[f]
                    yhat  = safe(float(row['yhat'])) if pd.notna(row.get('yhat')) else None
                    is_fc = bool(row.get('es_forecast', False))
                    pct   = round((yhat / yhat_max) * 100, 1) if yhat else None
                    historico.append(None if is_fc else yhat)
                    forecast.append(yhat if is_fc else None)
                    pct_max.append(pct)
                else:
                    historico.append(None)
                    forecast.append(None)
                    pct_max.append(None)

            sectores_out.append({
                "nombre":    ind['nombre'],
                "historico": historico,
                "forecast":  forecast,
                "pctMaximo": pct_max,
            })

        temporal[uid] = {"labels": labels, "sectores": sectores_out} if sectores_out else None

    return temporal


def generar_calendario(df_forecast, industrias_por_udn):
    _mes_actual = datetime.now().month
    MESES_CAL = [pd.Timestamp(f'2026-{m:02d}-01') for m in range(_mes_actual, 13)]
    NOMBRES   = [m.upper() for m in ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][_mes_actual-1:12]]

    def estado_relativo(z_scores_mes):
        """
        Ranking relativo: clasifica cada mes vs los otros meses del periodo.
        Siempre genera variedad independientemente del ciclo macro.
        Top 25% → pico, 25-50% → prep, 50-75% → ok, bottom 25% → vacio
        """
        import numpy as np
        zs = list(z_scores_mes.values())
        if not zs or all(pd.isna(z) for z in zs):
            return {m: 'vacio' for m in z_scores_mes}
        zs_valid = [z for z in zs if not pd.isna(z)]
        p75 = np.percentile(zs_valid, 75)
        p50 = np.percentile(zs_valid, 50)
        p25 = np.percentile(zs_valid, 25)
        result = {}
        for mes, z in z_scores_mes.items():
            if pd.isna(z):
                result[mes] = 'vacio'
            elif z >= p75:
                result[mes] = 'pico'
            elif z >= p50:
                result[mes] = 'prep'
            elif z >= p25:
                result[mes] = 'ok'
            else:
                result[mes] = 'vacio'
        return result

    cals = {}
    for uid, inds in industrias_por_udn.items():
        if not inds:
            cals[uid] = None
            continue
        filas = []
        for ind in inds[:6]:
            mask = df_forecast['sector_igae'].apply(
                lambda s: ind['nombre'][:12].lower() in s.lower())
            df_s = df_forecast[mask].drop_duplicates('fecha').set_index('fecha')
            # Recolectar z_scores por mes
            z_por_mes = {}
            for mes in MESES_CAL:
                if mes in df_s.index:
                    z_por_mes[mes] = df_s.loc[mes, 'z_score']
                else:
                    z_por_mes[mes] = float('nan')
            # Ranking relativo
            estados = estado_relativo(z_por_mes)
            celdas = [estados[mes] for mes in MESES_CAL]
            filas.append({"industria": ind['nombre'], "celdas": celdas})
        cals[uid] = {"meses": NOMBRES, "filas": filas}
    return cals


def generar_picos(industrias_por_udn, df_hs=None):
    ACCION_TEXTO = {
        'caliente': 'Contactar ahora a prospectos identificados',
        'templado': 'Preparar propuesta y presentar',
        'tibio':    'Calificar leads y agendar demos',
        'frio':     'Monitorear señales del sector',
    }
    # Subramas por (UDN, sector) desde df_maestro
    subrama_lookup = {}
    try:
        _df_m = pd.read_parquet(os.path.join(os.path.dirname(__file__), 'data', 'df_maestro.parquet'))
        if "SCIAN_3" in _df_m.columns and "SCIAN_nombre" in _df_m.columns:
            _df_m = _df_m[["UDN / Pipeline", "SCIAN_nombre", "SCIAN_3"]].dropna(
                subset=["SCIAN_3", "SCIAN_nombre"])
            _df_m["SCIAN_3"] = _df_m["SCIAN_3"].astype(str).str.strip()
            _df_m = _df_m[_df_m["SCIAN_3"] != "nan"]
            for (udn, sector), grp in _df_m.groupby(["UDN / Pipeline", "SCIAN_nombre"]):
                uid_k = UDN_ID_MAP.get(udn)
                if not uid_k:
                    continue
                sector_short = nombre_corto(sector)[:20].lower()
                counts = grp["SCIAN_3"].value_counts().head(5)
                subrama_lookup[(uid_k, sector_short)] = [
                    {"scian3": code, "nombre": SCIAN_3_NOMBRE.get(code, code), "leads": int(cnt)}
                    for code, cnt in counts.items()
                ]
    except Exception as e:
        print(f"  ⚠ subramas no disponibles: {e}")

    result = {}
    for uid, inds in industrias_por_udn.items():
        rows = []
        for i in inds[:5]:
            key = (uid, i['nombre'][:20].lower())
            rows.append({
                "industria":   i['nombre'],
                "temperatura": i['temperatura'],
                "mesPico":     i['mesPico'],
                "accion":      ACCION_TEXTO.get(i['temperatura'], 'Monitorear'),
                "leadsEnBase": i['leads'],
                "subramas":    subrama_lookup.get(key, []),
            })
        result[uid] = rows
    return result


def generar_rescue(df_hs, industrias_por_udn):
    # Cargar SCIAN_nombre desde df_maestro
    try:
        import os
        _cols_m = ["Nombre de la empresa", "SCIAN_nombre"]
        _df_m   = pd.read_parquet(os.path.join(os.path.dirname(__file__), 'data', 'df_maestro.parquet'))
        if "SCIAN_3" in _df_m.columns:
            _cols_m.append("SCIAN_3")
        _df_m      = _df_m[_cols_m].drop_duplicates("Nombre de la empresa")
        scian_map  = _df_m.set_index("Nombre de la empresa")["SCIAN_nombre"].to_dict()
        scian3_map = _df_m.set_index("Nombre de la empresa")["SCIAN_3"].to_dict() if "SCIAN_3" in _df_m.columns else {}
    except Exception:
        scian_map  = {}
        scian3_map = {}
    SCIAN_IGAE_MAP = {
        "Manufactura": "Industrias manufactureras",
        "Manufactura — Alimentos": "Industrias manufactureras",
        "Manufactura — Metálica y maquinaria": "Industrias manufactureras",
        "Manufactura — Química y plásticos": "Industrias manufactureras",
        "Manufactura — Textil y calzado": "Industrias manufactureras",
        "Servicios profesionales y TI": "Servicios profesionales, científicos y técnicos",
        "Transportes y logística": "Transportes, correos y almacenamiento",
        "Servicios de salud": "Servicios de salud y de asistencia social",
        "Entretenimiento y esparcimiento": "Servicios de esparcimiento culturales y deportivos, y otros servicios recreativos",
    }
    scian_map = {k: SCIAN_IGAE_MAP.get(v, v) for k, v in scian_map.items()}
    # Cargar forecast histórico con percentiles por mes calendario (mismo mes vs años anteriores)
    try:
        import numpy as np
        df_fc = pd.read_parquet("data/df_forecast.parquet")[["fecha","sector_igae","z_score"]]
        df_fc = df_fc[df_fc["z_score"].notna()].copy()
        df_fc["sector_clean"] = df_fc["sector_igae"].str.replace(r"^\d+[-\d]*\s+", "", regex=True)
        df_fc["ym"] = df_fc["fecha"].dt.to_period("M").astype(str)
        df_fc["mes"] = df_fc["fecha"].dt.month
        fase_hist = {}
        for sector, grp in df_fc.groupby("sector_clean"):
            for mes, grp_mes in grp.groupby("mes"):
                p75 = np.percentile(grp_mes["z_score"], 75)
                p50 = np.percentile(grp_mes["z_score"], 50)
                p25 = np.percentile(grp_mes["z_score"], 25)
                for _, r in grp_mes.iterrows():
                    z = r["z_score"]
                    if z >= p75:   fase = "caliente"
                    elif z >= p50: fase = "templado"
                    elif z >= p25: fase = "tibio"
                    else:          fase = "frio"
                    fase_hist[(sector, r["ym"])] = fase
    except Exception:
        fase_hist = {}
    estados_perd = ['perd', 'no califica', 'descalif', 'cerrada', 'cancelad', 'lost']

    # Lookup mesPico por nombre de industria
    mes_pico_lookup = {}
    for uid_inds in industrias_por_udn.values():
        for ind in uid_inds:
            nombre = ind.get('nombre', '')
            mes = ind.get('mesPico', 'N/D')
            if nombre and mes != 'N/D':
                mes_pico_lookup[nombre.lower()[:20]] = mes

    # Detectar columnas dinámicamente
    cols = df_hs.columns.tolist()
    col_motivo    = next((c for c in cols if 'motivo' in c.lower()), None)
    col_fecha_mql = next((c for c in cols if 'fecha' in c.lower() and 'mql' in c.lower()), None)
    col_valor     = next((c for c in cols if c.lower().strip() == 'valor'), None)
    col_ind       = next((c for c in cols if 'industria' in c.lower()), None)
    col_generado  = next((c for c in cols if 'generado' in c.lower()), None)
    col_fecha_cre = next((c for c in cols if 'creaci' in c.lower() and 'fecha' in c.lower()), None)
    col_estado    = next((c for c in cols if any(x in c.lower() for x in ['estado lead','etapa','resultado'])), None)

    MES_NUM = {'ene':1,'feb':2,'mar':3,'abr':4,'may':5,'jun':6,
               'jul':7,'ago':8,'sep':9,'oct':10,'nov':11,'dic':12}
    hoy = pd.Timestamp.now()

    rescue = {}
    for nombre_udn, uid in UDN_ID_MAP.items():
        df_u = df_hs[df_hs[COL_UDN] == nombre_udn].copy()

        if col_estado:
            mask = df_u[col_estado].astype(str).str.lower().str.contains(
                '|'.join(estados_perd), na=False)
            df_perd = df_u[mask]
        else:
            df_perd = df_u.head(0)

        rows = []
        seen = set()
        for _, row in df_perd.iterrows():
            empresa = str(row.get(COL_EMPRESA, '') or '').strip()
            if not empresa or empresa.lower() in ('nan', '') or empresa in seen:
                continue
            seen.add(empresa)

            # Industria real del lead
            ind_raw = ''
            if col_ind:
                v = row.get(col_ind, '')
                ind_raw = str(v).strip() if v and not pd.isna(v) else ''
            if ind_raw.lower() == 'nan':
                ind_raw = ''

            # mesPico por industria real
            mes_pico = 'N/D'
            key_ind  = ind_raw.lower()[:20]
            for key, mes in mes_pico_lookup.items():
                if key and (key in key_ind or key_ind in key):
                    mes_pico = mes
                    break

            # Motivo real de descalificación
            motivo = ''
            if col_motivo:
                m = row.get(col_motivo, '')
                motivo = str(m).strip() if m and not pd.isna(m) else ''
            if not motivo or motivo == 'nan':
                motivo = 'Sin registro'

            # Fecha MQL / evaluando
            fecha_perd = ''
            if col_fecha_mql:
                fp = row.get(col_fecha_mql)
                try:
                    if fp and not pd.isna(fp):
                        fecha_perd = pd.Timestamp(fp).strftime('%b %Y').lower()
                except Exception:
                    fecha_perd = ''

            # Valor real
            valor = 0
            if col_valor:
                v = row.get(col_valor, 0)
                try:
                    valor = int(float(str(v).replace(',', '').replace('$', '') or 0)) if v and not pd.isna(v) else 0
                except Exception:
                    valor = 0

            # Acción según distancia al pico
            accion = 'esperar'
            if mes_pico != 'N/D':
                try:
                    partes = mes_pico.lower().split()
                    m_num  = MES_NUM.get(partes[0], 0)
                    yr     = int(partes[1])
                    diff   = (yr - hoy.year) * 12 + m_num - hoy.month
                    if diff <= 1:
                        accion = 'llamar'
                    elif diff <= 3:
                        accion = 'prepararse'
                except Exception:
                    accion = 'esperar'

            _s3   = str(scian3_map.get(empresa, "")).strip()
            _snom = SCIAN_3_NOMBRE.get(_s3, "") if _s3 and _s3 != "nan" else ""
            rows.append({
                "empresa":        empresa,
                "industria":      scian_map.get(empresa, ind_raw) or 'Sin industria',
                "scian3":         _s3 if _s3 != "nan" else "",
                "subrama":        _snom,
                "motivoPerdida":  motivo,
                "detallePerdida": str(row.get('Detalle de descalificación / Perdido', '') or row.get('detalle_descalificacion_perdido', '') or '').strip(),
                "fechaPerdido":   fecha_perd,
                "valor":          valor,
                "mesPico":        mes_pico,
                "generadoPor":    str(row.get(col_generado, "") or "").strip() if col_generado else "",
                "fechaCreacion":  pd.Timestamp(row.get(col_fecha_cre)).strftime("%b %Y").lower() if col_fecha_cre and row.get(col_fecha_cre) and not pd.isna(row.get(col_fecha_cre)) else "",
                "faseAlContactar": (lambda ym: fase_hist.get((scian_map.get(empresa, ind_raw), ym), "") if ym >= "2026-04" else "")(pd.Timestamp(row.get(col_fecha_cre)).strftime("%Y-%m") if col_fecha_cre and row.get(col_fecha_cre) and not pd.isna(row.get(col_fecha_cre)) else ""),
                "accion":         accion,
            })

        rows.sort(key=lambda r: r['valor'], reverse=True)
        rescue[uid] = rows[:300]
    return rescue



UDN_NOMBRE_MAP = {v: k for k, v in UDN_ID_MAP.items()}

def _clasificar_etapa_funnel(row):
    """Clasifica una fila en una etapa del funnel (Lead/MQL/SQL/Oportunidad/Valor/Cliente)
    y devuelve la fecha relevante para esa etapa. Aislado del IGAE — solo se usa en
    empresas_pico / Cross-sell, nunca en generar_temperatura/industrias/calendario."""
    def _get(col):
        v = row.get(col)
        if v is None:
            return None
        try:
            if pd.isna(v):
                return None
        except Exception:
            pass
        s = str(v).strip()
        return s if s and s.lower() != 'nan' else None

    tipo_obj = (_get('Tipo de objeto') or '').lower()
    etapa    = (_get('Estado lead / etapa del negocio / resultado de reunión') or '')
    puesto   = (_get('Puesto / Tipo de negocio / Tipo de reunión') or '').lower()

    fecha_lead      = _get('Fecha Lead / propuesta')
    fecha_mql       = _get('Fecha MQL / evaluando')
    fecha_creacion  = _get('Fecha creación / reunión')
    fecha_facturado = _get('Fecha facturado')
    fecha_por_fact  = _get('Fecha Por facturar')

    es_contacto = 'contacto' in tipo_obj
    es_negocio  = 'negocio' in tipo_obj
    es_reunion  = 'reuni' in tipo_obj

    # Cliente ($ y #) — mismo filtro base, Negocio + Fecha facturado no nula
    if es_negocio and fecha_facturado:
        return ('cliente', fecha_facturado[:10])

    # Valor — Negocio, usa Fecha Por facturar (sin requerir facturado aun)
    if es_negocio and fecha_por_fact:
        return ('valor', fecha_por_fact[:10])

    # Oportunidad — Negocio, Fecha creacion/reunion
    if es_negocio and fecha_creacion:
        return ('oportunidad', fecha_creacion[:10])

    # SQL — Reunion, Puesto/Tipo = Credenciales, Etapa = Completada
    if es_reunion and 'credencial' in puesto and etapa.lower() == 'completada' and fecha_creacion:
        return ('sql', fecha_creacion[:10])

    # MQL — Contacto, Fecha MQL/evaluando no nula
    if es_contacto and fecha_mql:
        return ('mql', fecha_mql[:10])

    # Lead — Contacto, Fecha Lead/propuesta no nula
    if es_contacto and fecha_lead:
        return ('lead', fecha_lead[:10])

    return (None, None)


def generar_empresas_pico(df_hs, industrias_por_udn):
    """Empresas reales de HubSpot por UDN x sector para la tabla expandible."""
    try:
        _df_m = pd.read_parquet(os.path.join(os.path.dirname(__file__), 'data', 'df_maestro.parquet'))
    except Exception as e:
        print(f"  ⚠ empresas_pico no disponible: {e}")
        return {}

    cols_needed = ['Nombre de la empresa', 'UDN / Pipeline', 'SCIAN_nombre', 'SCIAN_3', 'SCIAN_3_nombre', 'Tipo de objeto', 'Estado lead / etapa del negocio / resultado de reunión',
                   'Generado por', 'Fecha creación / reunión', 'Motivo de descalificación / perdido',
                   'Valor', 'Fecha Perdido', 'Estado lead / etapa del negocio / resultado de reunión',
                   'Fecha Lead / propuesta', 'Fecha MQL / evaluando', 'Fecha Por facturar', 'Fecha facturado',
                   'Puesto / Tipo de negocio / Tipo de reunión']
    cols_ok = [c for c in cols_needed if c in _df_m.columns]
    _df_m = _df_m[cols_ok].copy()
    _df_m['_uid'] = _df_m['UDN / Pipeline'].map(UDN_ID_MAP)
    _df_m = _df_m.dropna(subset=['_uid', 'Nombre de la empresa', 'SCIAN_nombre'])

    result = {}
    for uid, inds in industrias_por_udn.items():
        sectores_top = [i['nombre'] for i in inds]
        df_u = _df_m[(_df_m['_uid'] == uid) & (_df_m['SCIAN_nombre'].isin(sectores_top))]
        empresas = []
        _rank_funnel = {'lead': 1, 'mql': 2, 'sql': 3, 'oportunidad': 4, 'valor': 5, 'cliente': 6, None: 0}
        mejores = {}
        for _, row in df_u.iterrows():
            emp = str(row.get('Nombre de la empresa', '')).strip()
            if not emp:
                continue
            valor_raw = str(row.get('Valor', '') or '')
            _etapa_funnel, _fecha_relevante = _clasificar_etapa_funnel(row)
            candidato = {
                'empresa':      emp,
                'sector':       str(row.get('SCIAN_nombre', '')),
                'scian3':       str(row.get('SCIAN_3', '') or ''),
                'subrama':      str(row.get('SCIAN_3_nombre', '') or ''),
                'tipoObjeto':   str(row['Tipo de objeto']) if 'Tipo de objeto' in row.index else '',
                'etapa':        str(row['Estado lead / etapa del negocio / resultado de reunión'].iloc[0] if hasattr(row['Estado lead / etapa del negocio / resultado de reunión'], 'iloc') else row['Estado lead / etapa del negocio / resultado de reunión']) if 'Estado lead / etapa del negocio / resultado de reunión' in row.index else '',

                'generadoPor':  str(row.get('Generado por', '') or ''),
                'fechaCreacion': str(row.get('Fecha creación / reunión', '') or '')[:10],
                'motivoPerdida': str(row.get('Motivo de descalificación / perdido', '') or ''),
                'valor':        valor_raw,
                'fechaPerdido': str(row.get('Fecha Perdido', '') or '')[:10],
                'etapaFunnel':  _etapa_funnel,
                'fechaRelevante': _fecha_relevante,
                **_icp_match(emp, uid, str(row.get('SCIAN_3', '') or '')[:2]),
            }
            actual = mejores.get(emp)
            if actual is None or _rank_funnel.get(_etapa_funnel, 0) >= _rank_funnel.get(actual['etapaFunnel'], 0):
                mejores[emp] = candidato
        empresas = list(mejores.values())
        result[uid] = empresas
        print(f"  empresas_pico {uid}: {len(empresas)} empresas únicas")
    return result


def leer_hubspot_supabase():
    """Lee concentrado_v3 desde caché local o Supabase si no existe."""
    import os
    CACHE_PATH = os.path.join(os.path.dirname(__file__), 'data', 'supabase_concentrado.parquet')
    if os.path.exists(CACHE_PATH):
        print("  📥 Supabase concentrado_v3 (caché local) …")
        df_raw = pd.read_parquet(CACHE_PATH)
    else:
        from supabase import create_client as _create_client
        _URL = "https://maszpgfnbonwftxobryi.supabase.co"
        _KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hc3pwZ2ZuYm9ud2Z0eG9icnlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQyMDI3NCwiZXhwIjoyMDkyOTk2Mjc0fQ.Pw_Ba5Btnf7VMGhhnAjpSSLCDN3w_cJTQRp-pQw9w7s"
        print("  📥 Supabase concentrado_v3 (descargando) …")
        sb = _create_client(_URL, _KEY)
        rows, page = [], 0
        while True:
            r = sb.table("concentrado_v3").select("*").range(
                page * 1000, page * 1000 + 999
            ).execute()
            if not r.data:
                break
            rows.extend(r.data)
            page += 1
        df_raw = pd.DataFrame(rows)
        df_raw.to_parquet(CACHE_PATH, index=False)
    df = df_raw.rename(columns={
        "unidad_negocio":                  "UDN / Pipeline",
        "nombre_empresa":                  "Nombre de la empresa",
        "tipo_objeto":                     "Tipo de objeto",
        "fecha":                           "Fecha creación / reunión",
        "estado":                          "Estado lead / etapa del negocio / resultado de reunión",
        "motivo_descalificacion_perdido":  "Motivo de descalificación / perdido",
        "detalle_descalificacion_perdido": "Detalle de descalificación / Perdido",
        "generado_por":                    "Generado por",
        "fuente_adquisicion":              "Fuente adquisición",
        "contacto_convertido_por":         "Contacto convertido por",
        "fuente_conversion":               "Fuente conversión",
        "fecha_lead_propuesta":            "Fecha Lead / propuesta",
        "fecha_mql_evaluando":             "Fecha MQL / evaluando",
        "valor":                           "Valor",
        "fecha_cerrado":                   "Fecha de cerrado",
        "fecha_cierre":                    "Fecha Cierre",
        "fecha_por_facturar":              "Fecha Por facturar",
        "fecha_facturado":                 "Fecha facturado",
        "fecha_perdido":                   "Fecha Perdido",
        "cargo_negocio_reunion":           "Cargo / Nombre del negocio / Nombre de reunión",
        "puesto_tipo_negocio_reunion":     "Puesto / Tipo de negocio / Tipo de reunión",
        "propietario":                     "Propietario del contacto / negocio / reunión creada por",
        "equipo":                          "Equipo",
        "numero_actividades_venta":        "Número de actividades de venta",
        "fecha_ultimo_contacto":           "Fecha de último contacto",
        "industria":                       "Industria",
        "area":                            "Área",
        "segmento_lead_score":             "Segmento de Lead Score",
        "score_interaccion":               "Score interacción",
        "score_adecuacion":                "Score adecuación",
        "id_registro":                     "ID de registro",
    })
    print(f"     {len(df):,} filas × {len(df.columns)} cols")
    return df


def generar_ceguera(df_hs):
    """% de campos vacíos por UDN desde el universo completo de Supabase (parquet raw)."""
    import os
    CACHE_PATH = os.path.join(os.path.dirname(__file__), 'data', 'supabase_concentrado.parquet')
    BRUJULA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'df_brujula.parquet')
    df_brujula = pd.read_parquet(BRUJULA_PATH) if os.path.exists(BRUJULA_PATH) else pd.DataFrame()
    df_raw = pd.read_parquet(CACHE_PATH) if os.path.exists(CACHE_PATH) else pd.DataFrame()
    UDN_MAP = {
        'UIX': 'UIX', 'Marketing United': 'MU', 'Promo Espacio': 'PE',
        'Zeus': 'ZU', 'Neracode': 'NC', 'House Of Films': 'HOF',
        'Research Land': 'RL', 'Mexa Creativa': 'MEXA',
    }
    CAMPOS_CONTACTO = [
        ('nombre_empresa', 'empresa'),
        ('industria',      'industria'),
    ]
    # Cobertura SCIAN post-match desde df_brujula
    scian_cobertura = {}
    if not df_brujula.empty and 'UDN / Pipeline' in df_brujula.columns:
        UDN_MAP_INV = {v: k for k, v in {
            'UIX': 'UIX', 'Marketing United': 'MU', 'Promo Espacio': 'PE',
            'Zeus': 'ZU', 'Neracode': 'NC', 'House Of Films': 'HOF',
            'Research Land': 'RL', 'Mexa Creativa': 'MEXA',
        }.items()}
        for uid, nombre in UDN_MAP_INV.items():
            df_b = df_brujula[df_brujula['UDN / Pipeline'] == nombre]
            if len(df_b) == 0: continue
            vacio = df_b['SCIAN_nombre'].isna() | (df_b['SCIAN_nombre'].astype(str).str.strip() == '') | (df_b['SCIAN_nombre'].astype(str) == 'nan')
            scian_cobertura[uid] = round((~vacio).mean(), 4)
    CAMPOS_NEGOCIO = [
        ('motivo_descalificacion_perdido',  'motivoPerdida'),
        ('detalle_descalificacion_perdido', 'detallePerdida'),
    ]
    def vacio_rate(df_obj, col):
        if col not in df_obj.columns or len(df_obj) == 0: return 1.0
        v = df_obj[col].isna() | (df_obj[col].astype(str).str.strip() == '') | (df_obj[col].astype(str) == 'nan')
        return round(v.sum() / len(df_obj), 4)
    resultado = {}
    for udn_nombre, uid in UDN_MAP.items():
        df_u = df_raw[df_raw['unidad_negocio'] == udn_nombre]
        df_contactos = df_u[df_u['tipo_objeto'] == 'contacto']
        df_negocios  = df_u[df_u['tipo_objeto'] == 'negocio']
        if len(df_u) == 0:
            continue
        resultado[uid] = {
            'total': len(df_u),
            'totalContactos': len(df_contactos),
            'totalNegocios': len(df_negocios),
            'scianCobertura': scian_cobertura.get(uid, 0),
            'campos': [
                {'key': key, 'vacio': vacio_rate(df_contactos, col), 'objeto': 'contacto'}
                for col, key in CAMPOS_CONTACTO
            ] + [
                {'key': key, 'vacio': vacio_rate(df_negocios, col), 'objeto': 'negocio'}
                for col, key in CAMPOS_NEGOCIO
            ],
        }
    return resultado

def main():
    print("\n" + "="*55)
    print("  BRÚJULA COMERCIAL — Generador de datos JSON")
    print("="*55 + "\n")

    gc = get_gc()

    print("1. Leyendo fuentes…")
    df_out_raw = leer_sheet(gc, SHEET_OUTPUT_ID,  SHEET_OUTPUT_TAB)
    df_hs_raw  = leer_hubspot_supabase()          # ← migrado de Google Sheets a Supabase
    df_bud_raw = leer_sheet(gc, SHEET_BUDGET_ID,  SHEET_BUDGET_TAB)

    print("\n2. Procesando…")
    df_forecast = procesar_brujula_output(df_out_raw)
    df_hs       = procesar_hubspot(df_hs_raw)
    df_hs_ytd   = procesar_hubspot(df_hs_raw, incluir_sin_empresa=True)
    budget      = procesar_budget(df_bud_raw)

    print(f"  Forecast: {len(df_forecast):,} filas, {df_forecast['sector_igae'].nunique()} sectores")
    print(f"  HubSpot:  {len(df_hs):,} registros válidos")
    print(f"  Parquet:  {'✅ encontrado' if os.path.exists(BRUJULA_PATH) else '⚠ no encontrado'}")

    print("\n3. Generando secciones…")
    kpis         = generar_kpis(df_hs_ytd, budget)
    kpis_historico = generar_kpis_historico(df_hs)
    temperatura  = generar_temperatura(df_hs, df_forecast)
    industrias   = generar_industrias(df_hs, df_forecast)
    # Sectores para temporalidad: donde cada UDN perdio por timing/presupuesto
    df_b_temp = pd.read_parquet(BRUJULA_PATH) if os.path.exists(BRUJULA_PATH) else None
    industrias_timing = sectores_por_timing(df_b_temp) if df_b_temp is not None else industrias
    temporalidad = generar_temporalidad(df_forecast, industrias_timing)
    calendario   = generar_calendario(df_forecast, industrias)
    picos        = generar_picos(industrias, df_hs)
    empresas_pico = generar_empresas_pico(df_hs, industrias)
    

    rescue       = generar_rescue(df_hs, industrias)
    df_b_ins = pd.read_parquet(BRUJULA_PATH) if os.path.exists(BRUJULA_PATH) else pd.DataFrame()
    insights_udn = generar_insights_udn(df_b_ins, industrias) if len(df_b_ins) > 0 else {}

    data = {
        "meta": {
            "generado_en":               datetime.utcnow().isoformat() + "Z",
            "ultima_actualizacion_igae": df_forecast[~df_forecast['es_forecast']]['fecha'].max().strftime('%Y-%m'),
            "fecha_actualizacion_inegi": "23 de junio de 2026",
            "proxima_actualizacion_inegi": "23 de julio de 2026",
            "total_leads":               len(df_hs),
        },
        "kpis":         kpis,
        "kpis_historico": kpis_historico,
        "temperatura":  temperatura,
        "industrias":   industrias,
        "temporalidad": temporalidad,
        "calendario":   calendario,
        "picos":        picos,
        "empresas_pico": empresas_pico,
        "rescue":       rescue,
        "ceguera":      generar_ceguera(df_hs),
        "insights":     insights_udn,
    }

    out_dir  = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'brujula_data.json')

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, default=str, indent=2)

    size_kb = os.path.getsize(out_path) / 1024
    print(f"\n✅ JSON: {out_path} ({size_kb:.1f} KB)")

    sample = kpis.get('MU', [])
    if sample:
        print(f"\n  Muestra MU KPIs:")
        for k in sample:
            print(f"    {k['label']}: {k['valor']} (meta: {k['meta']})")

    print("\n" + "="*55)
    print("  ✅ Completado")
    print("="*55 + "\n")


if __name__ == "__main__":
    main()
