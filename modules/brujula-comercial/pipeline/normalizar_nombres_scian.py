#!/usr/bin/env python3
import pandas as pd
from pathlib import Path

PROJECT_ROOT = Path.home() / "Downloads/BRUJULA-COMERCIAL-UPAX"
PARQUET = PROJECT_ROOT / "pipeline/data/df_maestro.parquet"

NOMBRES_OFICIALES = {
    "11": "Agricultura, ganadería, aprovechamiento forestal, pesca y caza",
    "21": "Minería",
    "22": "Generación, transmisión y distribución de energía eléctrica",
    "23": "Construcción",
    "31": "Industrias manufactureras",
    "32": "Industrias manufactureras",
    "33": "Industrias manufactureras",
    "43": "Comercio al por mayor",
    "46": "Comercio al por menor",
    "48": "Transportes, correos y almacenamiento",
    "51": "Información en medios masivos",
    "52": "Servicios financieros y de seguros",
    "53": "Servicios inmobiliarios y de alquiler de bienes muebles e intangibles",
    "54": "Servicios profesionales, científicos y técnicos",
    "56": "Servicios de apoyo a los negocios",
    "61": "Servicios educativos",
    "62": "Servicios de salud y de asistencia social",
    "71": "Servicios de esparcimiento culturales y deportivos",
    "72": "Servicios de alojamiento temporal y de preparación de alimentos y bebidas",
    "81": "Otros servicios excepto actividades gubernamentales",
}

FIXES = {
    "Manufactura": "Industrias manufactureras",
    "Servicios financieros y seguros": "Servicios financieros y de seguros",
}

def main():
    df = pd.read_parquet(PARQUET)
    total = len(df)
    print(f"Total: {total:,}")

    for viejo, nuevo in FIXES.items():
        mask = df["SCIAN_nombre"] == viejo
        count = mask.sum()
        if count:
            df.loc[mask, "SCIAN_nombre"] = nuevo
            print(f"✅ '{viejo}' → '{nuevo}' ({count:,})")

    fixed = 0
    for idx, row in df.iterrows():
        s2 = str(row.get("SCIAN_2", "")).strip()
        if s2 and s2 in NOMBRES_OFICIALES:
            oficial = NOMBRES_OFICIALES[s2]
            actual = str(row.get("SCIAN_nombre", "")).strip()
            if actual != oficial:
                df.at[idx, "SCIAN_nombre"] = oficial
                fixed += 1

    print(f"✅ {fixed:,} sincronizados")
    print(f"📈 Cobertura: {df['SCIAN_2'].notna().sum() / total * 100:.1f}%")

    df.to_parquet(PARQUET, index=False)
    print("💾 Guardado")

if __name__ == "__main__":
    main()
