"""
scian_map_3d.py — Taxonomía SCIAN completa 2d → 3d
Fuente: INEGI DENUE (inegi.org.mx/app/mapa/denue)

Uso:
    from scian_map_3d import SCIAN_3_NOMBRE, SCIAN_2_TO_3, scian_3_nombre

Importar en: generate_data.py, integrar_capas_v2.py, match_denue_v2.py
"""

# ── Nombre de cada subsector SCIAN 3 dígitos ─────────────────────────────────
SCIAN_3_NOMBRE: dict[str, str] = {
    # 11 — Agricultura, cría y explotación de animales
    "111": "Agricultura",
    "112": "Cría y explotación de animales",
    "113": "Aprovechamiento forestal",
    "114": "Pesca, caza y captura",
    "115": "Servicios relacionados con las actividades agropecuarias",

    # 21 — Minería
    "211": "Extracción de petróleo y gas",
    "212": "Minería de minerales metálicos y no metálicos",
    "213": "Servicios relacionados con la minería",

    # 22 — Electricidad, agua y suministro de gas
    "221": "Generación, transmisión y distribución de energía eléctrica",
    "222": "Suministro de agua y suministro de gas por ductos",

    # 23 — Construcción
    "236": "Edificación",
    "237": "Construcción de obras de ingeniería civil",
    "238": "Trabajos especializados para la construcción",

    # 31-33 — Industrias manufactureras
    "311": "Industria alimentaria",
    "312": "Industria de las bebidas y del tabaco",
    "313": "Fabricación de insumos textiles y acabado de telas",
    "314": "Fabricación de productos textiles (excepto prendas de vestir)",
    "315": "Fabricación de prendas de vestir",
    "316": "Curtido y acabado de cuero y piel",
    "321": "Industria de la madera",
    "322": "Industria del papel",
    "323": "Impresión e industrias conexas",
    "324": "Fabricación de productos derivados del petróleo y del carbón",
    "325": "Industria química",
    "326": "Industria del plástico y del hule",
    "327": "Fabricación de productos a base de minerales no metálicos",
    "331": "Industrias metálicas básicas",
    "332": "Fabricación de productos metálicos",
    "333": "Fabricación de maquinaria y equipo",
    "334": "Fabricación de equipo de computación, comunicación y medición",
    "335": "Fabricación de accesorios y aparatos eléctricos",
    "336": "Fabricación de equipo de transporte",
    "337": "Fabricación de muebles, colchones y persianas",
    "339": "Otras industrias manufactureras",

    # 43 — Comercio al por mayor
    "431": "Comercio al por mayor de abarrotes y alimentos",
    "432": "Comercio al por mayor de productos textiles y calzado",
    "433": "Comercio al por mayor de productos farmacéuticos y médicos",
    "434": "Comercio al por mayor de materias primas agropecuarias",
    "435": "Comercio al por mayor de maquinaria, equipo y materiales",
    "436": "Comercio al por mayor de camiones y maquinaria pesada",
    "437": "Intermediaciones de comercio al por mayor",

    # 46 — Comercio al por menor
    "461": "Comercio al por menor de abarrotes, alimentos y bebidas",
    "462": "Comercio al por menor en tiendas de autoservicio y departamentales",
    "463": "Comercio al por menor de productos textiles, bisutería y calzado",
    "464": "Comercio al por menor de artículos para el hogar",
    "465": "Comercio al por menor de artículos de papelería, deportivos y culturales",
    "466": "Comercio al por menor de artículos de ferretería y tlapalería",
    "467": "Comercio al por menor de artículos de joyería, relojería y óptica",
    "468": "Comercio al por menor de vehículos de motor, refacciones y combustibles",
    "469": "Comercio al por menor exclusivamente a través de internet",

    # 48-49 — Transportes, correos y almacenamiento
    "481": "Transporte aéreo",
    "482": "Transporte por ferrocarril",
    "483": "Transporte por agua",
    "484": "Autotransporte de carga",
    "485": "Transporte terrestre de pasajeros",
    "486": "Transporte por ductos",
    "487": "Transporte turístico",
    "488": "Servicios relacionados con el transporte",
    "491": "Servicios postales",
    "492": "Servicios de mensajería y paquetería",
    "493": "Almacenamiento",

    # 51 — Información en medios masivos
    "511": "Edición de periódicos, revistas, libros y similares",
    "512": "Industria fílmica y del sonido",
    "515": "Radio y televisión",
    "516": "Creación y difusión de contenido en internet",
    "517": "Telecomunicaciones",
    "518": "Procesamiento electrónico de información",
    "519": "Otros servicios de información",

    # 52 — Servicios financieros y de seguros
    "521": "Banca central",
    "522": "Banca múltiple y de desarrollo",
    "523": "Actividades bursátiles, cambiarias y de inversión financiera",
    "524": "Compañías de seguros, fianzas y pensiones",
    "525": "Fondos y fideicomisos",
    "529": "Servicios financieros",

    # 53 — Servicios inmobiliarios
    "531": "Servicios inmobiliarios",
    "532": "Servicios de alquiler de bienes muebles",
    "533": "Servicios de alquiler de marcas registradas y franquicias",

    # 54 — Servicios profesionales, científicos y técnicos
    "541": "Servicios profesionales, científicos y técnicos",

    # 55 — Corporativos
    "551": "Corporativos",

    # 56 — Servicios de apoyo a los negocios
    "561": "Servicios de administración y apoyo a negocios",
    "562": "Manejo de residuos y servicios de remediación",

    # 61 — Servicios educativos
    "611": "Servicios educativos",

    # 62 — Servicios de salud y de asistencia social
    "621": "Servicios médicos de consulta externa",
    "622": "Hospitales",
    "623": "Residencias de asistencia social",
    "624": "Servicios de asistencia social",

    # 71 — Servicios de esparcimiento culturales y deportivos
    "711": "Servicios artísticos, culturales y deportivos",
    "712": "Museos, sitios históricos, zoológicos y jardines botánicos",
    "713": "Servicios de entretenimiento en instalaciones recreativas",

    # 72 — Servicios de alojamiento temporal y restaurantes
    "721": "Servicios de alojamiento temporal",
    "722": "Servicios de preparación de alimentos y bebidas",

    # 81 — Otros servicios excepto gobierno
    "811": "Servicios de reparación y mantenimiento",
    "812": "Servicios personales",
    "813": "Asociaciones y organizaciones",

    # 93 — Actividades gubernamentales
    "931": "Actividades legislativas y gubernamentales",
    "932": "Impartición de justicia y mantenimiento de la seguridad",
    "933": "Actividades de bienestar público",
}

