> **Autoría:** Proyecto original de Diego Leonel Luna López (@dlunalop).
> Desarrollado como parte de la tesis de maestría MCDI en INFOTEC/CONACYT (2025-2026).
> Adaptado para implementación en UPAX RevOps — Grupo Salinas.
> Repositorio original: github.com/dlunalop/brujula-comercial-upax

# 🧭 Brújula Comercial — UPAX RevOps

## Descripción
Modelo analítico de prospección B2B basado en temporalidad económica sectorial.
Cruza el CRM de HubSpot contra el DENUE y el IGAE del INEGI para identificar
el momento óptimo de prospección por sector económico y UDN.

## Stack
- **Modelo:** Python, Google Colab, Prophet (Meta)
- **Datos:** HubSpot Repository v3, DENUE 32 estados, IGAE INEGI
- **Almacenamiento:** Google Drive (parquets)
- **Interfaz:** Next.js + Vercel + Google Sheets (backend)

## Arquitectura del modelo

### Motor 1 — Identidad
Recupera el sector SCIAN de leads sin industria en HubSpot.
- **Grupo A** (34,055 leads sin industria): Fuzzy Match Jaro-Winkler
  contra DENUE nacional (6M establecimientos, 32 estados)
- **Grupo B** (9,413 leads con industria HubSpot): mapeo directo
  de 147 industrias HubSpot → código SCIAN 2 dígitos
- **Output:** `df_maestro` — 22,317 leads con `scian_2d`

### Motor 2 — Temporalidad
Asigna temperatura económica a cada lead según su sector y fecha.
- Carga IGAE desestacionalizado del INEGI (18 sectores, 1993-2026)
- Calcula Z-score por sector (base 2018-2025)
- Etiquetas: 🔴 Caliente (Z≥1.0) 🟡 Templado (Z≥0.5) 🟠 Tibio (Z≥0.0) 🔵 Frío (Z<0.0)
- Cruza `df_maestro` × IGAE → `df_brujula`
- Entrena Prophet (18 modelos) → forecast 12 meses por sector

## Archivos guardados en Drive
```
/content/drive/MyDrive/Brujula_Comercial_Data/
├── denue_nacional.parquet       # DENUE 32 estados (98.8 MB)
├── resultado_match_denue.parquet # Match Jaro-Winkler (1.4 MB)
├── df_maestro.parquet           # 22,317 leads con scian_2d (0.6 MB)
├── df_brujula.parquet           # leads con temperatura IGAE (0.7 MB)
├── df_forecast.parquet          # forecast Prophet 12 meses (pequeño)
└── igae_indice.xlsx             # IGAE original INEGI
```

## Campos clave del df_maestro
| Campo | Descripción |
|-------|-------------|
| `ID de registro` | ID único HubSpot |
| `Nombre de la empresa` | Original HubSpot |
| `empresa_normalizada` | Nombre oficial DENUE |
| `Industria` | Original HubSpot |
| `industria_normalizada` | Sector SCIAN oficial |
| `scian_2d` | Código 2 dígitos para cruce IGAE |
| `fuente_scian` | `denue_match` o `mapeo_hubspot` |
| `Fecha creación / reunión` | Ancla temporal Motor 2 |

## Sectores SCIAN disponibles en IGAE
| Código | Sector | Temp. actual (ene 2026) |
|--------|--------|------------------------|
| 21 | Minería y petróleo | 🔵 Frío |
| 22 | Electricidad y agua | 🔵 Frío |
| 23 | Construcción | 🔴 Caliente |
| 31 | Manufactura | 🟠 Tibio |
| 43 | Comercio al por mayor | 🟠 Tibio |
| 46 | Comercio al por menor | 🔴 Caliente |
| 48 | Transportes y logística | 🔴 Caliente |
| 51 | Telecomunicaciones y medios | 🔴 Caliente |
| 52 | Servicios financieros | 🔴 Caliente |
| 53 | Servicios inmobiliarios | 🔴 Caliente |
| 54 | Servicios profesionales y TI | 🔴 Caliente |
| 56 | Servicios de apoyo a negocios | 🔵 Frío |
| 61 | Servicios educativos | 🔴 Caliente |
| 62 | Servicios de salud | 🔴 Caliente |
| 71 | Entretenimiento | 🟡 Templado |
| 72 | Alojamiento y restaurantes | 🟠 Tibio |
| 81 | Otros servicios | 🟡 Templado |
| 93 | Gobierno | 🟡 Templado |

## Resultados del modelo
- **Cobertura Motor 1:** 51.3% del pipeline con scian_2d
- **Cobertura Motor 2:** 77.6% con temperatura económica
- **Hipótesis validada:** leads con "sin presupuesto" tienen
  el doble de proporción en temperatura Tibia vs pipeline general
- **Forecast Prophet:** 7 sectores Calientes proyectados
  los 12 meses de 2026

## Interfaz — Fase siguiente
### Vista Director
- Tabla de forecast sector × mes (emojis de temperatura)
- Temperatura actual vs histórica
- Alertas de cambio de temperatura

### Vista Operativa (SDRs)
- Semáforo por sector: ¿prospectar o no?
- Lista de leads a reactivar (rescue pipeline)
- Recomendación semanal por UDN

## Pendiente
- [ ] Ciclos de venta por UDN (censo con gerentes)
- [ ] Capa de anticipación: mes pico − ciclo de venta
- [ ] Rescue pipeline: reactivar leads Frío que ahora son Caliente
- [ ] Integración API IGAE (automatizar actualización mensual)
- [ ] Deploy interfaz en Vercel

## Contexto de negocio
- **Empresa:** UPAX (Grupo Salinas) — holding B2B con 9 UDNs
- **UDNs:** UIX, Marketing United, Researchland, Zeus, Promo Espacio,
  House of Films, Neracode, Mexa Creativa, UPAX
- **Equipo beneficiado:** Performance y Conversión (pauta),
  SDRs (prospección), Comerciales (forecast de cierre)
- **Tesis INFOTEC MCDI:** "Modelo predictivo de timing comercial
  basado en indicadores macroeconómicos sectoriales del INEGI"
