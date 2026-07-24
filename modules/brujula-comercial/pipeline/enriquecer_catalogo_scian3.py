"""
enriquecer_catalogo_scian3.py
─────────────────────────────
Agrega la columna scian_3 al catalogo_marcas.csv existente.

Uso:
    python enriquecer_catalogo_scian3.py
    python enriquecer_catalogo_scian3.py --csv pipeline/catalogo_marcas.csv

El script usa dos fuentes:
  1. Mapeo explícito para marcas importantes (mayor precisión)
  2. Regla de fallback: primer subsector disponible para el scian_2

Puedes correrlo cada vez que agregues marcas nuevas al catálogo.
"""
import argparse
import pandas as pd
import os

# ── Mapeo explícito marca → scian_3 ──────────────────────────────────────────
# Cubre las marcas más frecuentes. Las demás caen en el fallback por scian_2.
SCIAN_3_EXPLICITO: dict[str, str] = {
    # ── Retail / Comercio al por menor (46x) ─────────────────────────────────
    "WALMART": "462", "WALMART DE MEXICO": "462", "WALMEX": "462",
    "SAM'S CLUB": "462", "SAMS CLUB": "462",
    "BODEGA AURRERA": "461", "SUPERAMA": "461",
    "OXXO": "461", "SEVEN ELEVEN": "461", "7 ELEVEN": "461",
    "SORIANA": "462", "CHEDRAUI": "462", "LA COMER": "462",
    "CIUDAD COMERCIAL HERDEZ": "462",
    "LIVERPOOL": "462", "EL PUERTO DE LIVERPOOL": "462",
    "PALACIO DE HIERRO": "462", "SEARS": "462",
    "SUBURBIA": "463", "COPPEL": "462",
    "ELEKTRA": "462", "FAMSA": "462",
    "FARMACIAS DEL AHORRO": "464", "FARMACIA DEL AHORRO": "464",
    "FARMACIAS GUADALAJARA": "464", "BENAVIDES": "464",
    "HOME DEPOT": "466", "COSTCO": "462",
    "OFFICE DEPOT": "465", "OFFICEMAX": "465",
    "PETCO": "469", "CINEMEX": "713", "CINEPOLIS": "713",
    "AUTOZONE": "468", "ADVANCE AUTO PARTS": "468",

    # ── Manufactura alimentaria (311) ─────────────────────────────────────────
    "BIMBO": "311", "GRUPO BIMBO": "311",
    "LALA": "311", "GRUPO LALA": "311",
    "GRUMA": "311", "MASECA": "311",
    "GRUPO HERDEZ": "311", "HERDEZ": "311",
    "MCCORMICK": "311", "KELLOGGS": "311",
    "MARINELA": "311", "BARCEL": "311",
    "GAMESA": "311", "SABRITAS": "311",
    "NESTLÉ": "311", "NESTLE": "311",
    "UNILEVER": "311",
    "MONDELEZ": "311", "KRAFT": "311",
    "NUTRISA": "311", "ALPURA": "311",
    "SIGMA ALIMENTOS": "311", "SIGMA": "311",
    "BACHOCO": "311", "PILGRIM'S PRIDE": "311",

    # ── Manufactura bebidas (312) ─────────────────────────────────────────────
    "COCA COLA": "312", "COCA-COLA": "312",
    "PEPSI": "312", "PEPSICO": "312",
    "FEMSA": "312", "ARCA CONTINENTAL": "312",
    "HEINEKEN": "312", "MODELO": "312", "GRUPO MODELO": "312",
    "CUAUHTEMOC MOCTEZUMA": "312",
    "ELECTROLIT": "312", "BONAFONT": "312",
    "JUMEX": "312", "DEL VALLE": "312",
    "JARRITOS": "312", "LULU": "312",

    # ── Industria química / farmacéutica (325) ────────────────────────────────
    "BAYER": "325", "PFIZER": "325", "SANOFI": "325",
    "JOHNSON & JOHNSON": "325", "JOHNSON AND JOHNSON": "325",
    "ROCHE": "325", "ABBOTT": "325",
    "GENOMMA LAB": "325", "GENOMMA": "325",
    "MEDIX": "325", "LIOMONT": "325",
    "PROCTER & GAMBLE": "325", "P&G": "325",
    "COLGATE": "325", "HENKEL": "325",
    "3M": "325", "BASF": "325", "DOW": "325",

    # ── Equipo de cómputo / telecom (334) ────────────────────────────────────
    "DELL": "334", "HP": "334", "HEWLETT PACKARD": "334",
    "LENOVO": "334", "APPLE": "334", "SAMSUNG": "334",
    "SONY": "334", "PANASONIC": "334",

    # ── Equipo de transporte (336) ────────────────────────────────────────────
    "NISSAN": "336", "HONDA": "336", "TOYOTA": "336",
    "VOLKSWAGEN": "336", "VW": "336",
    "GENERAL MOTORS": "336", "FORD": "336",
    "KIA": "336", "HYUNDAI": "336", "STELLANTIS": "336",
    "AUDI": "336", "BMW": "336", "MERCEDES": "336",
    "VOLVO": "336", "CATERPILLAR": "333",

    # ── Financiero bancario (522) ─────────────────────────────────────────────
    "BBVA": "522", "BBVA BANCOMER": "522",
    "BANORTE": "522", "CITIBANAMEX": "522", "BANAMEX": "522",
    "SANTANDER": "522", "HSBC": "522",
    "BANCO AZTECA": "522", "SCOTIABANK": "522",
    "BURSATEC": "523", "ACTINVER": "523",

    # ── Seguros (524) ─────────────────────────────────────────────────────────
    "GNPGRUPO": "524", "GNP": "524",
    "SEGUROS ATLAS": "524", "HDI": "524",
    "MAPFRE": "524", "AXA": "524",
    "ZURICH": "524", "ALLIANZ": "524",

    # ── Telecomunicaciones (517) ──────────────────────────────────────────────
    "TELCEL": "517", "TELMEX": "517",
    "TOTALPLAY": "517", "MEGACABLE": "517",
    "IZZI": "517", "AT&T": "517",
    "AXTEL": "517", "ALTAN": "517",
    "AMERICA MOVIL": "517",

    # ── Medios / entretenimiento (515, 512) ───────────────────────────────────
    "TELEVISA": "515", "TV AZTECA": "515",
    "CANAL 11": "515", "MULTIMEDIOS": "515",
    "MEGAMEDIA": "515",
    "DISNEY": "512", "NETFLIX": "516",
    "SPOTIFY": "516", "YOUTUBE": "516",
    "AMAZON": "469",

    # ── Agencias de medios / publicidad (561) ────────────────────────────────
    "HAVAS": "561", "DENTSU": "561", "WPP": "561",
    "PUBLICIS": "561", "WAVEMAKER": "561",
    "MINDSHARE": "561", "ZENITH": "561",
    "MEDIACOM": "561", "PHD": "561",
    "STARCOM": "561", "GREY": "561",
    "OGILVY": "561", "JWT": "561",
    "MCCANN": "561", "BBDO": "561",
    "LEO BURNETT": "561", "SAATCHI": "561",
    "UM": "561",

    # ── Servicios profesionales / TI (541) ────────────────────────────────────
    "DELOITTE": "541", "KPMG": "541",
    "ERNST & YOUNG": "541", "EY": "541",
    "PWC": "541", "PRICEWATERHOUSECOOPERS": "541",
    "ACCENTURE": "541", "IBM": "541",
    "ORACLE": "541", "SAP": "541",
    "MICROSOFT": "541", "GOOGLE": "541",
    "META": "541", "SALESFORCE": "541",
    "INFOSYS": "541", "WIPRO": "541",

    # ── Restaurantes / food service (722) ────────────────────────────────────
    "ALSEA": "722", "VIPS": "722",
    "DOMINO'S": "722", "DOMINOS": "722",
    "MCDONALDS": "722", "BURGER KING": "722",
    "KFC": "722", "SUBWAY": "722",
    "PIZZA HUT": "722", "STARBUCKS": "722",
    "WINGSTOP": "722",

    # ── Hoteles / alojamiento (721) ───────────────────────────────────────────
    "POSADAS": "721", "GRUPO POSADAS": "721",
    "MARRIOTT": "721", "HILTON": "721",
    "HYATT": "721", "STARWOOD": "721",
    "FIESTA INN": "721", "CAMINO REAL": "721",

    # ── Construcción (236, 237, 238) ──────────────────────────────────────────
    "ICA": "237", "PINFRA": "237",
    "VINTE": "236", "HOMEX": "236", "ARA": "236",
    "JAVER": "236", "URBI": "236",
    "CEMEX": "327", "CEMENTOS MOCTEZUMA": "327",
    "VITRO": "327",

    # ── Energía / petróleo (211, 221) ─────────────────────────────────────────
    "PEMEX": "211", "CFE": "221",
    "SHELL": "211", "BP": "211",
    "TOTAL": "211",

    # ── Logística / transporte (484, 493) ─────────────────────────────────────
    "DHL": "492", "FEDEX": "492",
    "UPS": "492", "ESTAFETA": "492",
    "REDPACK": "492", "MENSAJERIA": "492",
    "VEOLIA": "562",

    # ── Servicios inmobiliarios (531) ─────────────────────────────────────────
    "FIBRA UNO": "531", "FIBRA DANHOS": "531",
    "VIVA AEROBUS": "481", "AEROMEXICO": "481",
    "VOLARIS": "481", "INTERJET": "481",


    # ── Agregadas manualmente ─────────────────────────────────────────────────
    "HP": "334", "3M": "325", "BOSCH MEXICO": "336", "GSK": "325", "ABB": "335",
    "HEB MEXICO": "461", "SAMS WEST": "462", "LOREAL": "465", "CENCOSUD": "461",
    "MAKKEN": "469", "KINESSO": "469", "STORY CARD": "469",
    "WARNER BROS DISCOVERY": "512",
    "VML": "541", "MEDIA MONKS": "541", "PUBLICIS GROUPE": "541",
    "NIQ": "541", "QUALTRICS": "541", "LLYC": "541", "ZENDESK": "541",
    "KOF": "312", "BEPENSA SPIRITS": "312", "KAVAK": "468",
    "APLAZO": "522", "HEY BANCO": "522", "CHUBB MEXICO": "524",
    "TAFER HOTELS": "721", "MEDTRAINER": "621",

    # ── Servicios de salud (621, 622) ─────────────────────────────────────────
    "ANGELES SALUD": "622", "ABC MEDICA": "622",
    "CHRISTUS MUGUERZA": "622",
    "FARMACIAS SIMILARES": "464", "DR SIMI": "464",
    "LABORATORIOS CHOPO": "621",
}

