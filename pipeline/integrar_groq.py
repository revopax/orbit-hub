from typing import Optional
"""
integrar_capas_v2.py — Orquestador de capas con orden corregido

ORDEN DE PRIORIDAD (de mayor a menor confianza):
  Capa 0: catalogo_marcas     — Catálogo manual de ~800 marcas conocidas
                                 (empresas multinacionales/mexicanas top que
                                  no están en DENUE o están con ruido)
  Capa 1: denue_match         — Jaro-Winkler v2 (moda estadística, sin partial_ratio)
  Capa 2: mapeo_hubspot       — Catálogo manual HubSpot heredado (si existe)
  Capa 3: mapeo_industria_hs  — Campo Industria de Apollo/HubSpot → SCIAN directo
                                 (antes era fallback Capa 4 — ERROR — ahora sube)
  Capa 4: groq_llama          — Solo para el residuo que no resolvieron las capas anteriores

Por qué cambió el orden de Industria HS:
  Aunque viene de Apollo.io (con sus propios sesgos), cuando el campo existe
  es una clasificación deliberada hecha por el equipo de ventas al hacer la
  importación por ICP. El mapeo MAPEO_INDUSTRIA_HS ya traduce correctamente
  la taxonomía HubSpot/LinkedIn → SCIAN. Es más confiable que intentar
  inferir la industria del nombre de empresa via fuzzy matching.

  IMPORTANTE: no todas las empresas tienen este campo. Para las que no lo
  tienen, DENUE sigue siendo la fuente de verdad.
"""

import pandas as pd
import numpy as np
import os

MAESTRO_PATH   = "pipeline/data/df_maestro.parquet"
GROQ_PATH      = "pipeline/data/groq_results.parquet"
CATALOGO_PATH  = "pipeline/catalogo_marcas.csv"   # coloca el CSV aquí


