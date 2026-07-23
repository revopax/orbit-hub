"""
auto_validar.py — Validación automática del pipeline con Groq/Llama
────────────────────────────────────────────────────────────────────
En lugar de que un humano revise manualmente las 200 filas,
este script le pregunta a Groq si cada asignación es correcta.

Uso:
    python3 auto_validar.py
    python3 auto_validar.py --calcular      (después de que corra el auto-review)
    python3 auto_validar.py --hubspot       (si precisión ≥ 85%)

Requiere: GROQ_API_KEY en config.py o variable de entorno GROQ_API_KEY
"""
import argparse
import os
import time
import pandas as pd
import numpy as np
from pathlib import Path

MUESTRA_PATH  = "data/validacion_muestra.csv"
REPORTE_PATH  = "data/validacion_reporte.csv"
HUBSPOT_PATH  = "data/hubspot_update_industrias.csv"
MAESTRO_PATH  = "data/df_maestro.parquet"

GROQ_MODEL    = "llama3-8b-8192"
BATCH_DELAY   = 0.3   # segundos entre llamadas para no exceder rate limit


def get_groq_client():
    try:
        from config import GROQ_API_KEY
    except ImportError:
        GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY no configurado en config.py ni en variables de entorno")
    from groq import Groq
    return Groq(api_key=GROQ_API_KEY)


def validar_con_groq(cliente, empresa: str, industria: str, fuente: str) -> tuple[int, str]:
    """
    Pregunta a Groq si la industria asignada es correcta para la empresa.
    Devuelve (correcto: 0|1, razon: str)
    """
    prompt = f"""Eres un experto en clasificación industrial SCIAN de México.
Te doy el nombre de una empresa y la industria que el sistema le asignó.
Responde SOLO con este formato exacto (nada más):
CORRECTO: 1
RAZON: [una línea explicando por qué]

O si es incorrecto:
CORRECTO: 0
INDUSTRIA_REAL: [la industria SCIAN correcta]
RAZON: [una línea explicando por qué]

Empresa: {empresa}
Industria asignada: {industria}
Fuente del match: {fuente}"""

    try:
        resp = cliente.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=100,
        )
        texto = resp.choices[0].message.content.strip()

        correcto    = 1 if "CORRECTO: 1" in texto else 0
        razon       = ""
        ind_real    = ""

        for linea in texto.split("\n"):
            if linea.startswith("RAZON:"):
                razon = linea.replace("RAZON:", "").strip()
            if linea.startswith("INDUSTRIA_REAL:"):
                ind_real = linea.replace("INDUSTRIA_REAL:", "").strip()

        return correcto, ind_real or industria, razon

    except Exception as e:
        return -1, "", f"Error Groq: {e}"


def auto_review():
    if not Path(MUESTRA_PATH).exists():
        print(f"❌ No se encontró {MUESTRA_PATH}")
        print("   Primero corre: python3 validar_match.py")
        return

    df = pd.read_csv(MUESTRA_PATH)

    # Solo procesar filas sin revisión previa
    if 'correcto' not in df.columns:
        df['correcto']      = np.nan
        df['industria_real']= ""
        df['razon_groq']    = ""
    
    pendientes = df[df['correcto'].isna()].index.tolist()
    total_pend = len(pendientes)

    if total_pend == 0:
        print("✅ Todas las filas ya tienen revisión. Corre --calcular")
        return

    print(f"── Validación automática con Groq ──")
    print(f"   Filas a revisar: {total_pend}")
    print(f"   Modelo: {GROQ_MODEL}\n")

    cliente = get_groq_client()
    ok = 0
    errores = 0

    for i, idx in enumerate(pendientes, 1):
        empresa   = str(df.at[idx, 'empresa'])
        industria = str(df.at[idx, 'SCIAN_nombre'])
        fuente    = str(df.at[idx, 'fuente_scian'])

        correcto, ind_real, razon = validar_con_groq(cliente, empresa, industria, fuente)

        if correcto == -1:
            errores += 1
            print(f"  [{i:3}/{total_pend}] ⚠  {empresa[:35]:<35} — error API")
        else:
            df.at[idx, 'correcto']       = correcto
            df.at[idx, 'industria_real'] = ind_real
            df.at[idx, 'razon_groq']     = razon
            estado = "✅" if correcto == 1 else "❌"
            print(f"  [{i:3}/{total_pend}] {estado} {empresa[:35]:<35} → {industria[:30]}")

        if i % 10 == 0:
            df.to_csv(MUESTRA_PATH, index=False)
            print(f"     💾 Guardado parcial ({i}/{total_pend})")

        time.sleep(BATCH_DELAY)

    df.to_csv(MUESTRA_PATH, index=False)
    revisadas = df['correcto'].notna().sum()
    correctas = (df['correcto'] == 1).sum()

    print(f"\n✅ Auto-validación completada")
    print(f"   Revisadas: {revisadas} / {total_pend}")
    print(f"   Correctas: {correctas} ({correctas/revisadas*100:.1f}%)")
    print(f"   Errores API: {errores}")
    print(f"\n➡  Corre ahora: python3 auto_validar.py --calcular")


