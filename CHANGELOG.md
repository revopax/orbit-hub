
## [1.7.0] — 2026-07-17 — Diego Luna
### Estrategia — Cruce de señales para diferenciación vs. 6sense/Demandbase (ROADMAP)
- **Diagnóstico de mercado**: 6sense y Demandbase solo tienen señal reactiva (intent data externo,
  comportamiento de búsqueda ya manifestado). Ninguna cruza con un indicador macroeconómico
  estructural independiente. Ahí está la ventaja arquitectónica de la Brújula, sin importar
  qué hipótesis de rezago temporal resulte cierta.
- **4 señales identificadas para el cruce**:
  1. **IGAE estructural** — Z-score mensual por SCIAN, últimos 1-5 años (ya existe, Motor 2/Prophet)
  2. **Contactos propios HubSpot** — fecha de creación de contacto, agrupado por SCIAN ya resuelto
     vía match DENUE (`match_denue.py`). Sirve como corrección del sesgo de agregación: el IGAE mide
     el promedio de toda la industria, esta serie mide específicamente las empresas que UPAX prospecta.
  3. **Señal reactiva (Radar de Intención + Agente de Prospección)** — búsquedas/keywords detectadas
     vía LinkedIn y web, diaria/tiempo real. Pendiente de agregación a serie mensual para el análisis
     estadístico (la cadencia diaria se conserva para la UI de "Actividad de hoy").
  4. **Campañas de Performance (Meta/paid)** — no entra como serie a correlacionar; funciona como
     variable de control/exclusión, para evitar confundir búsqueda orgánica con búsqueda inducida
     por gasto publicitario propio.
- **Metodología de validación — 3 pasos, en este orden**:
  1. **CCF (Cross-Correlation Function)** — descubre el rezago óptimo `k` entre pares de series
     (ej. IGAE vs. contactos HubSpot, por SCIAN). Fórmula: `CCF(k) = correlación(Serie_A(t), Serie_B(t+k))`
     para k = -6..+6 meses. Módulo ya construido: `pipeline/analisis/ccf.py` (`calcular_ccf`).
  2. **Validación holdout** — el `k` óptimo se calcula solo con datos de entrenamiento (ej. 2021-2025)
     y se confirma contra un periodo de prueba no visto (ej. 2026), evitando conclusiones que solo
     ajustan en retrospectiva.
  3. **Regresión (statsmodels OLS)** — una vez validado `k`, cuantifica la fuerza de la relación
     (coeficiente, R², p-value) para uso predictivo real.
- **Criterio de honestidad estadística**: todo resultado debe reportar `p_value` y `n_obs`.
  Con series reactivas cortas (pocos meses de histórico), es esperable que el patrón no sea
  significativo aún — se documenta como tal en UI, no se disfraza de certeza.
- **Caso piloto propuesto**: rama Alimentos y Bebidas (SCIAN 311-312).
  - Serie A: IGAE mensual de la rama, 3-5 años (disponible)
  - Serie B: conteo de contactos HubSpot por mes, filtrado a SCIAN 311-312 (pendiente construir query
    de agregación sobre `concentrado_v3`)
  - Output esperado: `k` óptimo + `p_value`, primer caso de validación real del método
- **Bloqueante actual**: proyecto Supabase de HubSpot (`concentrado_v3`, proyecto `maszpgfnbonwftxobryi`)
  pausado por inactividad — pendiente de reactivación por César para poder correr el caso piloto
  con datos reales.
- **Producto derivado**: nueva navegación en `/preview` (branch `feature/rediseno-comercial-marketing`,
  flag `NEXT_PUBLIC_PREVIEW_MODE`) — 2 módulos por función en vez de vistas por rol jerárquico:
  - **Inteligencia Comercial** — calendario de prospección + cuentas priorizadas por score compuesto
  - **Inteligencia de Demanda** — vista agregada por industria/UDN para Inbound Studio y Performance
  - Score compuesto muestra 3 estados: `convergencia_validada`, `anticipacion_pura`,
    `reactiva_sin_respaldo` — evita la crítica de "score opaco" que enfrentan ambos competidores.
## [1.6.5] — 2026-06-29 — Diego Luna

### Vista del Analista — Tab comparativo entre UDNs
- **Nuevo tab "Analista"** agregado a Topbar (desktop + mobile), alineado con tabs Director/Operativa
  - Desktop: extendido array `['director', 'operativa']` → `['director', 'operativa', 'analista']` con label dinámico
  - Mobile: botón Analista agregado en `topbar-tabs-row` con `mobileTabStyle('analista')`
  - Fix: `tabStyle` y `mobileTabStyle` tipados para aceptar `'director' | 'operativa' | 'analista'`