# ── Mapeo Apollo/HubSpot Industria → SCIAN_2 ────────────────────────────────
MAPEO_INDUSTRIA_HS = {
    "Accounting":                          "52",
    "Airlines/Aviation":                   "48",
    "Alternative Dispute Resolution":      "81",
    "Alternative Medicine":                "62",
    "Animation":                           "51",
    "Apparel & Fashion":                   "46",
    "Architecture & Planning":             "54",
    "Arts and Crafts":                     "71",
    "Automotive":                          "33",
    "Aviation & Aerospace":                "48",
    "Banking":                             "52",
    "Biotechnology":                       "54",
    "Broadcast Media":                     "51",
    "Building Materials":                  "23",
    "Business Supplies and Equipment":     "56",
    "Capital Markets":                     "52",
    "Chemicals":                           "32",
    "Civic & Social Organization":         "93",
    "Civil Engineering":                   "23",
    "Commercial Real Estate":              "53",
    "Computer & Network Security":         "54",
    "Computer Games":                      "54",
    "Computer Hardware":                   "54",
    "Computer Networking":                 "54",
    "Computer Software":                   "54",
    "Construction":                        "23",
    "Consumer Electronics":                "46",
    "Consumer Goods":                      "46",
    "Consumer Services":                   "81",
    "Cosmetics":                           "46",
    "Dairy":                               "31",
    "Defense & Space":                     "33",
    "Design":                              "54",
    "E-Learning":                          "61",
    "Education Management":                "61",
    "Electrical/Electronic Manufacturing": "33",
    "Entertainment":                       "71",
    "Environmental Services":              "56",
    "Events Services":                     "56",
    "Executive Office":                    "56",
    "Facilities Services":                 "56",
    "Farming":                             "11",
    "Financial Services":                  "52",
    "Fine Art":                            "71",
    "Fishery":                             "11",
    "Food & Beverages":                    "72",
    "Food Production":                     "31",
    "Fund-Raising":                        "52",
    "Furniture":                           "33",
    "Gambling & Casinos":                  "71",
    "Glass, Ceramics & Concrete":          "32",
    "Government Administration":           "93",
    "Government Relations":                "93",
    "Graphic Design":                      "54",
    "Health, Wellness and Fitness":        "62",
    "Higher Education":                    "61",
    "Hospital & Health Care":              "62",
    "Hospitality":                         "72",
    "Human Resources":                     "56",
    "Import and Export":                   "43",
    "Individual & Family Services":        "62",
    "Industrial Automation":               "33",
    "Information Services":                "51",
    "Information Technology and Services": "54",
    "Insurance":                           "52",
    "International Affairs":               "93",
    "International Trade and Development": "43",
    "Internet":                            "54",
    "Investment Banking":                  "52",
    "Investment Management":               "52",
    "Judiciary":                           "93",
    "Law Enforcement":                     "93",
    "Law Practice":                        "54",
    "Legal Services":                      "54",
    "Legislative Office":                  "93",
    "Leisure, Travel & Tourism":           "72",
    "Libraries":                           "61",
    "Logistics and Supply Chain":          "48",
    "Luxury Goods & Jewelry":              "46",
    "Machinery":                           "33",
    "Management Consulting":               "54",
    "Maritime":                            "48",
    "Market Research":                     "54",
    "Marketing and Advertising":           "54",
    "Mechanical or Industrial Engineering":"33",
    "Media Production":                    "51",
    "Medical Devices":                     "33",
    "Medical Practice":                    "62",
    "Mental Health Care":                  "62",
    "Military":                            "93",
    "Mining & Metals":                     "21",
    "Motion Pictures and Film":            "51",
    "Museums and Institutions":            "71",
    "Music":                               "71",
    "Nanotechnology":                      "54",
    "Newspapers":                          "51",
    "Non-Profit Organization Management":  "81",
    "Oil & Energy":                        "21",
    "Online Media":                        "51",
    "Outsourcing/Offshoring":              "56",
    "Package/Freight Delivery":            "48",
    "Packaging and Containers":            "32",
    "Paper & Forest Products":             "31",
    "Performing Arts":                     "71",
    "Pharmaceuticals":                     "32",
    "Philanthropy":                        "81",
    "Photography":                         "54",
    "Plastics":                            "32",
    "Political Organization":              "93",
    "Primary/Secondary Education":         "61",
    "Printing":                            "31",
    "Professional Training & Coaching":    "61",
    "Program Development":                 "54",
    "Public Policy":                       "93",
    "Public Relations and Communications": "54",
    "Public Safety":                       "93",
    "Publishing":                          "51",
    "Railroad Manufacture":                "33",
    "Ranching":                            "11",
    "Real Estate":                         "53",
    "Recreational Facilities and Services":"71",
    "Religious Institutions":              "81",
    "Renewables & Environment":            "22",
    "Research":                            "54",
    "Restaurants":                         "72",
    "Retail":                              "46",
    "Security and Investigations":         "56",
    "Semiconductors":                      "33",
    "Shipbuilding":                        "33",
    "Sporting Goods":                      "46",
    "Sports":                              "71",
    "Staffing and Recruiting":             "56",
    "Supermarkets":                        "46",
    "Telecommunications":                  "51",
    "Textiles":                            "31",
    "Think Tanks":                         "54",
    "Tobacco":                             "31",
    "Translation and Localization":        "54",
    "Transportation/Trucking/Railroad":    "48",
    "Utilities":                           "22",
    "Venture Capital & Private Equity":    "52",
    "Veterinary":                          "62",
    "Warehousing":                         "48",
    "Wholesale":                           "43",
    "Wine and Spirits":                    "31",
    "Wireless":                            "51",
    "Writing and Editing":                 "51",

    # ── Términos en español — Apollo importado por SDRs en HubSpot ──────────
    # Por qué existe esta sección:
    # Apollo.io usa taxonomía LinkedIn en inglés, pero cuando los SDRs importan
    # manualmente o editan los campos en HubSpot, usan términos en español.
    # Ejemplos reales: "Minorista" en lugar de "Retail", "Manufactura" en lugar
    # de "Manufacturing", "Publicidad" en lugar de "Marketing and Advertising".
    # El pipeline busca exact-match primero, luego normalizado (ver _buscar_industria).

    # Manufactura
    "Manufactura":                         "31",
    "Industria manufacturera":             "31",
    "Industrias manufactureras":           "31",
    "Fabricación":                         "31",
    "Industria":                           "31",
    "Producción":                          "31",
    "Alimentos":                           "31",
    "Alimentos y bebidas":                 "31",
    "Industria alimentaria":               "31",
    "Bebidas":                             "31",
    "Bebidas y tabaco":                    "31",
    "Química":                             "32",
    "Industria química":                   "32",
    "Químicos":                            "32",
    "Farmacéutica":                        "32",
    "Farmacéutico":                        "32",
    "Farmacia":                            "32",
    "Farmacéuticos":                       "32",
    "Plásticos":                           "32",
    "Papel y cartón":                      "31",
    "Papel":                               "31",
    "Textil":                              "31",
    "Textiles":                            "31",
    "Confección":                          "31",
    "Ropa":                                "31",
    "Automotriz":                          "33",
    "Autopartes":                          "33",
    "Maquinaria":                          "33",
    "Maquinaria y equipo":                 "33",
    "Electrónica":                         "33",
    "Electrónico":                         "33",
    "Muebles":                             "33",
    "Minerales no metálicos":              "32",
    "Cemento":                             "32",
    "Vidrio":                              "32",
    "Metal":                               "33",
    "Metálico":                            "33",
    "Acero":                               "33",
    "Impresión":                           "31",

    # Comercio
    "Minorista":                           "46",
    "Comercio minorista":                  "46",
    "Al por menor":                        "46",
    "Comercio al por menor":               "46",
    "Retail":                              "46",
    "Tienda":                              "46",
    "Mayorista":                           "43",
    "Comercio mayorista":                  "43",
    "Al por mayor":                        "43",
    "Comercio al por mayor":               "43",
    "Distribución":                        "43",
    "Distribuidor":                        "43",
    "Importación y exportación":           "43",
    "Importación":                         "43",
    "Exportación":                         "43",

    # Tecnología / Servicios profesionales
    "Tecnología":                          "54",
    "Tecnología de la información":        "54",
    "TI":                                  "54",
    "IT":                                  "54",
    "Software":                            "54",
    "Desarrollo de software":              "54",
    "Tecnología e información":            "54",
    "Sistemas":                            "54",
    "Consultoría":                         "54",
    "Consultoría de negocios":             "54",
    "Servicios de TI":                     "54",
    "Servicios profesionales":             "54",
    "Servicios profesionales y técnicos":  "54",
    "Ingeniería":                          "54",
    "Diseño gráfico":                      "54",
    "Diseño":                              "54",
    "Investigación":                       "54",
    "Investigación y desarrollo":          "54",

    # Financiero
    "Servicios financieros":               "52",
    "Finanzas":                            "52",
    "Banca":                               "52",
    "Banco":                               "52",
    "Bancario":                            "52",
    "Seguros":                             "52",
    "Aseguradora":                         "52",
    "Inversiones":                         "52",
    "Capital":                             "52",
    "Crédito":                             "52",
    "Fondos":                              "52",

    # Medios / Telecomunicaciones
    "Telecomunicaciones":                  "51",
    "Medios":                              "51",
    "Medios de comunicación":              "51",
    "Comunicación":                        "51",
    "Publicaciones":                       "51",
    "Editorial":                           "51",
    "Periódico":                           "51",
    "Radio":                               "51",
    "Televisión":                          "51",
    "Internet":                            "54",
    "E-commerce":                          "46",
    "Comercio electrónico":                "46",

    # Publicidad / Apoyo a negocios
    "Publicidad":                          "56",
    "Mercadotecnia":                       "56",
    "Marketing":                           "56",
    "Relaciones públicas":                 "56",
    "Agencia":                             "56",
    "Agencia de publicidad":               "56",
    "Recursos humanos":                    "56",
    "Outsourcing":                         "56",
    "Externalización":                     "56",
    "Servicios de apoyo":                  "56",
    "Servicios empresariales":             "56",

    # Construcción / Inmobiliaria
    "Construcción":                        "23",
    "Constructora":                        "23",
    "Bienes raíces":                       "53",
    "Inmobiliaria":                        "53",
    "Real estate":                         "53",
    "Propiedades":                         "53",

    # Salud
    "Salud":                               "62",
    "Salud y bienestar":                   "62",
    "Healthcare":                          "62",
    "Médico":                              "62",
    "Médicos":                             "62",
    "Hospital":                            "62",
    "Hospitalario":                        "62",
    "Clínica":                             "62",
    "Asistencia social":                   "62",
    "Bienestar":                           "62",

    # Educación
    "Educación":                           "61",
    "Educativo":                           "61",
    "Escuela":                             "61",
    "Universidad":                         "61",
    "Capacitación":                        "61",
    "Formación":                           "61",

    # Entretenimiento / Turismo
    "Entretenimiento":                     "71",
    "Turismo":                             "71",
    "Viajes":                              "71",
    "Deportes":                            "71",
    "Arte":                                "71",
    "Cultura":                             "71",
    "Esparcimiento":                       "71",
    "Recreación":                          "71",
    "Juegos":                              "71",
    "Casino":                              "71",
    "Hoteles":                             "72",
    "Hotelería":                           "72",
    "Restaurante":                         "72",
    "Restaurantes":                        "72",
    "Alimentos y bebidas (servicio)":      "72",
    "Gastronomía":                         "72",

    # Transporte / Logística
    "Transporte":                          "48",
    "Logística":                           "48",
    "Transportación":                      "48",
    "Carga":                               "48",
    "Mensajería":                          "48",
    "Paquetería":                          "48",
    "Almacenamiento":                      "48",

    # Energía / Minería
    "Energía":                             "21",
    "Petróleo":                            "21",
    "Petróleo y gas":                      "21",
    "Gas":                                 "21",
    "Minería":                             "21",
    "Minerales":                           "21",
    "Energía renovable":                   "22",
    "Electricidad":                        "22",
    "Agua":                                "22",

    # Agricultura
    "Agricultura":                         "11",
    "Agropecuario":                        "11",
    "Ganadería":                           "11",
    "Campo":                               "11",

    # Gobierno / ONGs
    "Gobierno":                            "93",
    "Gubernamental":                       "93",
    "Sector público":                      "93",
    "Asociación":                          "81",
    "ONG":                                 "81",
    "Organización sin fines de lucro":     "81",
    "Fundación":                           "81",
    "Organización civil":                  "81",
}

