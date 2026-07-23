# ============================================================
# BRÚJULA COMERCIAL — Pipeline principal (incremental)
# ============================================================
import os
import sys
import pandas as pd
import gspread
from google.oauth2.service_account import Credentials
import json

sys.path.insert(0, os.path.dirname(__file__))

from config import (
    FORZAR_PROPHET,
    SHEET_HUBSPOT_ID, SHEET_HUBSPOT_TAB,
    SHEET_IGAE_ID, SHEET_IGAE_TAB,
    SHEET_OUTPUT_ID, SHEET_OUTPUT_TAB,
    COL_EMPRESA, COL_UDN, COL_TIPO, COL_ESTADO, UDNS_VALIDAS,
    OUTPUT_FORECAST, OUTPUT_BRUJULA, OUTPUT_MAESTRO,
    DENUE_PARQUET,
)
from match_denue      import run_match
from zscore_igae      import wide_to_long, calcular_zscore, build_df_brujula
from forecast_prophet import entrenar_forecast


# ── Auth ──────────────────────────────────────────────────────
def get_gspread_client():
    scopes = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/drive",
    ]
    sa_json = os.environ.get("SERVICE_ACCOUNT_JSON")
    if sa_json:
        info = json.loads(sa_json)
        creds = Credentials.from_service_account_info(info, scopes=scopes)
    else:
        cred_path = os.path.join(os.path.dirname(__file__), "credentials.json")
        creds = Credentials.from_service_account_file(cred_path, scopes=scopes)
    return gspread.authorize(creds)


# ── Sheets helpers ────────────────────────────────────────────
def leer_sheet(client, sheet_id: str, tab: str) -> pd.DataFrame:
    print(f"  📥 Leyendo Sheet {sheet_id[:20]}… tab={tab}")
    sh   = client.open_by_key(sheet_id)
    ws   = sh.worksheet(tab)
    data = ws.get_all_values()
    df   = pd.DataFrame(data[1:], columns=data[0])
    print(f"     {len(df):,} filas × {len(df.columns)} columnas")
    return df


def escribir_output(client, df: pd.DataFrame, sheet_id: str, tab: str):
    if not sheet_id:
        print("  ⚠ SHEET_OUTPUT_ID vacío — saltando escritura")
        return
    sh = client.open_by_key(sheet_id)
    try:
        ws = sh.worksheet(tab)
        ws.clear()
    except gspread.WorksheetNotFound:
        ws = sh.add_worksheet(title=tab, rows=5000, cols=30)
    df_str = df.astype(str).replace('nan', '')
    ws.update([df_str.columns.tolist()] + df_str.values.tolist())
    print(f"  ✅ Escrito en Sheets: {len(df):,} filas")


# ── Drive helpers ─────────────────────────────────────────────
def get_drive_service():
    from google.oauth2.service_account import Credentials as SACredentials
    from googleapiclient.discovery import build
    scopes = ["https://www.googleapis.com/auth/drive"]
    sa_json = os.environ.get("SERVICE_ACCOUNT_JSON")
    if sa_json:
        info = json.loads(sa_json)
        creds = SACredentials.from_service_account_info(info, scopes=scopes)
    else:
        cred_path = os.path.join(os.path.dirname(__file__), "credentials.json")
        creds = SACredentials.from_service_account_file(cred_path, scopes=scopes)
    return build("drive", "v3", credentials=creds)


def descargar_parquet_drive(drive_service, folder_id: str, filename: str, output_path: str):
    from googleapiclient.http import MediaIoBaseDownload
    results = drive_service.files().list(
        q=f"name='{filename}' and '{folder_id}' in parents",
        fields="files(id, name, size)"
    ).execute()
    files = results.get("files", [])
    if not files:
        print(f"  ❌ {filename} no encontrado en Drive")
        return False
    file_id = files[0]["id"]
    size_mb = int(files[0].get("size", 0)) / 1024 / 1024
    print(f"  📥 Descargando {filename} ({size_mb:.1f} MB)…")
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    request = drive_service.files().get_media(fileId=file_id)
    fh = open(output_path, 'wb')
    downloader = MediaIoBaseDownload(fh, request, chunksize=10*1024*1024)
    done = False
    while not done:
        status, done = downloader.next_chunk()
        print(f"     {int(status.progress() * 100)}%")
    fh.close()
    print(f"  ✅ {filename} guardado")
    return True