- **Nuevo componente `VistaAnalista.tsx`** — vista orquestadora de comparativa UDN con 6 bloques:
  1. `UDNSelector` — selector multi-UDN con pills coloreados y persistencia en localStorage
  2. `BloqueCalidadLeads` — score de adecuación e interacción por UDN, barras de segmentos A1/B2/C
  3. `RadarPerdidas` — radar SVG de top 6 motivos de descalificación normalizados por UDN
  4. `BloqueSectoresCompetencia` — matriz de solapamiento de sectores con temperatura IGAE + mes pico
  5. `BloqueCrossSell` — empresas reales presentes en 2+ UDNs (toggle incluir contactos)
  6. `BloqueCegueraOperativa` — % de campos vacíos por UDN (motivo, empresa, industria, valor, fecha)

- **Integración en `Dashboard.tsx`** — rama `vista === 'analista'` insertada en ternario principal,
  envuelta en `<motion.div>` con `key={`an-${id}`}`, `style={WRAP}`, y animaciones `fade-up` consistentes
  con Director y Operativa

- **Fixes visuales masivos** — todos los bloques de Analista estilizados para tema dark/light consistente:
  - Backgrounds: `bg-white` / `bg-slate-800` → `bg-[var(--card-bg)]`
  - Textos: `text-slate-*` → `text-[var(--txt-1)] .. [var(--txt-5)]`
  - Bordes: `border-slate-*` → `border-[var(--border)]`
  - Badges de color: `bg-red-50 text-red-700` → `bg-red-500/10 text-red-500` (funciona en ambos temas)
  - Layout: eliminado `max-w-6xl mx-auto`, ahora `w-full` como Director/Operativa
  - Espaciado: `space-y-10` entre bloques + `mt-10` separadores para evitar amontonamiento
  - Radar: aumentado a 360px, fillOpacity 30%, strokeWidth 3px, labels 11px para mejor legibilidad
  - Textos: todos los `text-[10px]` → `text-xs` (12px mínimo) para lectura confortable
  - Header: eliminado título "Vista del Analista" — el selector de UDNs es el punto focal

- **Hallazgos EDA integrados como KPIs destacados**:
  - 78% pipeline sin calificar (problema de proceso, no timing)
  - 0.0% tasa conversión Marketing (leads no se califican)
  - 83 empresas reales en 2+ UDNs (cross-sell real vs 5,989 contactos campañas)

### SCIAN name normalization (completado en v1.6.3, validado hoy)
- Script `pipeline/normalizar_nombres_scian.py`: 327 + 194 correcciones aplicadas
- 8,686 registros adicionales sincronizados con diccionario oficial SCIAN 2018
- Cobertura SCIAN: 86.5% alcanzada

### Pendientes
- Validar visualmente en mobile que espaciado entre bloques sea adecuado
- Ajustar tamaño de fuente en tablas de sectores y cross-sell si aún se ve pequeño

## [1.6.3] — 2026-06-25 — Diego Luna

### Integración 15,427 nuevos registros Supabase (mayo-junio 2026)
- Maestro actualizado: 75,969 → 91,396 registros
- Capa 0 catálogo: +2,666 clasificados
- Capa 2 industria HubSpot: +1,150 clasificados
- Groq residuo: +2,016 clasificados
- Sin clasificar: 12,376 (13.5%)
- Fix tipos mixtos en concat (Match_Score float64, confianza_scian_baja bool)

### Fix crítico: match_denue usaba nombre_act en lugar de nombre_match
- Bug: construir_catalogo_denue() leía columna nombre_act (987 giros únicos)
  en lugar de nombre_match (435,309 empresas únicas)
- Resultado del bug: catálogo DENUE colapsado a 987 entradas → casi todos sin_match
- Fix: cambiar columns=['nombre_act','codigo_act'] → columns=['nombre_match','codigo_act']
- Impacto: cobertura DENUE en nuevos registros: ~1% → 73.6%

### DENUE match incremental sobre 9,413 registros nuevos
- Corrido con joblib paralelo (11 workers), duración: 150 min
- match_alto: 5,845 (62.1%) | match_bajo: 1,085 (11.5%) | sin_match: 2,483 (26.4%)
- Cobertura total DENUE: 73.6%

### Fix nombres SCIAN duplicados
- Script nuevo: pipeline/normalizar_nombres_scian.py
- 'Manufactura' → 'Industrias manufactureras' (327 registros)
- 'Servicios financieros y seguros' → 'Servicios financieros y de seguros' (194)
- 8,686 adicionales sincronizados con diccionario oficial SCIAN 2018

### Fix groq_llama sobre-clasificando retail
- 2,952 registros groq_llama con baja confianza y SCIAN_2=46 sin Industria limpiados
- Reclasificados por capas determinísticas tras limpieza

### Nuevo orquestador: run_pipeline_supabase.py
- Reemplaza run_pipeline.py (que leía de Google Sheets/Drive — obsoleto)
- run_pipeline.py conservado como referencia histórica, NO ejecutar
- Orden: match_denue → enriquecer_nombres → match_domain → match_capa0
         → integrar_groq → generate_data
- match_denue.py: agrega __main__ para correr incremental sobre Match_Status isna/'None'