SCIAN_NOMBRE = {
    '11': 'Agricultura, cría y explotación de animales',
    '21': 'Minería',
    '22': 'Generación, transmisión y distribución de energía eléctrica',
    '23': 'Construcción',
    '31': 'Industrias manufactureras',
    '32': 'Industrias manufactureras',
    '33': 'Industrias manufactureras',
    '43': 'Comercio al por mayor',
    '46': 'Comercio al por menor',
    '48': 'Transportes, correos y almacenamiento',
    '49': 'Transportes, correos y almacenamiento',
    '51': 'Información en medios masivos',
    '52': 'Servicios financieros y de seguros',
    '53': 'Servicios inmobiliarios y de alquiler',
    '54': 'Servicios profesionales, científicos y técnicos',
    '55': 'Corporativos',
    '56': 'Servicios de apoyo a los negocios',
    '61': 'Servicios educativos',
    '62': 'Servicios de salud y de asistencia social',
    '71': 'Servicios de esparcimiento culturales y deportivos',
    '72': 'Servicios de alojamiento temporal y de preparación de alimentos y bebidas',
    '81': 'Otros servicios excepto actividades gubernamentales',
    '93': 'Actividades legislativas, gubernamentales, de impartición de justicia',
}


def _normalizar(texto: str) -> str:
    import unicodedata, re
    STOPWORDS = {
        'sa','de','cv','sab','sapi','rl','srl','ac','iap','sc',
        'sociedad','anonima','variable','capital','limitada',
        'group','grupo','holding','corp','corporation','inc',
        'the','los','las','el','la','y','e','of','and',
    }
    if pd.isna(texto):
        return ""
    t = str(texto).upper()
    t = unicodedata.normalize('NFKD', t)
    t = t.encode('ascii', 'ignore').decode('ascii')
    t = re.sub(r'[^A-Z0-9\s]', ' ', t)
    tokens = [w for w in t.split() if w not in STOPWORDS and len(w) > 1]
    return ' '.join(tokens)


