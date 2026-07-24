"""
enriquecer_nombres.py — Fase 1 del pipeline de clasificación SCIAN

Flujo:
  1. Lee df_maestro.parquet
  2. Descarga concentrado_v3 de Supabase (id_registro, hs_email_domain, website)
  3. Para cada registro:
     - Si nombre_valido(Nombre de la empresa) → nombre_busqueda = normalizar(nombre)
     - Si no → intenta root_dominio(hs_email_domain) → nombre_busqueda
     - Si no → intenta root_dominio(website) → nombre_busqueda
     - Si no → nombre_busqueda = None (no clasificable)
  4. Guarda df_maestro.parquet con columna nueva "nombre_busqueda"

Corre: python3 pipeline/enriquecer_nombres.py
"""

import re
import pandas as pd
from pathlib import Path
from supabase import create_client

# ── CONFIG ──────────────────────────────────────────────────────
PARQUET      = Path(__file__).parent / "data" / "df_maestro.parquet"
SUPABASE_URL = "https://maszpgfnbonwftxobryi.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hc3pwZ2ZuYm9ud2Z0eG9icnlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQyMDI3NCwiZXhwIjoyMDkyOTk2Mjc0fQ.Pw_Ba5Btnf7VMGhhnAjpSSLCDN3w_cJTQRp-pQw9w7s"
# ────────────────────────────────────────────────────────────────

GENERICOS_NV = {
    'NA', 'N/A', 'TEST', 'CLIENTE', 'SIN NOMBRE', 'NONE', 'NULL',
    'S/N', 'NO APLICA', 'TBD', 'NAN', 'NO NAME', 'MARCA COMERCIAL',
    'INDEPENDIENTE', 'FREELANCE', 'PERSONAL', 'NO TENGO', 'ESTUDIANTE',
    'PARTICULAR', 'NINGUNA', 'SIN EMPRESA', '-', '--',
    'CONSULTOR INDEPENDIENTE', 'PROFESIONAL INDEPENDIENTE', 'AUTONOMO',
    'AUTÓNOMO',
}


def nombre_valido(nombre: str) -> bool:
    """Devuelve True si el nombre puede usarse para fuzzy match."""
    if not nombre or pd.isna(nombre):
        return False
    s = str(nombre).strip()
    # 1. Solo números
    if re.match(r'^\d+$', s):
        return False
    # 2. Solo caracteres especiales (sin letras reales)
    sin_esp = re.sub(r'[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9]', '', s)
    if len(sin_esp) < 2:
        return False
    # 3. URL o dominio web puro
    if re.match(r'^https?://', s, re.IGNORECASE):
        return False
    if ' ' not in s and re.search(
        r'\.(?:com|mx|net|org|io|co|gob|edu|info|biz|us|ca|es|lat)(\s*[-/].*)?$',
        s, re.IGNORECASE
    ):
        return False
    # 4. Genérico exacto
    if s.upper().strip() in GENERICOS_NV:
        return False
    # 5. Solo dígitos y símbolos
    if re.match(r'^[\d\s\-\.\,\@\#\!\?\*\/\\]+$', s):
        return False
    return True


def normalizar(s: str) -> str:
    """Normaliza nombre de empresa para fuzzy match vs DENUE."""
    s = str(s or '').upper().strip()
    s = re.sub(r'[^\w\s]', ' ', s)
    for sfx in [
        'SA DE CV', 'S DE RL DE CV', 'S DE RL', 'SAPI DE CV', 'SAPI',
        'SAB DE CV', 'SAB', 'SC', 'AC', 'IAP', 'SA', 'SRL',
        'DE MEXICO', 'MEXICO', 'S A DE C V', 'S.A. DE C.V.',
    ]:
        s = re.sub(rf'\b{re.escape(sfx)}\b', '', s)
    return re.sub(r'\s+', ' ', s).strip()


def root_dominio(u: str) -> str:
    """Extrae raíz del dominio para usar como término de búsqueda."""
    if not u or pd.isna(u):
        return ''
    u = str(u).lower().strip()
    u = re.sub(r'https?://|www\.', '', u)
    u = u.split('/')[0].split('@')[-1]
    parts = u.split('.')
    if len(parts) >= 3:
        root = parts[-3]
    elif len(parts) == 2:
        root = parts[0]
    else:
        root = parts[0] if parts else ''
    root = re.sub(r'[^a-z0-9]', '', root)
    # Filtrar dominios genéricos que no identifican empresa
    DOMINIOS_GENERICOS = {
        'gmail', 'hotmail', 'yahoo', 'outlook', 'live', 'icloud',
        'protonmail', 'aol', 'msn', 'me', 'mac', 'googlemail',
    }
    if root in DOMINIOS_GENERICOS or len(root) < 3:
        return ''
    return root


