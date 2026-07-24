#!/usr/bin/env python3
"""
run_pipeline_supabase.py — Orquestador principal (reemplaza run_pipeline.py)
Lee leads desde Supabase (no Google Sheets).

Orden de ejecución:
  1. match_denue.py     — Jaro-Winkler vs DENUE (Capa 1)
  2. enriquecer_nombres.py — nombre_busqueda desde Supabase
  3. match_domain.py    — match por dominio de email/website
  4. match_capa0.py     — cascada nombre/dominio vs DENUE
  5. integrar_groq.py   — orquesta todas las capas en maestro final
  6. generate_data.py   — genera brujula_data.json para Vercel

NOTA: run_pipeline.py (versión anterior) usa Google Sheets/Drive — conservado
como referencia histórica, NO ejecutar.

Uso:
  cd ~/Downloads/BRUJULA-COMERCIAL-UPAX
  export $(grep -v '^#' .env.local | xargs)
  python3 pipeline/run_pipeline_supabase.py
"""
import os, sys, subprocess
from pathlib import Path

ROOT = Path(__file__).parent.parent
PIPELINE = ROOT / "pipeline"

def run(script, desc):
    print(f"\n{'='*60}")
    print(f"  {desc}")
    print(f"{'='*60}")
    result = subprocess.run(
        [sys.executable, str(PIPELINE / script)],
        cwd=str(ROOT)
    )
    if result.returncode != 0:
        print(f"\n❌ Error en {script} — abortando pipeline")
        sys.exit(1)
    print(f"✅ {script} completado")

if __name__ == "__main__":
    print("\nBRÚJULA COMERCIAL — Pipeline Supabase")
    print("Versión: run_pipeline_supabase.py")
    print("Fuente: Supabase (no Google Sheets)\n")

    run("match_denue.py",       "Capa 1: DENUE Jaro-Winkler")
    run("enriquecer_nombres.py","Capa 2: Enriquecer nombre_busqueda")
    run("match_domain.py",      "Capa 3: Match por dominio")
    run("match_capa0.py",       "Capa 4: Cascada nombre/dominio")
    run("integrar_groq.py",     "Capa 5: Orquestar capas en maestro")
    run("generate_data.py",     "Generar JSON para Vercel")

    print("\n✅ Pipeline completo")