### Pendientes próxima sesión
- Correr enriquecer_nombres.py, match_domain.py, match_capa0.py sobre nuevos registros
- Subir df_maestro_backup_20260625.parquet a Google Drive
- Actualizar igae_indice.xlsx en Google Drive con versión ABR 2026
- Investigar por qué leads por UDN no cambian (69,309 con temperatura real)

# Changelog

## [1.6.2] — 2026-06-24 — Diego Luna

### Actualización IGAE a ABR 2026
- Descargado nuevo xlsx del INEGI (Índice, Base 2018=100, series desestacionalizadas)
- Reemplazado pipeline/data/igae_indice.xlsx: FEB 2026 → ABR 2026 (2 meses nuevos)
- Prophet re-entrenado con 18 sectores, último dato real: 2026-04-01
- Forecast actualizado: 7,416 filas hasta ENE 2027

### Fix rutas df_forecast.parquet
- Bug: forecast standalone guardaba en pipeline/data/df_forecast.parquet
  pero generate_data.py lee de data/df_forecast.parquet (ruta diferente)
- Resultado: MAR y ABR 2026 aparecían como historico=None en el JSON
- Fix: cp pipeline/data/df_forecast.parquet data/df_forecast.parquet
- MAR y ABR 2026 ahora correctamente como datos reales en temporalidad

### Impacto de integrar MAR-ABR 2026
- Temperatura de sector más precisa: Z-score calculado con últimos 2 meses reales
- Forecast más confiable: Prophet proyecta desde ABR (antes desde FEB)
- Mes del pico más preciso en tabla de Picos de Temporalidad

### Flujo correcto para actualizar IGAE (documentado)
1. Descargar xlsx INEGI: inegi.org.mx/temas/igae/#tabulados
2. cp ~/Downloads/igae_indice*.xlsx pipeline/data/igae_indice.xlsx
3. Correr script standalone forecast_prophet
4. cp pipeline/data/df_forecast.parquet data/df_forecast.parquet
5. python3 pipeline/generate_data.py && git add && git commit && git push

### Decision de arquitectura — Backtesting forecast vs real (pendiente)
- Guardar snapshot forecast_YYYY-MM.parquet antes de sobreescribir con dato real
- Permite calcular MAE/MAPE por sector y validar calibracion Prophet
- Pendiente implementar en proxima sesion

## [1.6.1] — 2026-06-24 — Diego Luna

### Fix crítico: clasificación incorrecta en denue_match y nombre_match
- 383 empresas únicas mal clasificadas por Jaro-Winkler DENUE
- Causa 1: nombre_norm=nan en registros precargados impedía lookup en Capa 0
- Causa 2: Capa 0 excluía denue_match de sobreescritura
- Fix 1: recalcular nombre_norm donde sea nan antes de Capa 0
- Fix 2: catálogo ahora tiene prioridad absoluta sobre denue_match y nombre_match

### Ampliación catálogo de marcas
- catalogo_marcas: 15,354 → 16,113 registros (+759 correcciones)
- Marcas agregadas: AutoZone, Goodyear, Red Bull, Monster Energy, BBVA variantes,
  Hyundai Motor Mexico, Suzuki, Chirey, Intel, Sony, Philips, Revlon, Oriflame,
  Yves Rocher, Pernod Ricard, Mondelez, Philip Morris, Royal Canin, Castrol, etc.
- denue_match reducido: 9,605 → 9,212

### Fix SCIAN_3_nombre: nomenclatura oficial SCIAN 2018
- Diccionario hardcodeado de 91 subsectores oficiales SCIAN/DENUE
- 53,560 registros con SCIAN_3_nombre corregido
- Subramas incorrectas: 1,693 → 46 residuales
- AutoZone: motocicletas → Comercio al por menor de vehículos de motor, refacciones y combustibles
- BBVA: instrumentos musicales → Banca múltiple y de desarrollo
- Red Bull: frutas y verduras → Comercio al por mayor de abarrotes, alimentos, bebidas y tabaco

### Cobertura final
- Con SCIAN: 71,706 (94.4%) | Sin SCIAN: 4,263 (5.6%)
- catalogo_marcas=16,113 | denue_match=9,212 | groq_llama=7,707

## [1.6.0] — 2026-06-23 — Diego Luna

### IAM — Jerarquía organizacional
- Nuevas columnas en tabla `perfiles` de Supabase (via SQL editor):
  `udn_madre` (text), `reporta_a` (uuid FK → perfiles.id ON DELETE SET NULL),
  `nivel_jerarquico` (text CHECK: principal/gerente/comercial/sdr/analista).
  Índices creados: idx_perfiles_reporta_a, idx_perfiles_udn_madre.
- Backfill automático de `udn_madre` para los 18 usuarios existentes: primer valor
  de su campo `udn` separado por comas, o 'MKT' si no tenían UDN asignada.
  Usuarios sin UDN (Diego Luna, Julio Mejia, Adrian Gonzalez Olivares) → MKT.
  Franco Cruzat e Ileana Cruz quedaron en 'UIX' por default (corregir a 'MKT' desde IAM).