# ── Fallback: scian_2 → scian_3 más representativo ───────────────────────────
# Para marcas no cubiertas explícitamente. Elige el subsector más común/genérico.
SCIAN_2_FALLBACK_3: dict[str, str] = {
    '11': '112', '21': '211', '22': '221', '23': '236',
    '31': '311', '32': '325', '33': '336',
    '43': '431', '46': '461',
    '48': '484', '49': '493',
    '51': '517', '52': '522', '53': '531',
    '54': '541', '55': '551', '56': '561',
    '61': '611', '62': '621',
    '71': '711', '72': '722',
    '81': '811', '93': '931',
}


def enriquecer(csv_path: str) -> None:
    if not os.path.exists(csv_path):
        print(f"❌ No se encontró: {csv_path}")
        return

    df = pd.read_csv(csv_path)
    print(f"Catálogo cargado: {len(df):,} filas")

    if 'scian_3' in df.columns:
        print("⚠  Columna scian_3 ya existe — se sobreescribirá")

    scian_3_list = []
    por_explicito = 0
    por_fallback  = 0
    sin_asignar   = 0

    for _, row in df.iterrows():
        nombre = str(row.get('nombre_norm', '')).strip().upper()
        scian2 = str(row.get('scian_2', '')).strip()

        # 1. Buscar en mapeo explícito
        if nombre in SCIAN_3_EXPLICITO:
            scian_3_list.append(SCIAN_3_EXPLICITO[nombre])
            por_explicito += 1

        # 2. Fallback por scian_2
        elif scian2 in SCIAN_2_FALLBACK_3:
            scian_3_list.append(SCIAN_2_FALLBACK_3[scian2])
            por_fallback += 1

        # 3. No asignado
        else:
            scian_3_list.append('')
            sin_asignar += 1

    df['scian_3'] = scian_3_list

    df.to_csv(csv_path, index=False)

    print(f"\n✅ scian_3 agregado a {csv_path}")
    print(f"   Por mapeo explícito: {por_explicito:,}")
    print(f"   Por fallback scian_2: {por_fallback:,}")
    print(f"   Sin asignar:          {sin_asignar:,}")
    print(f"\nEjemplos:")
    print(df[['nombre_norm', 'scian_2', 'scian_3', 'nombre_sector']].head(15).to_string(index=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--csv', default='pipeline/catalogo_marcas.csv',
                        help='Ruta al catalogo_marcas.csv')
    args = parser.parse_args()
    enriquecer(args.csv)