# ── Nombre del sector 2d — notación exacta del DENUE/INEGI ──────────────────
# Usar SCIAN_2_NOMBRE para el nombre legible en la UI (columna SECTOR).
# Nota: 31/32/33 se agrupan bajo "(31-33) Industrias manufactureras" como en DENUE.
#       48/49 se agrupan bajo "(48-49) Transportes, correos y almacenamiento".
SCIAN_2_NOMBRE: dict[str, str] = {
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
    '53': 'Servicios inmobiliarios y de alquiler de bienes muebles e intangibles',
    '54': 'Servicios profesionales, científicos y técnicos',
    '55': 'Corporativos',
    '56': 'Servicios de apoyo a los negocios y manejo de desechos',
    '61': 'Servicios educativos',
    '62': 'Servicios de salud y de asistencia social',
    '71': 'Servicios de esparcimiento culturales y deportivos',
    '72': 'Servicios de alojamiento temporal y de preparación de alimentos y bebidas',
    '81': 'Otros servicios excepto actividades gubernamentales',
    '93': 'Actividades legislativas, gubernamentales, de impartición de justicia',
}

# ── Notación de grupo DENUE (para cabeceras de tabla en la UI) ───────────────
# Este es el texto exacto que ves en el árbol del DENUE.
# La UI debe mostrar SCIAN_2_GRUPO[scian_2] en la fila del sector.
# Para las subramas (3 dígitos), mostrar solo el NOMBRE sin código.
SCIAN_2_GRUPO: dict[str, str] = {
    '11': '(11) Agricultura, cría y explotación de animales',
    '21': '(21) Minería',
    '22': '(22) Generación, transmisión y distribución de energía eléctrica',
    '23': '(23) Construcción',
    '31': '(31-33) Industrias manufactureras',
    '32': '(31-33) Industrias manufactureras',
    '33': '(31-33) Industrias manufactureras',
    '43': '(43) Comercio al por mayor',
    '46': '(46) Comercio al por menor',
    '48': '(48-49) Transportes, correos y almacenamiento',
    '49': '(48-49) Transportes, correos y almacenamiento',
    '51': '(51) Información en medios masivos',
    '52': '(52) Servicios financieros y de seguros',
    '53': '(53) Servicios inmobiliarios y de alquiler',
    '54': '(54) Servicios profesionales, científicos y técnicos',
    '55': '(55) Corporativos',
    '56': '(56) Servicios de apoyo a los negocios',
    '61': '(61) Servicios educativos',
    '62': '(62) Servicios de salud y de asistencia social',
    '71': '(71) Servicios de esparcimiento culturales y deportivos',
    '72': '(72) Servicios de alojamiento temporal y preparación de alimentos',
    '81': '(81) Otros servicios excepto actividades gubernamentales',
    '93': '(93) Actividades legislativas y gubernamentales',
}

# ── Lookup inverso: scian_2 → lista de scian_3 válidos ───────────────────────
SCIAN_2_TO_3: dict[str, list[str]] = {}
for code_3 in SCIAN_3_NOMBRE:
    # Construir el scian_2 padre: para 31x, 32x, 33x → padre es 31, 32, 33
    # Para el IGAE se agrupan todos como "31" (manufactura)
    code_2 = code_3[:2]
    if code_2 not in SCIAN_2_TO_3:
        SCIAN_2_TO_3[code_2] = []
    SCIAN_2_TO_3[code_2].append(code_3)


def scian_3_nombre(code: str) -> str:
    """Devuelve el nombre del subsector para un código SCIAN de 3 dígitos."""
    if not code:
        return ''
    return SCIAN_3_NOMBRE.get(str(code).strip()[:3], '')


def scian_2_from_3(code_3: str) -> str:
    """Devuelve el código SCIAN de 2 dígitos padre de un código de 3."""
    if not code_3:
        return ''
    return str(code_3).strip()[:2]


if __name__ == '__main__':
    print("Sectores SCIAN 2d disponibles:", len(SCIAN_2_NOMBRE))
    print("Subsectores SCIAN 3d disponibles:", len(SCIAN_3_NOMBRE))
    print("\nEjemplo — subsectores de manufactura (31-33):")
    for c in ['31', '32', '33']:
        subs = SCIAN_2_TO_3.get(c, [])
        for s in subs:
            print(f"  ({s}) {SCIAN_3_NOMBRE[s]}")
