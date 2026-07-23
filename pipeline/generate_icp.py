"""
generate_icp.py — Genera pipeline/data/icp_data.json
Contiene ICP, BANT, BPs y Cuentas Objetivo por UDN.
Corre: python3 pipeline/generate_icp.py
"""
import json, re
from pathlib import Path

OUT = Path(__file__).parent / "data" / "icp_data.json"

UDN_MAP = {
    "HOF":"HOF","House Of Films":"HOF",
    "MU":"MU","Marketing United":"MU",
    "Mexa":"MEXA","MEXA":"MEXA","Mexa Creativa":"MEXA","MC":"MEXA",
    "Neracode":"NC","NC":"NC","NERACODE":"NC",
    "Promo Espacio":"PE","PE":"PE","PE*":"PE","SIDI":"PE","PROMO ESPACIO":"PE",
    "RL":"RL","ResearchLand":"RL","Research Land":"RL","RESEARCHLAND":"RL",
    "UiX":"UIX","UIX":"UIX","UiX ":"UIX",
    "Zeus":"ZU","ZU":"ZU","ZEUS":"ZU",
}

SCIAN_POR_INDUSTRIA = {
    "Retail":["46","43"],
    "Comercio al por menor":["46"],
    "Comercio al por mayor":["43"],
    "Comercio Electrónico":["46","51"],
    "Alimentos y Bebidas":["31"],
    "Bebidas Alcoholicas":["31"],
    "Consumo Masivo (FMCG)":["31","46"],
    "Telecomunicaciones":["51"],
    "Medios y Entretenimiento":["51","71"],
    "Entretenimiento":["71","51"],
    "Servicios Financieros":["52"],
    "Banca Digital":["52"],
    "Fintech / Banca Digital":["52"],
    "Seguros":["52"],
    "Aseguradoras":["52"],
    "Procesadores de pagos":["52"],
    "Automotriz":["43","46"],
    "Armadoras":["31","43"],
    "Salud":["62"],
    "Farma y Salud":["62","31"],
    "Farmacéuticas":["31","62"],
    "Farmacias":["46"],
    "Grupos Hospitalarios":["62"],
    "Construcción":["23"],
    "Cementeras":["31","23"],
    "Infraestructura":["23"],
    "Transporte y Logística":["48","49"],
    "Movilidad y transporte":["48","49"],
    "Aerolíneas y aviación":["48"],
    "Plataformas de Viajes":["51","72"],
    "Turismo y Hospitalidad":["72"],
    "Hoteles":["72"],
    "Hotelera y viajes":["72"],
    "Turistica":["72"],
    "Restaurantes":["72"],
    "Restaurantes y QRS":["72"],
    "Cines":["71"],
    "Parques de Diversiones":["71"],
    "Casinos":["71"],
    "Deportes y Recreación":["71"],
    "Tecnología":["54","51"],
    "Software y Tecnología":["54","51"],
    "Servicios de Suscripción (SaaS B2B)":["54"],
    "Logística / SCM (B2B Crítico)":["48","49"],
    "Educación":["61"],
    "Gobierno":["93"],
    "Gobierno y Sector Público":["93"],
    "Bienes raices":["53"],
    "Inmobiliarias":["53"],
    "Energía y Servicios Públicos":["22"],
    "Energías Renovables":["22"],
    "Petróleo y Gas":["21","22"],
    "Minería":["21"],
    "Textil":["31"],
    "Fibras":["31","32"],
    "Ferretería":["46","43"],
    "Centros Comerciales":["53","46"],
    "DOOH Networks":["51"],
    "Cuidado personal  y belleza":["46","31"],
    "Consultoria y Servicios Profesionales":["54","55"],
    "Manufactura ligera (turnos fijos)":["31","32","33"],
    "Manufactura":["31","32","33"],
    "StartUps":["54","52"],
    "Ventas Directas (Cambaceo)*":["46"],
    "Trade Marketing (BTL)*":["54"],
    "Financiera":["52"],
    "E-commerce (Gran Volumen)":["46","51"],
    "Salud / Farmacéutico (Gestión)":["62","31"],
}