- `reporta_a` y `nivel_jerarquico` quedan NULL para todos — se llenan interactivamente
  desde la UI del IAM, no por script.
- UI interactiva en modales Crear/Editar (`app/iam/page.tsx`): chips/tags para
  `udn_madre` (UIX/MU/PE/ZU/NC/HOF/RL/MEXA/MKT), botones para `nivel_jerarquico`
  (Principal/Gerente/Comercial/SDR/Analista), y dropdown `reporta_a` filtrado por
  `udn_madre` seleccionada (muestra nombre + nivel del candidato).
- Endpoint `/api/iam/editar/route.ts` actualizado para aceptar y persistir los 3 campos nuevos.
- Tabla IAM rediseñada: agrupada visualmente por `udn_madre` con headers colapsables
  (▼/▶), indentación jerárquica con símbolo └ según profundidad de `reporta_a`,
  orden dentro de cada grupo por nivel (principal → gerente → comercial/sdr/analista).
- `construirFilas()`: función que construye el árbol jerárquico desde el flat array de
  usuarios, agrupa por `udn_madre`, ordena por nivel y genera filas de tipo 'header' o
  'user' con profundidad calculada.
- Fix crítico de sintaxis: el IIFE `(() => { ... })()` en el render de filas requirió
  cierre explícito con `sed -i '' '278s/))}$/); })())}/'` — tener en cuenta en futuras
  ediciones del bloque de render de la tabla.
- Commits: ea385da, fix(iam) varios, feat(iam): grupos udn colapsables.

### IAM — Contador de visitas
- Nueva columna `total_visitas integer DEFAULT 0` en tabla `perfiles` (SQL editor).
- Incremento automático en cada login: `app/hooks/useAuth.ts` línea ~29, mismo
  `.update()` que actualiza `ultima_actividad`, ahora también suma
  `total_visitas: (data?.total_visitas ?? 0) + 1`.
- Columna "Visitas" agregada a la tabla IAM entre "Alta" y "Últ. Actividad".
- Sticky header de la tabla: `position:'sticky', top:0, zIndex:10` en el div del header.
- Nota: las API keys no se cargan automáticamente con dotenv en scripts Python —
  exportar manualmente antes de correr cualquier script del pipeline.

### Fechas IGAE actualizadas (marzo 2026)
- Fuente de la verdad: `pipeline/generate_data.py` líneas ~2086-2087 (hardcodeado).
  También en `public/data/brujula_data.json` (el JSON generado que consume el frontend).
  El frontend usa estos valores via `meta.fecha_actualizacion_inegi` con fallback en
  `Topbar.tsx` y `TemporalidadChart.tsx` — si `meta` trae el valor, el fallback no aplica,
  por eso hay que actualizar el JSON y el script Python, no solo el .tsx.
- Actualizado a: última actualización = 22 de mayo 2026, próxima = 23 de junio 2026,
  cifras durante = marzo 2026. Commit: 0ffdeb1.
- ⚠️ PENDIENTE: automatizar con scraper quincenal del sitio INEGI (sin IA, dato
  estructurado no ambiguo) via GitHub Actions cron — evita actualización manual cada mes.

### CONTEXT_FOR_AI.md versionado
- Archivo original preservado íntegro (contexto histórico de diseño inicial ~enero 2026).
- Sección nueva agregada al final: "ACTUALIZACIÓN 2026-06-17" con estado real actual
  (75,969 registros, stack real Supabase no Sheets, 8 UDNs, cobertura SCIAN actual,
  funcionalidad nueva no contemplada en diseño original, instrucciones para otras IAs).
- Aviso al inicio del documento para que cualquier IA lea primero la sección nueva.

### Onboarding comerciales — Accesos y calibración del modelo
- Accesos enviados al equipo comercial de MU (7 usuarios: Saray, Susana, Dani Martinez,
  Norma Angelica Montes, Ximena Resendis, Sergio Hiram, Cristina) con contraseña
  Brujula2026 (perfil comercial) y Brujula2026D. para perfiles Director
  (Cristina, Sergio Hiram, Norma).
- Accesos enviados a UIX: Miguel Flores (director), Samanta (gerente),
  William Ulloa (william.ulloa@elektra.com.mx, contraseña UIX2026$, perfil comercial).
- Saray Aguilar (MU) ya respondió y compartió Plan Comercial de MU con:
  - Industrias prioritarias: Agroindustria, Tecnología, Manufactura, Logística,
    Farmacéutica, Consumo Masivo.
  - Calendario de prospección: Ene-Mar campañas anuales, Abr-Jun expos/stands,
    Jul-Sep eventos corporativos, Oct-Dic fin de año y cierre presupuestal.
  - Anticipación de compra: Eventos Corporativos 2-8 meses, Activaciones BTL
    2 semanas-6 meses, Stands 6-10 semanas, Marketing Digital 2-4 semanas.
  - ⚠️ PENDIENTE: integrar este plan al modelo para calibrar timing comercial de MU.