def descargar_supabase() -> pd.DataFrame:
    """Descarga id_registro, hs_email_domain, website de Supabase."""
    print("Descargando Supabase concentrado_v3...")
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    rows, page = [], 0
    while True:
        r = sb.table('concentrado_v3').select(
            'id_registro,hs_email_domain,website'
        ).range(page * 1000, page * 1000 + 999).execute()
        if not r.data:
            break
        rows.extend(r.data)
        page += 1
        if page % 10 == 0:
            print(f"  Descargados: {len(rows):,}", end="\r")
    df_sb = pd.DataFrame(rows)
    df_sb['id_registro'] = df_sb['id_registro'].astype(str)
    print(f"✅ {len(df_sb):,} registros de Supabase")
    return df_sb


def main():
    print("=" * 58)
    print("  enriquecer_nombres.py — Fase 1: nombre_busqueda")
    print("=" * 58)

    # 1. Leer parquet
    df = pd.read_parquet(PARQUET)
    df['_id'] = df['ID de registro'].astype(str)
    print(f"df_maestro: {len(df):,} registros")

    # 2. Descargar Supabase y hacer join por id_registro
    df_sb = descargar_supabase()
    df = df.merge(
        df_sb.rename(columns={'id_registro': '_id'}),
        on='_id',
        how='left'
    )
    print(f"Join completado — hs_email_domain poblado: "
          f"{df['hs_email_domain'].notna().sum():,}")

    # 3. Construir nombre_busqueda
    print("\nGenerando nombre_busqueda...")

    def construir_busqueda(row):
        nombre = row.get('Nombre de la empresa', '')
        dominio = row.get('hs_email_domain', '')
        website = row.get('website', '')

        # Prioridad 1: nombre original válido
        if nombre_valido(nombre):
            return normalizar(nombre)

        # Prioridad 2: raíz del dominio de email
        raiz = root_dominio(dominio)
        if raiz:
            return raiz.upper()

        # Prioridad 3: raíz del website
        raiz = root_dominio(website)
        if raiz:
            return raiz.upper()

        # Sin fuente válida
        return None

    df['nombre_busqueda'] = df.apply(construir_busqueda, axis=1)
    df['fuente_nombre_busqueda'] = df.apply(lambda row: (
        'nombre_original'  if nombre_valido(row.get('Nombre de la empresa', ''))
        else 'hs_email_domain' if root_dominio(row.get('hs_email_domain', ''))
        else 'website'     if root_dominio(row.get('website', ''))
        else 'sin_fuente'
    ), axis=1)

    # 4. Reporte
    fuentes = df['fuente_nombre_busqueda'].value_counts()
    print("\n=== Fuentes de nombre_busqueda ===")
    for fuente, cnt in fuentes.items():
        pct = 100 * cnt / len(df)
        print(f"  {fuente:<20} {cnt:>7,}  ({pct:.1f}%)")

    sin_busqueda = df['nombre_busqueda'].isna().sum()
    print(f"\n  Sin fuente válida:    {sin_busqueda:>7,}  "
          f"({100*sin_busqueda/len(df):.1f}%)")

    # 5. Muestra de enriquecidos por dominio
    enriquecidos = df[df['fuente_nombre_busqueda'] == 'hs_email_domain'][
        ['Nombre de la empresa', 'hs_email_domain', 'nombre_busqueda']
    ].head(10)
    print("\nMuestra enriquecidos por dominio:")
    print(enriquecidos.to_string(index=False))

    # 6. Guardar — limpiar columnas temporales de Supabase
    df.drop(columns=['_id', 'hs_email_domain', 'website'], inplace=True)
    df.to_parquet(PARQUET, index=False)
    print(f"\n✅ df_maestro.parquet actualizado con 'nombre_busqueda' "
          f"y 'fuente_nombre_busqueda'")
    print("→ Siguiente: python3 pipeline/match_capa0.py")


if __name__ == '__main__':
    main()