def calcular_precision():
    if not Path(MUESTRA_PATH).exists():
        print(f"❌ No se encontró {MUESTRA_PATH}")
        return

    df = pd.read_csv(MUESTRA_PATH)
    revisadas = df[df['correcto'].notna()].copy()

    if len(revisadas) == 0:
        print("❌ No hay filas revisadas todavía. Corre primero sin --calcular")
        return

    print("\n" + "=" * 55)
    print("  REPORTE DE PRECISIÓN — Pipeline de industrias")
    print("=" * 55)

    total_rev = len(revisadas)
    total_ok  = (revisadas['correcto'] == 1).sum()
    precision_global = total_ok / total_rev * 100

    semaforo = "🟢" if precision_global >= 85 else ("🟡" if precision_global >= 70 else "🔴")
    print(f"\nPrecisión global: {precision_global:.1f}%  {semaforo}")
    print(f"Revisadas: {total_rev} | Correctas: {total_ok} | Incorrectas: {total_rev - total_ok}")

    print(f"\nPor fuente:")
    print(f"{'Fuente':<25} {'N':>5} {'Correctas':>10} {'Precisión':>10} {'Estado':>8}")
    print("-" * 60)

    reporte_rows = []
    for fuente, grupo in revisadas.groupby('fuente_scian'):
        n         = len(grupo)
        correctas = (grupo['correcto'] == 1).sum()
        prec      = correctas / n * 100
        sem       = "🟢" if prec >= 85 else ("🟡" if prec >= 70 else "🔴")
        print(f"  {fuente:<23} {n:>5} {correctas:>10} {prec:>9.1f}%  {sem}")
        reporte_rows.append({
            'fuente': fuente, 'n': n,
            'correctas': correctas, 'precision': round(prec, 1)
        })

    pd.DataFrame(reporte_rows).to_csv(REPORTE_PATH, index=False)
    print(f"\n📄 Reporte guardado en: {REPORTE_PATH}")

    if precision_global >= 85:
        print(f"\n✅ Precisión suficiente → listo para HubSpot")
        print(f"   Ejecuta: python3 auto_validar.py --hubspot")
    else:
        print(f"\n⚠  Precisión baja — revisa las filas incorrectas antes de subir a HubSpot")
        incorrectas = revisadas[revisadas['correcto'] == 0][
            ['empresa', 'SCIAN_nombre', 'fuente_scian', 'industria_real', 'razon_groq']
        ]
        print(f"\nTop incorrectas:")
        print(incorrectas.head(10).to_string(index=False))


def generar_hubspot():
    df_muestra = pd.read_csv(MUESTRA_PATH)
    revisadas  = df_muestra[df_muestra['correcto'].notna()]
    precision  = (revisadas['correcto'] == 1).sum() / len(revisadas) * 100

    if precision < 85:
        print(f"⚠  Precisión {precision:.1f}% < 85% — no se genera el CSV de HubSpot")
        print(f"   Revisa las filas incorrectas y corrige el pipeline antes de continuar")
        return

    df = pd.read_parquet(MAESTRO_PATH)
    df = df[df['SCIAN_2'].notna() & (df['SCIAN_2'].astype(str) != 'None')]

    if 'hs_object_id' not in df.columns:
        id_col = next((c for c in df.columns if 'id' in c.lower()), None)
        if not id_col:
            print("❌ No se encontró columna de ID de HubSpot en df_maestro")
            return
        df = df.rename(columns={id_col: 'hs_object_id'})

    df_export = df[['hs_object_id', 'SCIAN_2', 'SCIAN_nombre']].copy()
    df_export.columns = ['hs_object_id', 'industria_scian_2', 'industria_nombre_scian']

    if 'SCIAN_3' in df.columns:
        df_export['industria_scian_3'] = df['SCIAN_3']

    df_export.to_csv(HUBSPOT_PATH, index=False)

    print(f"\n✅ CSV para HubSpot generado: {HUBSPOT_PATH}")
    print(f"   Filas listas para importar: {len(df_export):,}")
    print(f"   Columnas: {df_export.columns.tolist()}")
    print(f"\nPróximo paso: importa {HUBSPOT_PATH} en HubSpot como actualización de propiedades")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--calcular', action='store_true')
    parser.add_argument('--hubspot',  action='store_true')
    args = parser.parse_args()

    if args.calcular:
        calcular_precision()
    elif args.hubspot:
        generar_hubspot()
    else:
        auto_review()
