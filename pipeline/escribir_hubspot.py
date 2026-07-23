"""
escribir_hubspot.py — Escribe industria_inegi en contactos de HubSpot
utilizando MULTITHREADING (Hilos en paralelo) + BATCH (Lotes de 100).
Incluye sistema de checkpoints indestructible para recuperación de fallos.
"""
import pandas as pd
import requests
import time
import argparse
import os
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

TOKEN    = "pat-na1-f7180643-21fc-4da5-a91e-7928af1d96ed"
PARQUET  = os.path.join(os.path.dirname(__file__), "data", "df_maestro.parquet")
LOG_PATH = os.path.join(os.path.dirname(__file__), "data", "hubspot_write_log.csv")
HEADERS  = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

# Lock global para escribir de forma segura en el CSV desde múltiples hilos
log_lock = threading.Lock()

def chunk_dataframe(df, size=100):
    for i in range(0, len(df), size):
        yield df.iloc[i:i + size]

def guardar_logs_checkpoint(nuevos_logs):
    """Guarda de forma segura los logs combinando con el histórico."""
    with log_lock:
        if os.path.exists(LOG_PATH):
            try:
                df_viejos = pd.read_csv(LOG_PATH)
                df_nuevos = pd.DataFrame(nuevos_logs)
                # Evitar duplicaciones eliminando si ya existía el ID
                df_viejos = df_viejos[~df_viejos["id"].astype(str).isin(df_nuevos["id"].astype(str))]
                df_final = pd.concat([df_viejos, df_nuevos], ignore_index=True)
            except:
                df_final = pd.DataFrame(nuevos_logs)
        else:
            df_final = pd.DataFrame(nuevos_logs)
        
        df_final.to_csv(LOG_PATH, index=False)

def procesar_lote_hilo(chunk):
    """Función que ejecutará cada hilo de manera independiente."""
    inputs = []
    batch_logs = []
    
    sample_tipo = chunk.iloc[0].get("Tipo de objeto", "contacto")
    endpoint = "contacts" if sample_tipo == "contacto" else "deals"

    for _, row in chunk.iterrows():
        id_reg  = str(row["ID de registro"])
        scian   = str(row["SCIAN_nombre"])
        empresa = str(row.get("Nombre de la empresa", ""))

        inputs.append({"id": id_reg, "properties": {"industria_inegi": scian}})
        batch_logs.append({
            "id": id_reg, "empresa": empresa, "scian": scian, 
            "status": "pending", "ts": datetime.now().isoformat()
        })

    try:
        r = requests.post(
            f"https://api.hubapi.com/crm/v3/objects/{endpoint}/batch/update",
            headers=HEADERS, json={"inputs": inputs}, timeout=15
        )
        if r.status_code == 200:
            for log in batch_logs: log["status"] = "ok"
            status_res = "SUCCESS"
        else:
            for log in batch_logs: log["status"] = f"error_{r.status_code}"
            status_res = f"ERROR_{r.status_code}"
    except Exception as e:
        for log in batch_logs: log["status"] = "exception"
        status_res = "TIMEOUT/DISCONNECT"

    # Checkpoint inmediato: guarda este lote al terminar la petición
    guardar_logs_checkpoint(batch_logs)
    return len(inputs), status_res

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workers", type=int, default=4, help="Número de hilos simultáneos")
    parser.add_argument("--limit",   type=int, default=None)
    args = parser.parse_args()

    if not os.path.exists(PARQUET):
        print(f"❌ No se encontró el archivo maestro en {PARQUET}")
        return

    df = pd.read_parquet(PARQUET)
    df = df[df["SCIAN_nombre"].notna() & (df["ID de registro"].notna()) & (df["Tipo de objeto"] == "contacto")].copy()
    df["ID de registro"] = df["ID de registro"].astype(str)

    total_universo = len(df)

    # Buscar Checkpoints anteriores (Cruce inteligente)
    ids_procesados_ok = set()
    if os.path.exists(LOG_PATH):
        try:
            df_logs_previos = pd.read_csv(LOG_PATH)
            if not df_logs_previos.empty and "id" in df_logs_previos.columns:
                df_ok = df_logs_previos[df_logs_previos["status"] == "ok"]
                ids_procesados_ok = set(df_ok["id"].astype(str))
                print(f"📌 Checkpoint Detectado: {len(ids_procesados_ok):,} registros ya están OK en HubSpot.")
        except Exception as e:
            print(f"⚠ Alerta al leer logs: {e}. Iniciando limpio.")

    # Filtrar solo el remanente (lo que falta, sin importar en qué posición delDF esté)
    df_pendiente = df[~df["ID de registro"].isin(ids_procesados_ok)].copy()
    
    if args.limit:
        df_pendiente = df_pendiente.head(args.limit)

    total_pendiente = len(df_pendiente)

    print(f"\n{'='*60}")
    print(f"🚀 BRÚJULA COMERCIAL — ESCRITURA EN PARALELO POR HILOS")
    print(f"{'='*60}")
    print(f"  Universo Base:     {total_universo:,}")
    print(f"  Ya Completados:    {len(ids_procesados_ok):,}")
    print(f"  POR PROCESAR:      {total_pendiente:,}")
    print(f"  Hilos Activos:     {args.workers} (Mapeando en ráfagas)")
    print(f"{'='*60}\n")

    if total_pendiente == 0:
        print("🎉 ¡Excelente! Cero pendientes acumulados.")
        return

    # Dividir el remanente en bloques de 100
    lotes = list(chunk_dataframe(df_pendiente, size=100))
    
    procesados = 0
    print(f"📬 Repartiendo {len(lotes)} lotes entre los {args.workers} hilos...")

    # Ejecución concurrente
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futuros = {executor.submit(procesar_lote_hilo, lote): lote for lote in lotes}
        
        for futuro in as_completed(futuros):
            try:
                cantidad, estado = futuro.result()
                procesados += cantidad
                print(f"  [Progress] {procesados:,}/{total_pendiente:,} registros transferidos | Lote: {estado}")
            except Exception as exc:
                print(f"  ❌ Un lote generó una falla crítica en el hilo: {exc}")

    print(f"\n{'='*60}")
    print(f"  🏁 Ciclo finalizado. Revisa tu archivo: data/hubspot_write_log.csv")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