ICP = {
    "HOF": {
        "industrias": ["Medios y Entretenimiento","Retail","Telecomunicaciones",
                       "Alimentos y Bebidas","Automotriz","Transporte y Logística",
                       "Turismo y Hospitalidad","Deportes y Recreación","Entretenimiento"],
        "decisor": "CMO · Director creativo · Director de cuentas · Director digital",
        "influenciador": "Gerente de Marketing · Gerente Creativo",
        "evaluador": "Supervisor de compras",
        "budget": "$70K – $4M MXN",
        "tiers": {"Tier 1": [], "Tier 2": [], "Tier 3": []},
    },
    "MU": {
        "industrias": ["Servicios Financieros","Retail","Bebidas Alcoholicas","Armadoras",
                       "Transporte y Logística","Bienes raices","Telecomunicaciones",
                       "Tecnología","Farma y Salud","Salud","Entretenimiento",
                       "Restaurantes","Educación","Hotelera y viajes","Turistica",
                       "Gobierno","Construcción","Alimentos y Bebidas"],
        "decisor": "CMO · CHRO · CPO · Dir. Mercadotecnia",
        "influenciador": "Gerente de Marketing · Directores de Eventos",
        "evaluador": "Gerente de compras · Gerente de ventas",
        "budget": "Stands $98K–$984K · Eventos ~$1M · BTL ~$70K MXN",
        "tiers": {},
    },
    "MEXA": {
        "industrias": ["Retail","Servicios Financieros","Petróleo y Gas","Energías Renovables",
                       "Telecomunicaciones","Grupos Hospitalarios","Fibras","Alimentos y Bebidas",
                       "Textil","Aerolíneas y aviación","Transporte y Logística",
                       "Aseguradoras","Procesadores de pagos","Medios y Entretenimiento",
                       "Parques de Diversiones","Energía y Servicios Públicos","Tecnología",
                       "Software y Tecnología","Infraestructura","Farmacéuticas","Farmacias",
                       "Automotriz","Turismo y Hospitalidad","Cines","Salud","Construcción",
                       "Cementeras","Cuidado personal  y belleza"],
        "decisor": "CMO · CEO · Director de Marketing",
        "influenciador": "Gerente de Marketing",
        "evaluador": "Área de Compras",
        "budget": "$180K – $900K MXN · Central de medios $700K",
        "tiers": {
            "Tier 1": ["Retail","Servicios Financieros","Petróleo y Gas","Energías Renovables",
                       "Telecomunicaciones","Grupos Hospitalarios","Fibras"],
            "Tier 2": ["Alimentos y Bebidas","Textil","Aerolíneas y aviación","Transporte y Logística",
                       "Aseguradoras","Procesadores de pagos","Medios y Entretenimiento",
                       "Parques de Diversiones","Energía y Servicios Públicos","Tecnología",
                       "Software y Tecnología","Infraestructura","Farmacéuticas","Farmacias"],
            "Tier 3": ["Automotriz","Turismo y Hospitalidad","Hoteles","Plataformas de Viajes",
                       "Cines","Casinos","Salud","Construcción","Cementeras","Inmobiliarias",
                       "Cuidado personal  y belleza","Ferretería"],
        },
    },
    "PE": {
        "industrias": ["Salud","Tecnología","Servicios Financieros","Telecomunicaciones",
                       "Medios y Entretenimiento","Turismo y Hospitalidad","Automotriz",
                       "Alimentos y Bebidas","Gobierno y Sector Público","Retail",
                       "Comercio Electrónico","Transporte y Logística","Seguros",
                       "Deportes y Recreación","Restaurantes"],
        "decisor": "CMO · Dir. Marketing Digital · Gerente de Medios · Brand Manager",
        "influenciador": "Dir Trade Mkt · Gerente de Mkt Digital",
        "evaluador": "Gerente de Medios · Ads Op",
        "budget": "DOOH $220K · Programmatic $50K · Conexión Digital $100K MXN",
        "tiers": {},
    },
    "RL": {
        "industrias": ["Telecomunicaciones","Automotriz","Retail",
                       "Consumo Masivo (FMCG)","Farma y Salud","Alimentos y Bebidas",
                       "Servicios Financieros"],
        "decisor": "Director de inteligencia de mercados",
        "influenciador": "—",
        "evaluador": "Gerente Jr de Investigación e Inteligencia comercial",
        "budget": "NPS $70K · Geomarketing $150K · Salud de marca $200K MXN",
        "tiers": {},
    },
    "NC": {
        "industrias": ["Servicios Financieros","Retail","Alimentos y Bebidas",
                       "Tecnología","Software y Tecnología","Salud","Farmacéuticas",
                       "Automotriz","Transporte y Logística"],
        "decisor": "CEO · Director de Sistemas/IT · CFO · Director General",
        "influenciador": "Gerente de Sistemas · Gerente de Capital Humano",
        "evaluador": "Delivery Manager · Director de Proyectos TI · PMO",
        "budget": "Desarrollo $300K–$1.5M · IT Staff $270K/recurso/3m MXN",
        "tiers": {},
    },
    "UIX": {
        "industrias": ["Fintech / Banca Digital","E-commerce (Gran Volumen)",
                       "Servicios de Suscripción (SaaS B2B)","Logística / SCM (B2B Crítico)",
                       "Salud / Farmacéutico (Gestión)","Telecomunicaciones",
                       "Retail","Servicios Financieros"],
        "decisor": "Product Director · Head of Product · VP Product · CDO · Innovation Director",
        "influenciador": "CMO · VP de Marketing · UX Manager · Director de UX/UI",
        "evaluador": "IT Procurement · Gerente de Adquisiciones de TI",
        "budget": "Desde $120K MXN · Staffing variable",
        "tiers": {},
    },
    "ZU": {
        "industrias": ["Educación","Construcción","Consultoria y Servicios Profesionales",
                       "Manufactura ligera (turnos fijos)","StartUps",
                       "Ventas Directas (Cambaceo)*","Trade Marketing (BTL)*",
                       "Financiera","Retail"],
        "decisor": "CEO · CHRO · CPO · COO",
        "influenciador": "Gerente de RRHH · Gerente de Operaciones · Dir. Innovación/TI",
        "evaluador": "Supervisor de compras",
        "budget": "100 licencias $120K/año · Iguala mensual $3,500 MXN",
        "tiers": {},
    },
}