# Índice normalizado del MAPEO_INDUSTRIA_HS para lookup sin acentos/mayúsculas
# Se construye una sola vez al cargar el módulo
import unicodedata as _UD
def _norm_ind(s: str) -> str:
    """Quita acentos, pasa a minúsculas, colapsa espacios."""
    s = _UD.normalize('NFKD', str(s)).encode('ascii', 'ignore').decode('ascii')
    return ' '.join(s.lower().split())

_MAPEO_NORM: dict[str, str] = {_norm_ind(k): v for k, v in MAPEO_INDUSTRIA_HS.items()}


def _buscar_industria(valor: str) -> Optional[str]:
    """
    Busca el SCIAN_2 para un valor del campo Industria de HubSpot.

    Estrategia en cascada (de más a menos estricta):
    1. Exact match — el valor existe tal cual en MAPEO_INDUSTRIA_HS
    2. Match normalizado — sin acentos, sin mayúsculas
    3. Match por contenido — si el valor contiene alguna clave conocida

    Por qué:
    - Apollo usa inglés (Retail, Manufacturing, etc.)
    - Los SDRs editan HubSpot en español (Minorista, Manufactura, etc.)
    - Algunos valores tienen typos o variaciones: "Farmacéutico" vs "Farmacéutica"
    - Sin esta función, "Minorista" no encontraría su SCIAN aunque "Retail" sí

    Devuelve el código SCIAN_2 o None si no hay match.
    """
    if pd.isna(valor) or str(valor).strip() in ('', 'nan', 'None'):
        return None

    val = str(valor).strip()

    # 1. Exact match
    if val in MAPEO_INDUSTRIA_HS:
        return MAPEO_INDUSTRIA_HS[val]

    # 2. Match normalizado
    val_norm = _norm_ind(val)
    if val_norm in _MAPEO_NORM:
        return _MAPEO_NORM[val_norm]

    # 3. Match por contenido (el valor de HubSpot contiene una clave conocida)
    #    Útil para "Industria química y farmacéutica" → match "industria quimica"
    for clave_norm, scian in _MAPEO_NORM.items():
        if len(clave_norm) >= 5 and clave_norm in val_norm:
            return scian

    return None


