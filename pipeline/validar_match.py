"""
validar_match.py — Prueba de validación estadística del pipeline de match

Propósito:
  Generar evidencia objetiva de que las industrias asignadas son correctas.
  Produce un reporte CSV para revisión manual + métricas automáticas de confianza.

Uso:
  python validar_match.py
  → Genera: pipeline/data/validacion_muestra.csv   (para revisión manual)
  → Genera: pipeline/data/validacion_reporte.txt   (métricas automáticas)

Flujo de validación:
  1. Muestra aleatoria estratificada por fuente (50 por fuente = ~200 total)
  2. Para cada registro: muestra empresa, industria asignada, fuente, score
  3. El revisor agrega columna 'correcto' (1/0) en Excel
  4. El script calcula precision por fuente y da semáforo de confianza
"""

import pandas as pd
import numpy as np
import os
from datetime import datetime

MAESTRO_PATH    = "data/df_maestro.parquet"
MUESTRA_PATH    = "data/validacion_muestra.csv"
REPORTE_PATH    = "data/validacion_reporte.txt"

MUESTRA_POR_FUENTE = 50   # registros a samplear por cada fuente


def generar_muestra():
    """Genera el CSV para revisión manual."""
    print("── Generando muestra para validación ──")

    df = pd.read_parquet(MAESTRO_PATH)
    df['SCIAN_2'] = df['SCIAN_2'].replace('None', np.nan)

    # Solo registros que tienen SCIAN asignado
    df_con = df[df['SCIAN_2'].notna()].copy()

    # Columnas relevantes para el revisor
    COLS = [
        'ID de registro',
        'Nombre de la empresa',
        'nombre_norm',
        'UDN / Pipeline',
        'Industria',         # campo original de Apollo/HubSpot
        'SCIAN_2',
        'SCIAN_nombre',
        'fuente_scian',
        'Match_Score',
    ]
    cols_presentes = [c for c in COLS if c in df_con.columns]
    df_muestra_frames = []

    fuentes = df_con['fuente_scian'].dropna().unique()
    print(f"  Fuentes encontradas: {list(fuentes)}")

    for fuente in fuentes:
        df_f = df_con[df_con['fuente_scian'] == fuente]
        n    = min(MUESTRA_POR_FUENTE, len(df_f))
        muestra = df_f[cols_presentes].sample(n=n, random_state=42)
        muestra['fuente_validar'] = fuente
        df_muestra_frames.append(muestra)
        print(f"  {fuente}: {len(df_f):,} total → muestra de {n}")

    df_final = pd.concat(df_muestra_frames, ignore_index=True)
    df_final = df_final.sort_values(['fuente_scian', 'SCIAN_nombre'])

    # Columna vacía para que el revisor llene en Excel
    df_final['correcto']       = ''   # revisor pone 1 (correcto) o 0 (incorrecto)
    df_final['industria_real'] = ''   # revisor pone la industria correcta si es 0
    df_final['notas']          = ''

    df_final.to_csv(MUESTRA_PATH, index=False, encoding='utf-8-sig')
    print(f"\n✅ Muestra guardada en: {MUESTRA_PATH}")
    print(f"   {len(df_final)} registros para revisar manualmente")
    print(f"\n📋 Instrucciones para el revisor:")
    print(f"   1. Abre {MUESTRA_PATH} en Excel/Sheets")
    print(f"   2. Para cada fila, busca la empresa en Google (30 segundos)")
    print(f"   3. Llena 'correcto': 1 si la industria es correcta, 0 si no")
    print(f"   4. Si es 0, escribe la industria correcta en 'industria_real'")
    print(f"   5. Guarda y ejecuta: python validar_match.py --calcular")

    return df_final