CUENTAS_RAW = """3B\tHOF
3M\tMU
3M\tRL
3M\tUIX
Afirme Grupo Financiero\tNC
7 ELEVEN\tPE
99minutos\tMEXA
ABBOTT\tPE
ABBOTT\tRL
ABBVIE\tRL
ADIDAS\tHOF
ADIDAS\tPE
ADIDAS\tRL
ADO\tHOF
ADO\tMEXA
AEROMEXICO\tPE
AIRBNB\tHOF
AIRBNB\tPE
AIRBNB\tUIX
ALPURA\tMU
ALPURA\tPE
ALPURA\tRL
ALSEA\tHOF
ALSEA\tPE
ALSEA\tNC
AMAZON\tPE
AMAZON\tRL
AMERICAN EXPRESS\tPE
AMERICAN EXPRESS\tRL
AMERICAN EXPRESS\tUIX
ANA Seguros\tNC
ARCA CONTINENTAL\tRL
AT&T\tMU
AT&T\tPE
AT&T\tUIX
ASTRAZENECA\tMU
ASTRAZENECA\tRL
ASTRAZENECA\tUIX
ATLAS\tPE
AUTOZONE\tRL
AXA\tRL
AXA SEGUROS\tPE
AXA\tUIX
BACHOCO\tHOF
BACHOCO\tMU
BACHOCO\tRL
BANORTE\tHOF
BANORTE\tPE
BBVA\tMU
BBVA\tRL
BBVA BANCOMER\tPE
BBVA México\tNC
BAYER\tMU
BAYER\tPE
BAYER\tRL
BAYER\tUIX
BIMBO\tMU
BIMBO\tPE
BIMBO\tUIX
BMW\tPE
BMW GROUP\tRL
BMW Group México\tNC
BODEGA AURRERA\tPE
BP\tPE
BURGER KING\tPE
BURGER KING\tUIX
CARGILL\tRL
CARGILL\tUIX
CEMEX\tMU
CEMEX\tHOF
CEMEX\tUIX
CHEDRAUI\tHOF
CHEDRAUI\tPE
CHEDRAUI\tNC
Cinemex\tUIX
CINEMEX\tHOF
CINEMEX\tPE
CINEMEX\tRL
Cinépolis\tUIX
CINEPOLIS\tHOF
CINEPOLIS\tPE
CINEPOLIS\tRL
CITIBANAMEX\tRL
CITI BANAMEX\tPE
CITY CLUB\tHOF
COCA COLA\tMU
COCA COLA\tPE
COCA COLA DE MÉXICO\tRL
Coca Cola De México\tUIX
COLGATE\tHOF
COLGATE\tMU
COLGATE\tPE
COLGATE PALMOLIVE\tRL
CONVERSE\tRL
COPPEL\tHOF
COPPEL\tRL
COPPEL\tUIX
COSTCO\tRL
COSTCO\tUIX
CUAUHTEMOC MOCTEZUMA\tMU
DANONE\tMU
DANONE\tPE
DANONE\tRL
DANONE\tUIX
DHL\tPE
DHL\tUIX
DIAGEO\tHOF
DIAGEO\tMU
DIAGEO\tPE
DIAGEO\tRL
DIDI\tHOF
DIDI\tPE
DIDI\tUIX
DISNEY\tPE
ELECTRONIC ARTS\tPE
EL PALACIO DE HIERRO\tRL
EMIRATES\tPE
ESSITY\tPE
ESSITY\tRL
ESSITY\tUIX
ESTÉE LAUDER\tRL
Estée Lauder\tUIX
EXPEDIA\tPE
FARMACIAS BENAVIDES\tRL
FARMACIAS DEL AHORRO\tHOF
FARMACIAS DEL AHORRO\tPE
FARMACIAS DEL AHORRO\tRL
Farmacias del Ahorro\tUIX
FARMACIAS GUADALAJARA\tHOF
Farmacias Guadalajara\tUIX
FARMACIAS SIMILARES\tPE
FARMACIAS SIMILARES\tRL
Farmacias Similares\tUIX
FEMSA\tRL
FEMSA\tUIX
FERRERO\tPE
FORD\tPE
FORD MOTOR COMPANY\tRL
Ford México\tNC
GE\tRL
GENERAL MOTORS\tMU
GENERAL MOTORS\tPE
GENERAL MOTORS\tRL
General Motors México\tNC
GENOMMA LAB\tRL
Genomalab\tUIX
GNP\tRL
GNP\tUIX
GOODYEAR\tPE
GRUMA\tRL
GRUPO BIMBO\tHOF
GRUPO BIMBO\tRL
GRUPO CARSO\tRL
GRUPO COMERCIAL CHEDRAUI\tRL
GRUPO CORPORATIVO FRAGUA\tRL
GRUPO FINANCIERO BANORTE\tRL
Grupo Financiero Banorte\tNC
GRUPO FINANCIERO INBURSA\tRL
GRUPO GIGANTE\tHOF
GRUPO GIGANTE\tRL
Gigante\tUIX
GRUPO HEINEKKEN\tHOF
GRUPO HERDEZ\tHOF
GRUPO HERDEZ\tRL
GRUPO JUMEX\tRL
GRUPO LA COMER\tRL
Grupo La Comer\tUIX
GRUPO LALA\tHOF
GRUPO LALA\tRL
GRUPO MODELO\tHOF
GRUPO MODELO\tMU
GRUPO MODELO\tPE
GRUPO MODELO\tRL
GRUPO MODELO\tUIX
GRUPO POSADAS\tHOF
GRUPO POSADAS\tMU
GRUPO POSADAS\tPE
GRUPO POSADAS\tRL
Grupo Posadas\tUIX
GRUPO XCARET\tHOF
Grupo Xcaret\tUIX
GSK\tMU
GSK- HALEON\tPE
HASBRO\tPE
HEB\tHOF
HEB\tRL
HEINEKEN\tMU
HEINEKEN\tPE
HEINEKEN MÉXICO\tRL
HENKEL\tRL
HERDEZ\tMU
HERDEZ\tPE
HILTON\tMU
HOME DEPOT\tPE
HOME DEPOT\tRL
Home Depot\tUIX
HONDA\tMU
HONDA\tPE
HONDA\tRL
Honda México\tNC
HSBC\tMU
HSBC\tPE
HSBC\tRL
HSBC México\tNC
HYUNDAI\tPE
HYUNDAY\tRL
IKEA\tPE
IKEA\tRL
IKEA\tUIX
INDITEX\tRL
INDITEX\tUIX
Inbursa\tUIX
Infonavit\tUIX
J&J\tMU
J&J\tRL
JOHNSON & JOHNSON\tPE
JOHNSON & JOHNSON\tRL
JARRITOS\tRL
JOSE CUERVO\tRL
José Cuervo\tUIX
KAVAK\tPE
KAVAK\tRL
KAVAK\tUIX
KELLOGS\tMU
KELLOGS\tPE
KELLOGG'S\tRL
Kellogg's\tUIX
KFC\tPE
KIA\tMU
KIA\tPE
KIA MOTORS\tRL
Kia México\tNC
KIMBERLY CLARK\tHOF
KIMBERLY CLARK\tPE
Kimberly Clark\tUIX
L'OREAL\tPE
L'OREAL\tRL
LALA\tMU
LALA\tPE
LALA\tRL
LEGO\tPE
LEGO\tRL
LG\tHOF
LG\tPE
Liverpool\tHOF
LIVERPOOL\tPE
LIVERPOOL\tRL
Liverpool\tNC
Liverpool\tUIX
LULULEMON\tRL
MABE\tPE
MABE\tUIX
MAPFRE México\tNC
MARRIOT INTERNATIONAL\tMU
MARS\tMU
MARS\tPE
MARS\tRL
MASTERCARD\tPE
MASTERCARD\tRL
MasterCard\tUIX
MATTEL\tPE
MATTEL\tRL
MAZDA\tMU
MAZDA\tPE
MAZDA\tRL
MC DONALDS\tPE
MCDONALD'S\tHOF
MCDONALDS\tRL
McDonalds\tUIX
MEDICA SUR\tHOF
MEGACABLE\tRL
MERCEDES BENZ\tPE
MERCADO LIBRE\tPE
MERCADO LIBRE\tRL
Mercado Libre\tUIX
MERCK\tMU
METLIFE\tRL
Met life\tUIX
MONDELEZ\tMU
MONDELEZ\tPE
MONDELEZ\tRL
MONTE DE PIEDAD\tPE
MOVISTAR\tMU
MOVISTAR\tPE
Movistar\tUIX
MSD\tRL
NATURA\tHOF
NATURA\tPE
NATURA\tRL
NESTLE\tHOF
NESTLE\tMU
NESTLÉ\tPE
NESTLÉ\tRL
Nestlé\tUIX
NETFLIX\tPE
NETFLIX\tRL
NIKE\tPE
NIKE\tRL
Nike\tUIX
NISSAN\tHOF
NISSAN\tMU
NISSAN\tPE
NISSAN\tRL
NOVARTIS\tMU
NOVARTIS\tPE
NOVARTIS\tRL
Novartis\tUIX
NU\tPE
NUBANK\tRL
Nubank\tUIX
OXXO\tHOF
OXXO\tPE
OXXO\tRL
OXXO\tUIX
P&G\tRL
P&G\tUIX
PALACIO DE HIERRO\tPE
Palacio de Hierro\tNC
Palacio de Hierro\tUIX
PASCUAL\tRL
PEÑAFIEL\tPE
Peñafiel\tUIX
PEPSICO\tPE
PEPSICO\tRL
PERNOD RICARD\tPE
PFIZER\tHOF
PFIZER\tMU
PFIZER\tPE
PFIZER\tRL
PFIZER\tUIX
PISA FARMACÉUTICA\tRL
PROCTER & GAMBLE\tPE
PROCTER AND GAMBLE\tHOF
PROFUTURO\tRL
Profuturo\tUIX
QUALITAS\tRL
Qualitas\tUIX
RECKITT\tPE
RED BULL\tPE
RED BULL\tRL
RIU\tMU
RIU HOTELES\tHOF
ROCHE\tRL
SAMSUNG\tMU
SAMSUNG\tPE
SAMSUNG\tRL
SANTANDER\tMU
SANTANDER\tPE
SANTANDER\tRL
Santander México\tNC
SCOTIABANK\tHOF
SCOTIABANK\tPE
SCOTIABANK\tRL
Scotiabank México\tNC
SEARS\tHOF
SIGMA\tHOF
SIGMA\tPE
SIGMA ALIMENTOS\tMU
SIGMA ALIMENTOS\tRL
Sigma\tUIX
SIX FLAGS\tHOF
SIX FLAGS\tPE
SODIMAC\tPE
SONY\tRL
SONY PICTURES\tPE
SORIANA\tHOF
SORIANA\tPE
Soriana\tNC
Organización Soriana\tUIX
STELLANTIS\tPE
SUBARU\tPE
SUBURBIA\tPE
SUKARNE\tRL
SURA\tPE
Sura\tUIX
TELCEL\tMU
TELCEL\tPE
Telcel\tUIX
TEC DE MONTERREY\tPE
TECNOLÓGICO DE MONTERREY\tRL
TESLA\tPE
TESLA\tRL
THE HOME DEPOT\tRL
TIFFANY\tPE
TOYOTA\tPE
TOYOTA\tRL
Toyota México\tNC
TRIVAGO\tPE
UBER\tMU
UBER\tPE
UBER\tRL
Uber\tUIX
UM (IPG)\tHOF
UNILEVER\tHOF
UNILEVER\tMU
UNILEVER\tPE
UNILEVER\tRL
Unilever\tUIX
UNIVERSIDAD PANAMERICANA\tRL
VISA\tPE
VISA\tRL
Visa\tUIX
VIVAAEROBUS\tPE
VIVA AEROBUS\tMU
Vivaerobus\tMEXA
VOLKSWAGEN\tMU
VOLKSWAGEN\tPE
VOLKSWAGEN\tRL
Volkswagen de México\tNC
VOLARIS\tMU
VOLARIS\tPE
Volaris\tUIX
VOLVO\tPE
VOLVO\tRL
Walmart\tHOF
WALMART\tPE
WALMART MÉXICO Y CENTROAMÉRICA\tRL
Walmart de México\tNC
WARNER\tHOF
WARNER\tPE
WHIRLPOOL\tPE
XBOX\tPE
XIAOMI\tPE
YAKULT\tPE
YAKULT\tRL
RAPPI\tUIX
Rappi\tUIX
INDITEX\tUIX
ROTOPLAS\tUIX
Rotoplas\tUIX
Sanborns\tUIX
SANBORNS\tUIX
Sanofi\tUIX
SC Johnson\tUIX
SANOFI\tPE
SANOFI\tRL
SOFTTEK\tUIX
Softtek\tUIX
SixFlags México\tUIX
The Good Group\tUIX
The Home Depot\tUIX
HSBC México\tNC
Liverpool\tNC
ADO\tMEXA
Home Depot\tMEXA
HDI\tMEXA
Ilusión\tMEXA
Impuls\tMEXA
InDrive\tMEXA
Innovasport\tMEXA
Interceramic\tMEXA
Jarritos\tMEXA
Julio\tMEXA
Jumex\tMEXA
Justo\tMEXA
Karosso\tMEXA
Kichink\tMEXA
Kidzania\tMEXA
La costeña\tMEXA
La Morena\tMEXA
Laboratorios Pisa\tMEXA
Laboratorios Silanes\tMEXA
Leche Sello Rojo\tMEXA
Lechera Guadalajara\tMEXA
Leonardo's\tMEXA
Linio México\tMEXA
Liomont\tMEXA
Lumen\tMEXA
Luuna\tMEXA
Martí\tMEXA
MaxiModa\tMEXA
Mercado Libre México\tMEXA
Mibo\tMEXA
Moda Club\tMEXA
Muebles América\tMEXA
Muebles Dico\tMEXA
Netshoes México\tMEXA
New Era\tMEXA
Nutrisa\tMEXA
OCC\tMEXA
Orange Crush\tMEXA
Ozon\tMEXA
Panam\tMEXA
Pasteurizadora Jersey\tMEXA
Price Shoes\tMEXA
Primera Plus\tMEXA
Praval México\tMEXA
Productos Chata\tMEXA
Productos Verde Valle\tMEXA
Red Cola\tMEXA
Ricolino\tMEXA
Sabormex\tMEXA
Sal la fina\tMEXA
Salsa Huichol\tMEXA
San Marcos\tMEXA
Santa Clara\tMEXA
Selva Mágica\tMEXA
Shasa\tMEXA
Shine\tMEXA
Six Flags México\tMEXA
Soriana Express\tMEXA
Steren\tMEXA
Stori\tMEXA
Super Kompras\tMEXA
Tajin\tMEXA
Tamarindo\tMEXA
Tio yeyo\tMEXA
Topo Chico\tMEXA
Torres y García\tMEXA
Truper\tMEXA
Tugow\tMEXA
TUL\tMEXA
Turistar\tMEXA
Vicky Form\tMEXA
Vivaerobus\tMEXA
Vitromex\tMEXA
Waldo's\tMEXA
Winia Ofix\tMEXA
Xcaret\tMEXA
Yoli\tMEXA
YoTePresto\tMEXA
Zingara\tMEXA
La Parisina\tMEXA
Konfío\tMEXA
Kueski\tMEXA
HD Seguridad Privada\tZU
Hot dog Ramírez\tZU
INGREDIENTA GOURMET\tZU
Joinos bagels\tZU
Kapital Banco\tZU
La cabaña\tZU
La Casa de Toño\tZU
La Casa del Cine\tZU
La fonda del recuerdo\tZU
LA OAXAQUEÑA\tZU
Los gallos\tZU
Los loosers\tZU
Lucky Sushi\tZU
Operadora hotel hsfh\tZU
PANMEX\tZU
Pastes Polanco\tZU
Pata negra Condesa\tZU
Pirates burguers\tZU
Potzolcalli\tZU
Procontrol Seguridad\tZU
Prosegur México\tZU
Protector S.A. de C.V.\tZU
Rosa Camelia\tZU
Salón Vaquero\tZU
Securflex\tZU
Securitas México\tZU
Segurhorus\tZU
Seguridad Capu\tZU
Seguridad Global\tZU
Seguridad Integral SISEC\tZU
Seguridad Privada Alcor\tZU
Seguridad Privada Delta\tZU
Seguridad Privada Let System\tZU
Seguridad Privada Sentinel\tZU
Seguridad y Vigilancia SEVISA\tZU
Seguritech\tZU
Servicios de Seguridad GSP\tZU
Servicios de Seguridad SSP\tZU
Sistemas de Seguridad SSI\tZU
Sushi hokoki\tZU
Tacos Beatriz\tZU
Takechis\tZU
Títere fue\tZU
Tlachiquero\tZU
Vigilancia Yavari\tZU
Vigilantes Privados VIMSA\tZU
Xexek cocina de barrio\tZU
Yutumy\tZU
Joinos bagels\tZU
La Casa de Toño\tZU"""