def run():
    print("=" * 60)
    print("  integrar_capas_v2.py — Pipeline con orden corregido")
    print("=" * 60)

    maestro = pd.read_parquet(MAESTRO_PATH)
    maestro['SCIAN_2'] = maestro['SCIAN_2'].replace('None', np.nan)
    maestro['fuente_scian'] = maestro['fuente_scian'].replace('None', np.nan)

    total = len(maestro)
    print(f"\nTotal leads en maestro: {total:,}")
    print("\nEstado inicial por fuente:")
    print(maestro['fuente_scian'].value_counts(dropna=False).to_string())

    # Asegurar columna nombre_norm
    if 'nombre_norm' not in maestro.columns:
        maestro['nombre_norm'] = maestro['Nombre de la empresa'].apply(_normalizar)
    else:
        mask_nan = maestro['nombre_norm'].isna()
        maestro.loc[mask_nan, 'nombre_norm'] = maestro.loc[mask_nan, 'Nombre de la empresa'].apply(_normalizar)

    # ── CAPA 0: Catálogo de marcas conocidas ─────────────────────────────────
    print("\n── CAPA 0: Catálogo de marcas conocidas ──")

    if not os.path.exists(CATALOGO_PATH):
        print(f"  ⚠ No se encontró {CATALOGO_PATH} — saltando Capa 0")
        print(f"    Descarga catalogo_marcas.csv y colócalo en pipeline/")
    else:
        df_cat = pd.read_csv(CATALOGO_PATH)
        # nombre_norm ya viene normalizado en el CSV
        catalogo_dict   = dict(zip(df_cat['nombre_norm'], df_cat['scian_2']))
        catalogo_sector = dict(zip(df_cat['nombre_norm'], df_cat['nombre_sector']))
        # scian_3: columna opcional — solo si el CSV fue enriquecido con scian_3
        catalogo_scian3 = (
            dict(zip(df_cat['nombre_norm'], df_cat['scian_3']))
            if 'scian_3' in df_cat.columns else {}
        )

        # Asegurar columna SCIAN_3 en maestro
        if 'SCIAN_3' not in maestro.columns:
            maestro['SCIAN_3'] = np.nan

        # Identificar leads sin clasificar aún
        sin_clasificar = (
            maestro['SCIAN_2'].isna() |
            ~maestro['fuente_scian'].isin(['mapeo_hubspot'])
        )

        aplicados = 0
        for idx in maestro[sin_clasificar].index:
            nombre = maestro.at[idx, 'nombre_norm']
            if nombre and nombre in catalogo_dict:
                maestro.at[idx, 'SCIAN_2']      = catalogo_dict[nombre]
                maestro.at[idx, 'SCIAN_nombre'] = catalogo_sector[nombre]
                maestro.at[idx, 'fuente_scian'] = 'catalogo_marcas'
                # Propagar scian_3 si está disponible
                if nombre in catalogo_scian3 and catalogo_scian3[nombre]:
                    maestro.at[idx, 'SCIAN_3'] = catalogo_scian3[nombre]
                aplicados += 1

        cobertura_c0 = aplicados / total * 100
        print(f"  → Aplicados por catálogo: {aplicados:,} ({cobertura_c0:.1f}% del total)")
        print(f"  → Con SCIAN_3 asignado:   {maestro['SCIAN_3'].notna().sum():,}")

    # ── CAPA 1: DENUE match (ya aplicado en match_incremental) ──────────────
    # No se re-ejecuta aquí — ya está en df_maestro como fuente 'denue_match'
    ya_denue = maestro['fuente_scian'].isin(['denue_match', 'denue_match_bajo']).sum()
    print(f"\n── CAPA 1: DENUE match (ya en maestro) ──")
    print(f"  Leads con DENUE match: {ya_denue:,}")

    # ── CAPA 2: Catálogo manual HubSpot (mapeo_hubspot) ─────────────────────
    ya_manual = (maestro['fuente_scian'] == 'mapeo_hubspot').sum()
    print(f"\n── CAPA 2: Catálogo manual HubSpot ──")
    print(f"  Leads con mapeo manual: {ya_manual:,}")

    # ── CAPA 3: Campo Industria Apollo/HubSpot ───────────────────────────────
    print("\n── CAPA 3: Campo Industria Apollo/HubSpot ──")

    sin_scian_c3 = (
        maestro['SCIAN_2'].isna() &
        ~maestro['fuente_scian'].isin(['denue_match', 'denue_match_bajo',
                                        'mapeo_hubspot', 'catalogo_marcas'])
    )
    print(f"  Candidatos sin clasificar aún: {sin_scian_c3.sum():,}")

    industria_col = next(
        (c for c in maestro.columns if c.strip().lower() == 'industria'),
        None
    )

    if industria_col:
        # Usa _buscar_industria en lugar de exact-match directo.
        # Soporta: inglés de Apollo, español de SDRs, variantes sin acentos,
        # y match por contenido para frases compuestas.
        def mapear_hs(ind):
            scian  = _buscar_industria(ind)
            nombre = SCIAN_NOMBRE.get(scian) if scian else None
            return scian, nombre

        mapped = maestro.loc[sin_scian_c3, industria_col].apply(
            lambda x: pd.Series(mapear_hs(x), index=['_s', '_n'])
        )
        mask_c3 = sin_scian_c3 & mapped['_s'].notna()

        # Registrar qué estrategia de match usó cada uno (útil para debug)
        def estrategia(ind):
            val = str(ind).strip() if not pd.isna(ind) else ''
            if val in MAPEO_INDUSTRIA_HS:
                return 'exact'
            if _norm_ind(val) in _MAPEO_NORM:
                return 'normalizado'
            return 'contenido'

        maestro.loc[mask_c3.index[mask_c3], 'SCIAN_2']           = mapped.loc[mask_c3, '_s']
        maestro.loc[mask_c3.index[mask_c3], 'SCIAN_nombre']      = mapped.loc[mask_c3, '_n']
        maestro.loc[mask_c3.index[mask_c3], 'fuente_scian']      = 'mapeo_industria_hs'

        # Desglose por estrategia de match (para medir calidad)
        estrategias = maestro.loc[sin_scian_c3 & mask_c3, industria_col].apply(estrategia)
        print(f"  → Aplicados por Industria HubSpot: {mask_c3.sum():,}")
        print(f"     Exact match (inglés/español):  {(estrategias=='exact').sum():,}")
        print(f"     Match normalizado (s/acentos): {(estrategias=='normalizado').sum():,}")
        print(f"     Match por contenido:           {(estrategias=='contenido').sum():,}")

        # Mostrar valores del campo Industria que NO hicieron match (para enriquecer el mapeo)
        no_match = maestro.loc[sin_scian_c3 & ~mask_c3, industria_col]
        no_match_vals = no_match.dropna().value_counts().head(20)
        if len(no_match_vals):
            print(f"\n  ⚠ Top 20 valores sin match (candidatos para agregar al mapeo):")
            print(no_match_vals.to_string())
    else:
        print(f"  ⚠ Columna 'Industria' no encontrada en maestro")

    # ── CAPA 4: Groq (solo residuo) ──────────────────────────────────────────
    print("\n── CAPA 4: Groq/Llama ──")

    if os.path.exists(GROQ_PATH):
        groq = pd.read_parquet(GROQ_PATH)
        groq_validos = groq[groq['Confianza_Groq'] >= 0.85][[
            'empresa_normalizada', 'SCIAN_2_Groq', 'Industria_Groq', 'Confianza_Groq'
        ]].rename(columns={
            'empresa_normalizada': 'nombre_norm',
            'SCIAN_2_Groq':        'scian_groq',
            'Industria_Groq':      'nombre_groq',
        })
        print(f"  Groq válidos (≥0.85): {len(groq_validos):,}")

        sin_scian_c4 = maestro['SCIAN_2'].isna()
        maestro_sin = maestro[sin_scian_c4].copy().merge(
            groq_validos, on='nombre_norm', how='left'
        )
        groq_ok = maestro_sin['scian_groq'].notna()
        if groq_ok.any():
            idx_ok = maestro[sin_scian_c4].index[groq_ok]
            maestro.loc[idx_ok, 'SCIAN_2']      = maestro_sin.loc[groq_ok, 'scian_groq'].values
            maestro.loc[idx_ok, 'SCIAN_nombre'] = maestro_sin.loc[groq_ok, 'nombre_groq'].values
            maestro.loc[idx_ok, 'fuente_scian'] = 'groq_llama'
            print(f"  → Aplicados por Groq: {groq_ok.sum():,}")
        else:
            print(f"  → Sin nuevos matches de Groq")
    else:
        print(f"  groq_results.parquet no existe — saltando")

    # ── REPORTE FINAL ─────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("  RESULTADO FINAL")
    print("=" * 60)

    con_scian = maestro['SCIAN_2'].notna() & (maestro['SCIAN_2'].astype(str) != 'None')
    sin_scian = ~con_scian
    cobertura = con_scian.sum() / total * 100

    print(f"\nTotal leads:    {total:,}")
    print(f"Con SCIAN:      {con_scian.sum():,}  ({cobertura:.1f}%)")
    print(f"Sin SCIAN:      {sin_scian.sum():,}  ({100-cobertura:.1f}%)")
    print(f"\nPor fuente:")
    print(maestro['fuente_scian'].value_counts(dropna=False).to_string())
    print(f"\nPor industria SCIAN:")
    print(maestro.loc[con_scian, 'SCIAN_nombre'].value_counts().head(15).to_string())

    # Fix tipos antes de guardar
    for col in ['SCIAN_2', 'SCIAN_3']:
        if col in maestro.columns:
            maestro[col] = maestro[col].astype(str).replace({'None':'','nan':''})
            maestro[col] = maestro[col].where(maestro[col] != '', None)
    if 'Match_Score' in maestro.columns:
        maestro['Match_Score'] = pd.to_numeric(maestro['Match_Score'], errors='coerce')
    maestro.to_parquet(MAESTRO_PATH, index=False)
    print(f"\n✅ df_maestro.parquet actualizado en {MAESTRO_PATH}")

    return maestro


if __name__ == "__main__":
    run()