def calcular_precision():
    """
    Calcula precisión por fuente con los datos ya revisados.
    Ejecutar DESPUÉS de que el revisor llenó la columna 'correcto'.
    """
    if not os.path.exists(MUESTRA_PATH):
        print(f"❌ No se encontró {MUESTRA_PATH}")
        print(f"   Primero ejecuta: python validar_match.py")
        return

    df = pd.read_csv(MUESTRA_PATH, encoding='utf-8-sig')

    # Solo filas donde 'correcto' fue llenado
    df_rev = df[df['correcto'].astype(str).str.strip().isin(['0', '1'])].copy()
    df_rev['correcto'] = df_rev['correcto'].astype(int)

    if len(df_rev) == 0:
        print("⚠ No hay filas validadas todavía. Llena la columna 'correcto' en el CSV.")
        return

    print("=" * 60)
    print("  REPORTE DE VALIDACIÓN DE MATCH")
    print(f"  Generado: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)

    lineas = []
    lineas.append(f"REPORTE DE VALIDACIÓN DE MATCH")
    lineas.append(f"Generado: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
    lineas.append(f"Total registros revisados: {len(df_rev)}\n")

    # ── Precisión por fuente ──────────────────────────────────
    print(f"\nRegistros revisados: {len(df_rev)}\n")
    print("── Precisión por fuente ──")
    lineas.append("── Precisión por fuente ──")

    resultados = []
    for fuente, grp in df_rev.groupby('fuente_scian'):
        n       = len(grp)
        n_ok    = grp['correcto'].sum()
        prec    = n_ok / n * 100
        semaforo = '🟢' if prec >= 85 else ('🟡' if prec >= 70 else '🔴')
        linea = f"  {semaforo} {fuente:<30} {n_ok:>3}/{n:<3} = {prec:>6.1f}%"
        print(linea)
        lineas.append(linea)
        resultados.append({'fuente': fuente, 'precision': prec, 'n': n, 'n_ok': n_ok})

    # ── Precisión global ──────────────────────────────────────
    prec_global = df_rev['correcto'].mean() * 100
    semaforo_g  = '🟢' if prec_global >= 85 else ('🟡' if prec_global >= 70 else '🔴')
    linea_g = f"\n  {semaforo_g} GLOBAL: {df_rev['correcto'].sum()}/{len(df_rev)} = {prec_global:.1f}%"
    print(linea_g)
    lineas.append(linea_g)

    # ── Errores más frecuentes ────────────────────────────────
    df_err = df_rev[df_rev['correcto'] == 0].copy()
    if len(df_err) > 0:
        print(f"\n── Errores más frecuentes ({len(df_err)} total) ──")
        lineas.append(f"\n── Errores más frecuentes ──")
        # Agrupar por SCIAN asignado incorrecto
        if 'SCIAN_nombre' in df_err.columns:
            errores = df_err['SCIAN_nombre'].value_counts().head(10)
            for sector, n in errores.items():
                linea = f"  {sector}: {n} errores"
                print(linea)
                lineas.append(linea)

    # ── Cobertura total del maestro ───────────────────────────
    df_maestro = pd.read_parquet(MAESTRO_PATH)
    df_maestro['SCIAN_2'] = df_maestro['SCIAN_2'].replace('None', np.nan)
    total      = len(df_maestro)
    con_scian  = df_maestro['SCIAN_2'].notna().sum()
    cobertura  = con_scian / total * 100

    lineas.append(f"\n── Cobertura total del maestro ──")
    lineas.append(f"  Total leads:  {total:,}")
    lineas.append(f"  Con SCIAN:    {con_scian:,} ({cobertura:.1f}%)")
    lineas.append(f"  Sin SCIAN:    {total-con_scian:,} ({100-cobertura:.1f}%)")

    print(f"\n── Cobertura del maestro ──")
    print(f"  Total leads:  {total:,}")
    print(f"  Con SCIAN:    {con_scian:,}  ({cobertura:.1f}%)")
    print(f"  Sin SCIAN:    {total-con_scian:,}  ({100-cobertura:.1f}%)")

    # ── Recomendación ─────────────────────────────────────────
    print(f"\n── Interpretación ──")
    lineas.append(f"\n── Interpretación ──")

    if prec_global >= 85:
        msg = "✅ CONFIABLE — Las industrias son correctas en ≥85% de los casos.\n   Puedes escribir los resultados a HubSpot con confianza."
    elif prec_global >= 70:
        msg = "🟡 ACEPTABLE — Precisión >70%. Revisar las fuentes con semáforo rojo\n   antes de escribir a HubSpot. Considera agregar más entradas al catálogo."
    else:
        msg = "🔴 REVISAR — Precisión <70%. Identificar la fuente con más errores\n   y corregir el mapeo o los umbrales antes de continuar."

    print(f"  {msg}")
    lineas.append(f"  {msg}")

    # ── Guardar reporte ───────────────────────────────────────
    with open(REPORTE_PATH, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lineas))

    print(f"\n✅ Reporte guardado en: {REPORTE_PATH}")

    return resultados


def generar_output_hubspot():
    """
    Genera el CSV listo para importar a HubSpot vía API o importación manual.
    Solo incluye registros con fuente de alta confianza.
    Ejecutar DESPUÉS de validar y confirmar precisión ≥85%.
    """
    print("── Generando output para HubSpot ──")

    FUENTES_CONFIABLES = ['catalogo_marcas', 'denue_match', 'mapeo_hubspot', 'mapeo_industria_hs']

    df = pd.read_parquet(MAESTRO_PATH)
    df['SCIAN_2'] = df['SCIAN_2'].replace('None', np.nan)

    df_export = df[
        df['SCIAN_2'].notna() &
        df['fuente_scian'].isin(FUENTES_CONFIABLES)
    ][['ID de registro', 'Nombre de la empresa', 'SCIAN_2', 'SCIAN_nombre', 'fuente_scian']].copy()

    # Renombrar para HubSpot
    df_export = df_export.rename(columns={
        'ID de registro':  'hs_object_id',       # ID de HubSpot
        'SCIAN_nombre':    'industria_scian',     # nombre del nuevo campo custom
        'SCIAN_2':         'scian_codigo',        # código SCIAN
    })

    OUTPUT_HS = "data/hubspot_update_industrias.csv"
    df_export.to_csv(OUTPUT_HS, index=False, encoding='utf-8-sig')

    print(f"✅ {len(df_export):,} registros listos para actualizar en HubSpot")
    print(f"   Guardado en: {OUTPUT_HS}")
    print(f"\n📋 Para importar a HubSpot:")
    print(f"   1. Crea propiedad custom 'industria_scian' (tipo texto) en HubSpot")
    print(f"   2. Ve a Contactos/Empresas → Importar → Actualizar registros existentes")
    print(f"   3. Usa hs_object_id como clave de match")
    print(f"   4. Mapea 'industria_scian' al campo custom que creaste")

    return df_export


if __name__ == "__main__":
    import sys

    if "--calcular" in sys.argv:
        calcular_precision()
    elif "--hubspot" in sys.argv:
        generar_output_hubspot()
    else:
        # Paso 1: generar muestra para revisión manual
        generar_muestra()
        print("\n─────────────────────────────────────────────────────")
        print("PRÓXIMOS PASOS:")
        print("  1. Abre pipeline/data/validacion_muestra.csv en Excel")
        print("  2. Llena la columna 'correcto' para cada fila (1=bien, 0=mal)")
        print("  3. Ejecuta: python validar_match.py --calcular")
        print("  4. Si precisión ≥85%: python validar_match.py --hubspot")
        print("─────────────────────────────────────────────────────")
