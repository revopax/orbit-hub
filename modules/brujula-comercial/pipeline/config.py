# ============================================================
# BRÚJULA COMERCIAL — Configuración central
# ============================================================

# ── Google Sheets IDs ────────────────────────────────────────
SHEET_HUBSPOT_ID   = "1FPzeq0eYJZInSzcnrR4pEa7SMb75Kj1ob8zM1l8mY98"
SHEET_HUBSPOT_TAB  = "Concentrado_V3"

SHEET_IGAE_ID      = "1zv-04vA3yaeBtgb_ALZkLYp3rDAyf2yX"
SHEET_IGAE_TAB     = "IGAE-indice"

SHEET_FORECAST_ID  = "1QE1k-PRdF0s1rE5v_tNr18-AWi5cNqT9"
SHEET_FORECAST_TAB = "Budget GDD 2026 (Escalonado)"

SHEET_OUTPUT_ID    = "14fasTt64cPGTyHx6ctIAWH71hefXyEu7rfNMy1-QbGs"
SHEET_OUTPUT_TAB   = "Brujula_Output"

# ── Drive folder ─────────────────────────────────────────────
DRIVE_FOLDER_ID    = "1D8bkumY6L9SAc-QiTk3RQngm-xgochJJ"

# ── Rutas locales (para ejecución en GitHub Actions) ─────────
DENUE_PARQUET      = "data/denue_nacional.parquet"
OUTPUT_FORECAST    = "data/df_forecast.parquet"
OUTPUT_BRUJULA     = "data/df_brujula.parquet"
OUTPUT_MAESTRO     = "data/df_maestro.parquet"

# ── Columnas HubSpot ─────────────────────────────────────────
COL_EMPRESA        = "Nombre de la empresa"
COL_UDN            = "UDN / Pipeline"
COL_FECHA          = "Fecha creación / reunión"
COL_ESTADO         = "Estado lead / etapa del negocio / resultado de reunión"
COL_INDUSTRIA      = "Industria"
COL_TIPO           = "Tipo de objeto"

# ── Sectores SCIAN × IGAE ────────────────────────────────────
SCIAN_MAP = {
    "11": "Agricultura y ganadería",
    "21": "Minería y petróleo",
    "22": "Electricidad y agua",
    "23": "Construcción",
    "31": "Manufactura",
    "43": "Comercio al por mayor",
    "46": "Comercio al por menor",
    "48": "Transportes y logística",
    "51": "Telecomunicaciones y medios",
    "52": "Servicios financieros",
    "53": "Servicios inmobiliarios",
    "54": "Servicios profesionales y TI",
    "56": "Servicios apoyo a negocios",
    "61": "Servicios educativos",
    "62": "Servicios de salud",
    "71": "Entretenimiento",
    "72": "Alojamiento y restaurantes",
    "81": "Otros servicios",
    "93": "Gobierno",
}

# ── Mapeo SCIAN → columna IGAE (nombres exactos del Sheet) ───
IGAE_SECTOR_COLS = {
    "21": "21 Minería",
    "22": "22 Generación, transmisión, distribución y comercialización de energía eléctrica, suministro de agua y de gas natural por ductos al consumidor final",
    "23": "23 Construcción",
    "31": "31-33 Industrias manufactureras",
    "43": "43 Comercio al por mayor",
    "46": "46 Comercio al por menor",
    "48": "48-49 Transportes, correos y almacenamiento",
    "51": "51 Información en medios masivos",
    "52": "52 Servicios financieros y de seguros",
    "53": "53 Servicios inmobiliarios y de alquiler de bienes muebles e intangibles",
    "54": "54 Servicios profesionales, científicos y técnicos",
    "56": "56 Servicios de apoyo a los negocios y manejo de residuos y desechos, y servicios de remediación",
    "61": "61 Servicios educativos",
    "62": "62 Servicios de salud y de asistencia social",
    "71": "71 Servicios de esparcimiento culturales y deportivos, y otros servicios recreativos",
    "72": "72 Servicios de alojamiento temporal y de preparación de alimentos y bebidas",
    "81": "81 Otros servicios excepto actividades gubernamentales",
    "93": "93 Actividades legislativas, gubernamentales, de impartición de justicia y de organismos internacionales y extraterritoriales",
}

# ── Mapeo especial SCIAN → IGAE (sectores agrupados) ─────────
# El IGAE agrupa algunos sectores SCIAN en una sola serie
SCIAN_IGAE_OVERRIDE = {
    "32": "31",  # Manufactura química → 31-33 manufactureras
    "33": "31",  # Manufactura metálica → 31-33 manufactureras
    "49": "48",  # Transporte aéreo    → 48-49 transportes
}

# ── UDNs válidas ─────────────────────────────────────────────
UDNS_VALIDAS = [
    "Marketing United",
    "UIX",
    "Promo Espacio",
    "Zeus",
    "Neracode",
    "House Of Films",
    "Research Land",
    "Mexa Creativa",
    "Upax",
]

# ── Prophet ──────────────────────────────────────────────────
FORZAR_PROPHET = False  # True solo para forzar re-entrenamiento manual
PROPHET_PERIODS      = 12   # meses a proyectar
PROPHET_FREQ         = "MS" # Month Start
ZSCORE_VENTANA_MESES = 36   # 3 años post-COVID — base normalizada reciente

# ── Thresholds Z-score ───────────────────────────────────────
Z_CALIENTE  =  0.5   # top ~30% meses → Vende
Z_TEMPLADO  =  0.1   # top ~46% → Prepara
Z_TIBIO     = -0.5   # neutro → Explora
# < -0.3 → Espera