def subir_parquet_drive(drive_service, folder_id: str, filename: str, local_path: str):
    from googleapiclient.http import MediaFileUpload
    results = drive_service.files().list(
        q=f"name='{filename}' and '{folder_id}' in parents",
        fields="files(id)"
    ).execute()
    files = results.get("files", [])
    media = MediaFileUpload(local_path, mimetype='application/octet-stream')
    if files:
        drive_service.files().update(fileId=files[0]["id"], media_body=media).execute()
    else:
        metadata = {'name': filename, 'parents': [folder_id]}
        drive_service.files().create(body=metadata, media_body=media).execute()
    print(f"  ✅ {filename} subido a Drive")


# ── Filtrado HubSpot ──────────────────────────────────────────
def filtrar_hubspot(df: pd.DataFrame) -> pd.DataFrame:
    # Igual que Colab — NO filtrar por tipo de objeto
    df_f = df[df[COL_UDN].notna()].copy()
    df_f = df_f[df_f[COL_UDN].isin(UDNS_VALIDAS)].copy()
    df_f = df_f[df_f[COL_ESTADO].notna()].copy()
    df_f = df_f[df_f[COL_EMPRESA].notna() & (df_f[COL_EMPRESA] != '')].copy()
    print(f"  Filtrado: {len(df_f):,} registros válidos")
    print(f"  Por tipo:")
    print(df_f[COL_TIPO].value_counts().to_string())
    return df_f


# ── Match incremental ─────────────────────────────────────────
def match_incremental(df_hubspot: pd.DataFrame, drive_service, folder_id: str) -> pd.DataFrame:
    MATCH_HISTORICO = "data/resultado_match_denue.parquet"
    MATCH_FILENAME  = "resultado_match_denue.parquet"

    tiene_historico = descargar_parquet_drive(
        drive_service, folder_id, MATCH_FILENAME, MATCH_HISTORICO
    )

    if tiene_historico:
        df_historico   = pd.read_parquet(MATCH_HISTORICO)
        ids_procesados = set(df_historico['ID de registro'].astype(str).tolist())
        print(f"  Histórico: {len(df_historico):,} leads ya procesados")
    else:
        df_historico   = pd.DataFrame()
        ids_procesados = set()

    df_hubspot['ID de registro'] = df_hubspot['ID de registro'].astype(str)
    df_nuevos = df_hubspot[~df_hubspot['ID de registro'].isin(ids_procesados)].copy()
    print(f"  Leads nuevos a procesar: {len(df_nuevos):,}")

    if len(df_nuevos) == 0:
        print("  ✅ No hay leads nuevos — actualizando campos críticos")

    if not os.path.exists(DENUE_PARQUET):
        print("  ❌ denue_nacional.parquet no encontrado en data/")
        print("     Descargando desde Drive (solo esta vez)…")
        descargar_parquet_drive(drive_service, folder_id, "denue_nacional.parquet", DENUE_PARQUET)

    df_nuevos_match = run_match(df_nuevos)

    # Actualizar campos críticos del histórico con datos frescos del Sheet
    CAMPOS_ACT = [
        'Valor', 'Fecha Por facturar', 'Fecha facturado',
        'Estado lead / etapa del negocio / resultado de reunión',
        'Propietario del contacto / negocio / reunión creada por',
        'Equipo', 'Fecha de cerrado', 'Fecha Cierre', 'Fecha Perdido',
        'Cargo / Nombre del negocio / Nombre de reunión',
    ]
    if len(df_historico) > 0:
        df_hs_idx = df_hubspot.set_index("ID de registro")
        for campo in CAMPOS_ACT:
            if campo in df_historico.columns and campo in df_hubspot.columns:
                mask_nan = df_historico[campo].isna() | (df_historico[campo].astype(str).str.strip() == "nan")
                ids_nan  = df_historico.loc[mask_nan, "ID de registro"].astype(str)
                ids_ok   = ids_nan[ids_nan.isin(df_hs_idx.index)]
                ids_ok   = ids_ok[df_hs_idx.loc[ids_ok, campo].notna().values]
                if len(ids_ok) > 0:
                    idx_h = df_historico[df_historico["ID de registro"].astype(str).isin(ids_ok)].index
                    df_historico.loc[idx_h, campo] = df_hs_idx.loc[ids_ok.values, campo].values
        print("  ✅ Campos criticos actualizados en historico")


    if len(df_nuevos) > 0 and len(df_historico) > 0:
        df_maestro = pd.concat([df_historico, df_nuevos_match], ignore_index=True)
    elif len(df_nuevos) > 0:
        df_maestro = df_nuevos_match
    else:
        df_maestro = df_historico

    df_maestro = df_maestro.astype(str)
    df_maestro.to_parquet(MATCH_HISTORICO, index=False)
    print(f"  ✅ Maestro actualizado: {len(df_maestro):,} leads totales")

    subir_parquet_drive(drive_service, folder_id, MATCH_FILENAME, MATCH_HISTORICO)

    return df_maestro