- UIX: servicios identificados (Consultoría UX/UI, Diseño UX, Diseño UI/Sistema de
  diseño, Diseño de Servicios, Product Design, Pruebas de usabilidad). Correo de
  seguimiento enviado solicitando patrones de temporalidad, ciclo de venta por tipo
  de proyecto y oportunidades fuera del CRM.

### Pendientes para próxima sesión (en orden de prioridad)
1. Corregir `udn_madre` de Franco Cruzat e Ileana Cruz a 'MKT' desde el IAM
2. Integrar plan comercial de MU (Saray) al modelo de timing — calibrar calendario
   de prospección y anticipación por servicio
3. Agregar columna `confianza_scian_baja=True` a los 8,773 registros de groq_llama
   sin Industria (decisión ya tomada en v1.5.0, falta implementar)
4. Corregir "Marketing and Advertising" en MAPEO_INDUSTRIA_HS de integrar_groq.py
   (línea ~36): cambiar scian_2 de "56" a "54"
5. Revisar manualmente data/industria_hs_scian3.json antes de integrarlo
6. Scorecard de ejecución comercial UIX: cruzar actividad CRM contra timing del modelo
   por sector — acordado con Miguel/Samanta/William en sesión previa
7. Scraper quincenal INEGI para automatizar actualización de fechas IGAE

## [1.5.0] — 2026-06-17 — Diego Luna
### Diagnóstico del residuo sin SCIAN_3 (groq_llama, mapeo_hubspot, mapeo_industria_hs)
- Tras integrar el fallback Groq→Cohere→Mistral (v1.4.0), se diagnosticó por qué 3 fuentes
  nunca asignan SCIAN_3: groq_llama (9,146→8,361 tras resync), mapeo_hubspot (9,413),
  mapeo_industria_hs (1,452→1,302). Total ~19,076 registros con SCIAN_2 pero sin subrama.
- Hallazgo crítico en groq_llama: 96% (8,773/9,146) NO tiene campo "Industria" capturado en
  HubSpot — su SCIAN_2 fue asignado únicamente adivinando por el nombre de la empresa, sin
  ningún otro contexto. Solo el 4% (373) tiene Industria y es confiable para completar SCIAN_3.
- DECISIÓN (tomada por Diego): los 8,773 sin Industria se marcan como "baja confianza" y NO
  se reclasifican por ahora — pendiente decidir estrategia después. Si se reclasifica en el
  futuro: dejar null si no hay confianza alta (no forzar respuesta).
- ⚠️ PENDIENTE: la bandera de "baja confianza" se decidió pero NO se implementó aún como
  columna en df_maestro.parquet. Falta agregar algo como confianza_scian_baja=True para
  esos 8,773 registros antes de usarlos en reportes/dashboards.
- Reducción de escala: los 8,773 registros corresponden a solo 5,011 empresas ÚNICAS.
  92.5% son Tipo de objeto="contacto" (8,114), solo 329 son "negocio" (mayor valor,
  menor volumen) y 330 "reunión".