def normalizar(s: str) -> str:
    s = str(s).upper().strip()
    s = re.sub(r"[^\w\s]", " ", s)
    s = re.sub(r"\s+", " ", s)
    for sfx in ["SA DE CV","S DE RL","SAPI DE CV","SC","AC","IAP","SA","SRL","SARL",
                "DE MEXICO","DE MéXICO","MEXICO","S A DE C V"]:
        s = re.sub(rf"\b{sfx}\b", "", s)
    return s.strip()

def main():
    icp = {}
    for udn_id, data in ICP.items():
        scian_2 = set()
        for ind in data["industrias"]:
            scian_2.update(SCIAN_POR_INDUSTRIA.get(ind, []))
        icp[udn_id] = {
            "industrias_icp": data["industrias"],
            "scian_2_icp": sorted(scian_2),
            "decisor": data["decisor"],
            "influenciador": data["influenciador"],
            "evaluador": data["evaluador"],
            "budget": data["budget"],
            "tiers_por_industria": data["tiers"],
            "cuentas_objetivo": [],
        }

    cuentas_por_udn: dict[str, list[str]] = {k: [] for k in icp}
    for line in CUENTAS_RAW.strip().splitlines():
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        nombre, udn_raw = parts[0].strip(), parts[1].strip()
        udn = UDN_MAP.get(udn_raw)
        if not udn or not nombre:
            continue
        key = normalizar(nombre)
        if key and key not in cuentas_por_udn.get(udn, []):
            cuentas_por_udn.setdefault(udn, []).append(key)

    for udn, lista in cuentas_por_udn.items():
        if udn in icp:
            icp[udn]["cuentas_objetivo"] = sorted(set(lista))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(icp, f, ensure_ascii=False, indent=2)

    total_cuentas = sum(len(v["cuentas_objetivo"]) for v in icp.values())
    print(f"✅ icp_data.json generado: {len(icp)} UDNs, {total_cuentas} cuentas objetivo")
    for udn, v in icp.items():
        print(f"   {udn}: {len(v['cuentas_objetivo'])} cuentas · {len(v['scian_2_icp'])} SCIAN")
    print(f"\nArchivo: {OUT}")

if __name__ == "__main__":
    main()