# ── Main ──────────────────────────────────────────────────────
def main():
    print("\n" + "="*55)
    print("  BRÚJULA COMERCIAL — Pipeline incremental")
    print("="*55 + "\n")

    os.makedirs("data", exist_ok=True)

    # 1. Auth
    print("1. Autenticando…")
    gc    = get_gspread_client()
    drive = get_drive_service()

    from config import DRIVE_FOLDER_ID, IGAE_SECTOR_COLS

    # 2. Leer HubSpot
    print("\n2. Leyendo HubSpot Concentrado_V3…")
    df_raw     = leer_sheet(gc, SHEET_HUBSPOT_ID, SHEET_HUBSPOT_TAB)
    df_hubspot = filtrar_hubspot(df_raw)

    # 3. Leer IGAE
    print("\n3. Leyendo IGAE desestacionalizado…")
    IGAE_LOCAL = "data/igae_indice.xlsx"
    descargar_parquet_drive(drive, DRIVE_FOLDER_ID, "igae_indice.xlsx", IGAE_LOCAL)

    import openpyxl
    wb   = openpyxl.load_workbook(IGAE_LOCAL, read_only=True, data_only=True)
    ws   = wb['IGAE-indice']
    rows = list(ws.iter_rows(values_only=True))

    print(f"  Total filas: {len(rows)}")
    print(f"  Fila 4 primeros 15: {rows[4][:15]}")
    print(f"  Fila 5 primeros 15: {rows[5][:15]}")
    print(f"  Fila 6 primeros 5:  {rows[6][:5]}")

    MES_MAP = {
        'ENE':'01','FEB':'02','MAR':'03','ABR':'04',
        'MAY':'05','JUN':'06','JUL':'07','AGO':'08',
        'SEP':'09','OCT':'10','NOV':'11','DIC':'12'
    }

    headers = []
    anio_actual = None
    for a, m in zip(rows[4], rows[5]):
        if a is not None:
            try:
                anio_actual = int(float(str(a).strip()))
            except (ValueError, TypeError):
                pass
        if m is not None and anio_actual is not None:
            mes_num = MES_MAP.get(str(m).strip().upper())
            if mes_num:
                headers.append(f"{anio_actual}-{mes_num}")
            else:
                headers.append(None)
        else:
            headers.append(None)

    cols_fecha = [h for h in headers[2:] if h is not None]
    print(f"  Headers generados: {len(headers)} total, {len(cols_fecha)} fechas")
    print(f"  Primeras 5 fechas: {cols_fecha[:5]}")
    print(f"  Últimas 3 fechas: {cols_fecha[-3:]}")

    data_rows = []
    for row in rows[6:]:
        if not row or len(row) < 2:
            continue
        sector = row[1] if row[1] is not None else (row[0] if row[0] is not None else None)
        if sector is None:
            continue
        valores = list(row[2:len(cols_fecha)+2])
        while len(valores) < len(cols_fecha):
            valores.append(None)
        data_rows.append([str(sector).strip()] + valores)

    print(f"  data_rows: {len(data_rows)} sectores")
    if data_rows:
        print(f"  Primera fila len: {len(data_rows[0])}")

    df_igae_raw = pd.DataFrame(data_rows, columns=['sector_igae'] + cols_fecha)
    print(f"  IGAE shape: {df_igae_raw.shape}")

    df_igae = df_igae_raw.melt(id_vars='sector_igae', var_name='fecha_str', value_name='valor_indice')
    df_igae['fecha'] = pd.to_datetime(df_igae['fecha_str'], format='%Y-%m', errors='coerce')
    df_igae = df_igae[df_igae['fecha'].notna() & df_igae['valor_indice'].notna()].copy()
    df_igae['valor_indice'] = pd.to_numeric(df_igae['valor_indice'], errors='coerce')
    df_igae = df_igae[df_igae['valor_indice'].notna()].copy()
    df_igae_z = calcular_zscore(df_igae)
    print(f"  IGAE long: {len(df_igae):,} filas, {df_igae['sector_igae'].nunique()} sectores")

    # 4. Match incremental
    print("\n4. Match incremental HubSpot × DENUE…")
    df_maestro = match_incremental(df_hubspot, drive, DRIVE_FOLDER_ID)
    df_maestro.to_parquet(OUTPUT_MAESTRO, index=False)

    # Mapear SCIAN_2 → nombre sector IGAE con override especial
    from config import IGAE_SECTOR_COLS, SCIAN_IGAE_OVERRIDE
    df_maestro['SCIAN_2_igae'] = (
        df_maestro['SCIAN_2']
        .astype(str)
        .str.replace('.0', '', regex=False)
        .str.strip()
        .replace(SCIAN_IGAE_OVERRIDE)  # 32,33→31 / 49→48
    )
    df_maestro['sector_igae'] = df_maestro['SCIAN_2_igae'].map(IGAE_SECTOR_COLS)
    print(f"  Leads con sector_igae mapeado: {df_maestro['sector_igae'].notna().sum():,}")

    # 5. Z-scores
    print("\n5. Cruzando con Z-scores IGAE…")
    df_brujula = build_df_brujula(df_maestro, df_igae_z)
    df_brujula.to_parquet(OUTPUT_BRUJULA, index=False)

    # 6. Prophet — solo si hay datos IGAE nuevos
    print("\n6. Verificando si Prophet necesita re-entrenarse…")
    FORECAST_LOCAL   = "data/df_forecast_cache.parquet"
    necesita_prophet = True

    descargado_forecast = descargar_parquet_drive(
        drive, DRIVE_FOLDER_ID, "df_forecast.parquet", FORECAST_LOCAL
    )
    if descargado_forecast and os.path.exists(FORECAST_LOCAL):
        df_forecast_prev  = pd.read_parquet(FORECAST_LOCAL)
        fecha_igae_max    = df_igae['fecha'].max()
        if 'fecha' in df_forecast_prev.columns:
            fecha_forecast_max = pd.to_datetime(df_forecast_prev['fecha']).max()
            if not FORZAR_PROPHET and fecha_igae_max <= fecha_forecast_max:
                print(f"  ✅ IGAE sin cambios ({fecha_igae_max.strftime('%Y-%m')}) — reutilizando forecast")
                df_forecast      = df_forecast_prev
                necesita_prophet = False

    if necesita_prophet:
        print("  🔄 Entrenando Prophet…")
        df_forecast = entrenar_forecast(df_igae)
        df_forecast.to_parquet(OUTPUT_FORECAST, index=False)
    else:
        df_forecast.to_parquet(OUTPUT_FORECAST, index=False)

    # 7. Output a Sheets
    print("\n7. Escribiendo output a Google Sheets…")
    df_out = df_forecast[[
        'fecha', 'sector_igae', 'yhat', 'yhat_lower', 'yhat_upper',
        'z_score', 'temperatura', 'es_forecast'
    ]].copy()
    df_out['fecha'] = df_out['fecha'].dt.strftime('%Y-%m-%d')
    from datetime import datetime
    df_out['fecha_actualizacion'] = datetime.now().strftime('%Y-%m-%d %H:%M')
    escribir_output(gc, df_out, SHEET_OUTPUT_ID, SHEET_OUTPUT_TAB)

    # 8. Subir outputs a Drive
    print("\n8. Subiendo outputs a Drive…")
    subir_parquet_drive(drive, DRIVE_FOLDER_ID, "df_forecast.parquet", OUTPUT_FORECAST)
    subir_parquet_drive(drive, DRIVE_FOLDER_ID, "df_brujula.parquet",  OUTPUT_BRUJULA)

    print("\n" + "="*55)
    print("  ✅ Pipeline completado")
    print("="*55 + "\n")


if __name__ == "__main__":
    main()