### Expansión de catalogo_marcas.csv (Capa 0, prioridad máxima)
- Top 20 empresas más repetidas del residuo (HP, VML, HEB México, Media.Monks, 3M, KOF,
  Qualtrics, Warner Bros Discovery, KAVAK, Publicis Groupe, NIQ, Bosch México, GSK, Zendesk,
  LLYC, Sam's West Inc, Aplazo, Makken, Chubb México, Hey Banco) revisadas manualmente
  contra la taxonomía real (SCIAN_2_TO_3 / SCIAN_3_NOMBRE de scian_map_3d.py), no por
  adivinanza libre.
- Hallazgo: 19/20 YA ESTABAN en catalogo_marcas.csv pero NO se habían resincronizado contra
  df_maestro.parquet (desfase entre catálogo y datos aplicados).
- Bug real encontrado y corregido: MAKKEN estaba mal catalogado como scian_3=469
  ("Comercio al por menor por internet") cuando es agencia de publicidad/RP (MMS
  Comunicaciones SA de CV, verificado vía búsqueda web) → corregido a scian_2=54,
  scian_3=541. Mismo patrón de "cajón genérico" que se ve en clasificaciones por IA.
- Agregada 1 entrada nueva: SAM WEST INC (scian_2=46, scian_3=462 — Sam's Club/Walmart).
- 4 casos quedaron con el criterio YA EXISTENTE en el catálogo en vez de sobreescribir
  (debatibles, no errores claros): HEB México=461 (no 462), Qualtrics/Zendesk=541 (no 518,
  se tratan como servicio profesional no SaaS puro), Aplazo=522 (no 529).
- Backups creados: catalogo_marcas.csv.bak3, data/df_maestro_backup_20260617_1203.parquet

### Re-ejecución de integrar_groq.py (resync catálogo)
- Correr desde la RAÍZ del proyecto (no desde pipeline/): python3 pipeline/integrar_groq.py
  — usa rutas relativas tipo "pipeline/data/..." que fallan si se corre desde dentro de pipeline/.
- Resultado: catalogo_marcas subió de 7,668→8,623 registros aplicados (+955, 11.4% del total).
  groq_llama bajó de 9,146→8,361 (-785, migraron a catálogo).
  Cobertura SCIAN_3 total: 66.4%→67.7% (+935 registros, +1.3pp). Modesto pero gratuito
  (cero tokens de IA), solo por resincronizar lo que ya existía.
- mapeo_industria_hs (Capa 3, campo Industria Apollo/HubSpot): 0 matches nuevos en esta
  corrida — 4,282 candidatos sin match, top valores sin resolver: "" (vacío, 4,225),
  "Otro" (35), "Bienes de consumo" (10).

### Intento de generar SCIAN_3 para las 316 categorías de MAPEO_INDUSTRIA_HS (NO INTEGRADO)
- Script nuevo: pipeline/clasificar_industria_scian3.py — usa fallback Groq→Cohere→Mistral
  en batches de 10, con prompt de opciones cerradas (SCIAN_2 ya conocido → elige SCIAN_3
  válido de ese sector). Corrió 32 lotes, 100% en Groq (no necesitó fallback).
- Resultado: 275/316 con SCIAN_3 asignado, 40 en null (sin confianza). Guardado en
  data/industria_hs_scian3.json — ⚠️ AÚN NO INTEGRADO al diccionario real, pendiente
  revisión manual antes de aplicar.
- Errores detectados en la muestra de validación (NO confiar en este archivo sin revisar):
  - "Banking" → 523 (bursátil) en vez de 522 (banca múltiple) — debería ser obvio, falló.
  - "Automotive" y "Apparel & Fashion" → null, cuando son casos claros (deberían ser 336 y
    463 respectivamente) — inconsistencia del modelo, no ambigüedad real.
  - "Food & Beverages" → 722 (restaurantes) heredado de un error EN EL DICCIONARIO BASE
    (ver abajo), la IA no pudo corregirlo porque solo elige dentro del SCIAN_2 ya dado.

### Auditoría de MAPEO_INDUSTRIA_HS (316 entradas) — RESULTADO: enfoque NO confiable, descartado
- Script: pipeline/auditar_mapeo_industria.py — pidió a la IA reclasificar SCIAN_2 desde
  cero (sin ver la asignación actual) para las 316 categorías, comparando contra lo existente.
- Resultado: 149/316 "desacuerdos" (47%) — tasa demasiado alta para confiar a ciegas.
  Guardado en data/auditoria_mapeo_industria.json — NO APLICAR sin revisión manual caso por caso.
- CAUSA RAÍZ del ruido: SCIAN_2_NOMBRE tiene nombres genéricos duplicados (31/32/33 todos
  dicen "Industrias manufactureras"; 48/49 ambos dicen "Transportes, correos y
  almacenamiento") — la IA "discrepa" entre códigos que se ven idénticos en el prompt,
  inflando el conteo sin que sean errores reales. LECCIÓN: cualquier futura auditoría similar
  debe usar nombres de sector ÚNICOS/diferenciados en el prompt, no SCIAN_2_NOMBRE tal cual.
- Además, en varios desacuerdos genuinos la IA sugirió PEOR que el original: "Commercial
  Real Estate" (correcto=53 servicios inmobiliarios) → sugerido=23 Construcción (incorrecto).
  "Architecture & Planning" (correcto=54) → sugerido=23 Construcción (incorrecto, arquitectura
  es diseño/planeación, no construcción física).
- CONCLUSIÓN: este método de auditoría masiva automática no sirve como filtro confiable.
  Decisión: NO aplicar ninguna de las 149 sugerencias en bloque.

### Bug real confirmado en MAPEO_INDUSTRIA_HS (pendiente de corregir a mano)
- "Marketing and Advertising" → actualmente scian_2="56" (apoyo a negocios), debería ser
  "54" (servicios profesionales). Confirmado por inconsistencia cruzada: catalogo_marcas.csv
  ya clasifica agencias reales (VML, Publicis Groupe, Media.Monks, NIQ, LLYC, Makken,
  Qualtrics, Zendesk) todas como scian_2=54/scian_3=541. PENDIENTE: corregir esta línea
  específica en integrar_groq.py (línea ~36, diccionario MAPEO_INDUSTRIA_HS) en próxima sesión.

### Pendientes para próxima sesión (en orden de prioridad sugerido)
1. Agregar columna de bandera "baja confianza" a los 8,773 registros de groq_llama sin
   Industria (decisión ya tomada, falta implementar en df_maestro.parquet)
2. Corregir manualmente "Marketing and Advertising" en MAPEO_INDUSTRIA_HS (54, no 56)
3. Revisar manualmente (no aplicar a ciegas) data/industria_hs_scian3.json antes de
   integrarlo — ya se detectaron al menos 3 errores en la muestra
4. Decidir si continuar expandiendo catalogo_marcas.csv con el rango 21-100 / 101-500 de
   empresas más repetidas (top 500 cubriría ~38% del residuo de 8,773)
5. Considerar fuzzy-match (no solo exacto) del catálogo contra nombre_norm para capturar
   variantes no exactas

## [1.4.0] — 2026-06-16 — Diego Luna
### Mapeo del flujo completo de matching SCIAN (capas + orquestador)
- Se reconstruyó el orden real de ejecución del pipeline de clasificación, ya que
  run_pipeline.py SOLO corre match_denue (Capa 1) — las demás capas corren
  manualmente por fuera y no estaban documentadas en ningún lado.
- Orden real de ejecución (confirmado vía grep de read_parquet/to_parquet en cada script):
  1. run_pipeline.py → corre match_denue.py (Jaro-Winkler v2) → genera df_maestro.parquet base, sube a Drive
  2. enriquecer_nombres.py → agrega columna nombre_busqueda (nombre limpio o dominio de email/website vía Supabase)
  3. match_domain.py → fuzzy match adicional usando dominio de correo contra DENUE, escribe a df_maestro.parquet
  4. match_capa0.py → cascada propia (nombre o dominio) contra DENUE nombre_match
  5. match_wikidata.py → clasifica vía Wikidata API el residuo, guarda checkpoint propio (data/wikidata_results.parquet)
  6. match_groq.py → clasifica con IA (Groq/Llama) el residuo final, guarda checkpoint propio
     - Con fallback Groq → Cohere → Mistral integrado el 2026-06-16 (ver abajo)
  7. integrar_groq.py (docstring interno dice integrar_capas_v2.py — nombre de archivo desalineado)
     → ORQUESTADOR REAL de prioridad de capas, fusiona todo en df_maestro.parquet final
  8. validar_match.py / auto_validar.py → validación estadística + revisión automática con IA
- Orden de prioridad de capas (documentado en docstring de integrar_groq.py):
  Capa 0: catalogo_marcas (catálogo manual ~800 marcas) > Capa 1: denue_match (Jaro-Winkler)
  > Capa 2: mapeo_hubspot (catálogo heredado) > Capa 3: mapeo_industria_hs (campo Industria Apollo/HubSpot)
  > Capa 4: groq_llama (solo el residuo final)
- NOTA para futuras sesiones / otras IAs: el nombre del archivo integrar_groq.py es engañoso,
  es el orquestador completo de TODAS las capas, no solo de Groq.

### Fallback Groq → Cohere → Mistral en match_groq.py
- Mismo patrón ya validado en clasificador.py de Radar Político UPAX (API_ACTUAL global +
  switch_api() + detección de rate-limit/timeout por substring del error)
- Se activa automáticamente solo si Groq da rate-limit/quota o falla 3 veces consecutivas
- Requiere COHERE_API_KEY y MISTRAL_API_KEY en .env.local (ya configuradas)
- Pendiente: relanzar pipeline completo de matching con este fallback activo y comparar
  cobertura SCIAN_2/SCIAN_3 antes/después (ver sección 1.3.0 para baseline: 68% con SCIAN_2,
  solo 30% con SCIAN_3)


## [1.3.0] — 2026-06-09 — Diego Luna

### Análisis de cobertura SCIAN
- Diagnóstico completo del parquet maestro: 75,969 registros totales
- Clasificados con sector SCIAN: 52,235 (68%) — mejor de lo esperado
- Sin clasificar: 23,734 (31%)
- Desglose por fuente: nombre_match=29,899 | denue_match=12,923 | mapeo_hubspot=9,413 | groq_llama=9,146 | catalogo_marcas=7,668 | mapeo_industria_hs=1,452

### Diagnóstico SCIAN_3 (subrama de industria)
- Con SCIAN_3: solo 23,273 registros (30% del total)
- Sin SCIAN_3: 52,696 registros (70%)
- Cobertura por fuente:
  - catalogo_marcas: 100% tiene SCIAN_3 ✅
  - denue_match: 99% tiene SCIAN_3 ✅
  - nombre_match: solo 9% tiene SCIAN_3 ❌ (27,198 sin subrama)
  - groq_llama: 0% tiene SCIAN_3 ❌
  - mapeo_hubspot: 0% tiene SCIAN_3 ❌
  - mapeo_industria_hs: 0% tiene SCIAN_3 ❌

### Decisión de arquitectura — Revalidación de clasificados
- Se decidió NO dejar intactos los ya clasificados
- Razón: fuentes como groq_llama y mapeo_hubspot solo asignan SCIAN_2 (2 dígitos)
  sin SCIAN_3 (subrama real) — crítico para identificar Alimentos vs Automotriz vs Farmacéutica
- SCIAN_3 debe seguir taxonomía oficial INEGI/DENUE (capturas adjuntas confirman estructura)

### Estrategia de enriquecimiento SCIAN_3
- Ruta 1 (gratuita): nombre_match → join contra denue_nacional.parquet via Match_INEGI
  → recupera codigo_act de 6 dígitos → primeros 3 = SCIAN_3 oficial INEGI
  → aplica a los 27,198 registros de fuente nombre_match sin SCIAN_3
- Ruta 2 (LLM con catálogo controlado): para groq_llama/mapeo_hubspot
  → prompt incluye catálogo oficial SCIAN para que LLM solo elija códigos válidos
  → evita que el modelo invente nombres fuera de la taxonomía INEGI

### Problema identificado en join Match_INEGI → DENUE
- Match_INEGI guarda nombre normalizado del establecimiento DENUE
- nombre_match en DENUE guarda nombre original completo (con SA DE CV etc.)
- Join falla porque los campos no están en el mismo formato
- Pendiente: determinar qué campo de DENUE se usó originalmente para generar Match_INEGI
  revisando match_capa0.py líneas relevantes (Match_INEGI, nombre_match, nn)

### Infraestructura — Multi-AI Fallback
- Keys configuradas en .env.local y exportadas a sesión:
  - GROQ_API_KEY ✅ (llama-3.1-8b-instant, 30 req/min free tier)
  - COHERE_API_KEY ✅ (20 req/min free tier)
  - MISTRAL_API_KEY ✅ (1 req/seg free tier)
- Patrón: gemini → groq → cohere → mistral (mismo que Radar Político)
- Estimación para 23,734 pendientes: ~2-3 horas con fallback activo

### Tag de rollback
- v1.1-pre-scian3-enrichment — estado previo al enriquecimiento SCIAN_3

### Pendiente sesión siguiente
- Resolver join Match_INEGI → DENUE (revisar cómo se generó Match_INEGI en match_capa0.py)
- Integrar fallback Cohere/Mistral en match_groq.py
- Diseñar prompt con catálogo SCIAN controlado para SCIAN_3 via LLM
- Configurar cron GitHub Actions a las 11:00 UTC (5am México) para tener resultados a las 9am
- Agregar GROQ_API_KEY a GitHub Secrets y Vercel Environment Variables


## [1.6.4] — 2026-06-28 (sesión sáb 27) — Diego Luna

### Fix crítico: pipeline usaba datos desactualizados desde abril 2026
- `generate_data.py` leía `data/df_brujula.parquet` (abril, 75,969 registros) en lugar de datos Supabase (91,396)
- `df_brujula.parquet` nunca se había regenerado desde Supabase — era output del pipeline viejo de Google Sheets
- `generate_data.py` tenía DOS definiciones de `generar_industrias()` — Python usaba la última silenciosamente

### Flujo correcto documentado (orden obligatorio)
1. `pipeline/integrar_groq.py` → genera `pipeline/data/df_maestro.parquet` (91,396 registros)
2. Script rebuild_brujula (ver abajo) → cruza maestro + IGAE Z-scores → genera `df_brujula.parquet`
3. `python3 pipeline/generate_data.py` → genera `public/data/brujula_data.json`
4. `git push origin main` → Vercel despliega automáticamente

### Cuándo regenerar df_brujula.parquet
- Cada vez que se actualice `df_maestro.parquet` (refresh Supabase)
- Cada vez que se actualice `igae_indice.xlsx` (datos IGAE nuevos de INEGI)

### Fixes generate_data.py
- Eliminada función duplicada `generar_industrias()` (línea 443, versión obsoleta)
- Eliminado filtro Fecha Lead no nula en Top 5 — usa universo completo de leads
- Eliminado filtro por empresa — filtra solo por sector_igae notna()
- Orden Top 5: por temperatura de mercado (caliente→templado→tibio→frío) con leads como desempate

### Fixes frontend
- `IndustriasList.tsx`: subtítulo → ordenados por temperatura de mercado
- `CalendarioGrid.tsx`: subtítulo → pregunta orientada al usuario
- `RadarMotivos.tsx`: tooltip usa textColor de UDN para contraste correcto
- `data.ts`: HOF colores → primario #000000, secundario #3274FC, texto #3274FC
- `globals.css`: grid two-col → 1fr 480px

### Hallazgos EDA Supabase
- 78% del pipeline sin calificar (Pendiente calificar + sin estado)
- Tasa conversión Marketing: 0.0% — leads no se califican, no que no vendan
- Score adecuación correlaciona con actividades de venta (0.288) — única correlación relevante
- 5,989 empresas en 2+ UDNs (contactos) vs 83 empresas con NEGOCIOS en 2+ UDNs
- Orden real UIX sin filtros: Comercio al por menor > Manufactura > Comercio al por mayor

### Pendientes
- Tab Analista con 5 bloques basados en hallazgos EDA
- Ceguera Operativa: % campos vacíos por UDN
- Fix const brand HOF en Dashboard.tsx (luminancia)
- Mover script rebuild_brujula a pipeline/rebuild_brujula.py permanente
