## [v2.8.0] - 2026-08-26 (madrugada)
### Investigación pipeline Brújula: sync_mbr_incremental.py validado
- Aclaración importante: `BRUJULA-COMERCIAL-UPAX` y `brujula-comercial-upax` son LA MISMA carpeta física (macOS no distingue mayúsculas/minúsculas por defecto). No hay "repo viejo vs nuevo" — es un solo git, un solo estado. Toda la confusión de la sesión sobre esto fue por este detalle del filesystem.
- Corrida ejecutada con éxito: `cd pipeline && python3 sync_mbr_incremental.py` (debe correrse DENTRO de pipeline/, no en la raíz — usa rutas relativas a data/denue_nacional.parquet). Requiere `SUPABASE_URL_MBR` y `SUPABASE_KEY_MBR` en `.env.local` de BRUJULA-COMERCIAL-UPAX (la segunda faltaba, se agregó con la misma service_role key del proyecto wuwhcljeigskajjoyghv).
- Resultado: 1,135 registros nuevos en mbr (118,642 vs 117,566 legacy). Tardó ~4 min, no horas — la corrida larga que se recordaba debió ser un run completo desde cero de los 117K legacy, no esta incremental.
- Aclaración de métricas (para no confundir a futuro):
  - "Cobertura DENUE: X%" = % de los registros NUEVOS que matchearon contra DENUE (match_alto + match_bajo). El resto es sin_match real (marcas internacionales/startups sin presencia en DENUE México).
  - "Cobertura SCIAN_nombre total: 86.1%" = % de TODO el dataset (legacy + nuevos) con alguna industria asignada, sin importar fuente (denue_match, catalogo_marcas, nombre_match, groq_llama, legacy heredado). Esta es la que se recordaba como "el 80%+" — mide cobertura, NO calidad de match.
  - Dentro del 86.1%, calidad varía: match_alto/aceptado (confiable) vs catalogo_marcas/nombre_match de baja confianza (ej. nombres genéricos con score perfecto por casualidad).
  - Pendiente si se retoma: calcular qué % del 86.1% es específicamente match_alto/aceptado.
- df_maestro_v2.parquet actualizado. Sigue pendiente conectar a match_denue.py (lee data/df_maestro.parquet, nombre distinto) y a generate_data.py (para poblar empresas_pico con el campo `propietario` correcto). Ver entrada previa sobre Overview/Calendario expandible para contexto completo.

## [v2.7.0] - 2026-08-26
### Gestión SDR
- Header con recuadro de alcance de datos; filtro maestro Outbound/Inbound/Todas controla Volumen, MQLs por UDN, Reuniones por SDR y Comparativo (SLA queda fijo en Inbound).
- Nombres unificados (Nombre Apellido) en filtro, leyendas, tabla y ejes; meta de reuniones fija en 20/SDR con badge fijo (ya no se monta sobre barras).
- Comparativo por SDR: expande múltiples filas a la vez; badge "Más reuniones OB/IB" dinámico.
- SLA por SDR/día: sin labels flotantes (solo tooltip), barras coloreadas por SDR.
### Overview (Brújula Comercial)
- Sección "Señales en vivo" conectada al componente real SenalesMercado (extraído de InteligenciaMercado.tsx).
- Sección "Calendario de prospección": CalendarioGrid real; al hacer click en una industria expande sus subramas (mismo patrón que PicosEmpresasTable), con tabla de Empresa/Propietario/Fecha creación/Motivo pérdida/Fecha perdido/Valor/Link HubSpot. Filtra tipoObjeto='negocio'.
- Fix producción: <React.Fragment> sin import de React rompía en runtime (CalendarioGrid.tsx) — solo fallaba en bundle de producción, no en build/dev local.
### Pendiente — Brújula Comercial (no prioridad)
- Repo de trabajo real del pipeline: `~/Downloads/BRUJULA-COMERCIAL-UPAX` (mayúsculas) — hay un clon viejo en minúsculas que NO se debe tocar.
- Pipeline vigente `sync_mbr_incremental.py` renombra "Propietario del contacto/negocio/reunión creada por" -> "propietario" (nombre corto es el vigente).
- df_maestro.parquet (insumo de Picos/Calendario expandible) sigue siendo LEGACY (generado desde df_brujula.parquet, no desde mbr) — por eso "Propietario del negocio" sale vacío casi siempre. Falta correr match_denue.py apuntando a mbr. Detalle completo en CHANGELOG.md de BRUJULA-COMERCIAL-UPAX (entradas 1.5.0, 1.6.0, 1.9.0).
- "Tipo de venta" (interna/externa) no se integró: no hay campo equivalente confirmado en el pipeline actual.

## [v2.6.0] - 2026-08-18
### Gestión SDR: reestructuración de bloques y layout
- Bloque "Comparativo por SDR" reordenado para aparecer después de "Reuniones completadas por SDR", antes de los gráficos de SLA.
- Gráficos "SLA por SDR" y "SLA por día" fusionados en fila doble (antes apilados), migrados de `BarChart` a `ComposedChart` con barra (SLA) + línea (contactos) en doble eje, replicando el patrón visual de HubSpot.
- Formato dinámico de tiempo (segundos/minutos/horas/días) aplicado en ejes, tooltips y etiquetas de ambos gráficos de SLA — antes mostraban solo horas sin importar la magnitud.
- Nombres de SDR en eje X de "SLA por SDR" renderizados en múltiples líneas (`TickNombreSDR`) para evitar solapamiento con nombres largos.
- Filtro de SDR (arriba de la vista) ahora se propaga a `sla_por_sdr_mes_actual` y `sla_por_dia` — antes ignoraban el filtro y mostraban datos de todos los SDRs.
- Etiquetas de ejes X/Y agregadas a ambos gráficos de SLA (SDR, "(Promedio) SLA SDR", "(Número) contactos"), centradas, más tooltip aclarando que "contactos" refiere a MQLs Inbound calificados (no relacionado con la columna "Conectados" de la tabla).

### Atribución de reuniones outbound: propietario → creador
- RPCs `sdr_dashboard_data` y `sdr_actividad_rango_diario` corregidos: filtraban actividad por `propietario` (Comercial asignado a la reunión) en vez de `creador` (SDR que la gestionó). Impacto real fue menor (~2 registros de ~1,900) pero el criterio ahora es correcto de fondo.
- Labels de las tarjetas de comparativo mensual/semanal actualizados de "Actividad" a "Reuniones outbound".
- Orden de la tabla "Comparativo por SDR" cambiado a reuniones outbound completadas (antes ordenaba por reuniones totales); título actualizado.

### Filtros de fuente y período visibles en gráficos
- Filtro Outbound/Inbound agregado a "Reuniones completadas por SDR" (antes solo existía en "MQLs por UDN").
- Badge de período dinámico ("Este año", "Este mes", etc.) agregado a "MQLs por UDN", "Reuniones completadas por SDR" y "Comparativo por SDR" — refleja el filtro de fecha activo en vez de quedar fijo.
- Fix: variable `periodLabelGlobal` faltante causaba crash de la página tras un primer intento incompleto de este cambio.
- Línea de referencia (meta: 20 reuniones outbound/SDR/mes) agregada al gráfico "Reuniones completadas por SDR", escalando según el número de SDRs visibles; dominio del eje Y extendido para que la línea siempre sea visible.

### Rediseño de scorecards ("Volumen del período")
- Bloque "Funnel de prospección" renombrado a "Volumen del período": se quitaron flechas y porcentajes intermedios (no representaban un funnel de conversión secuencial real).
- Migrado de tarjetas custom (`FunnelEtapa`) a componente reusable `KPICard` (contador animado, colores por métrica, gap entre tarjetas) — mismo patrón visual que el módulo de Redes UPAX.
- Card "Contacto conectado" ahora muestra fracción "conectados / llamadas totales" en vez de solo el número absoluto, con ratio (%) debajo.
- Card "Reunión completada" ahora incluye ratio (% sobre MQLs calificados) debajo del valor.

### Columna "Conectados" reinterpretada como ratio
- Columna "Conectados" en "Comparativo por SDR" reemplazada por ratio "Llamada → Conectado" (antes mostraba el número absoluto sin contexto de sobre qué total). Número absoluto de conectados se movió al detalle expandible, junto al desglose de llamadas.
- Columna "Actividad → MQL" eliminada de la tabla (denominador mezclaba llamadas/WhatsApp/notas/tareas sin relación causal clara con MQLs generados).
- Tooltip de "MQL → Reunión" mejorado para explicar la lectura del ratio con más detalle.

## [v2.5.0] - 2026-08-12
### Permisos y visibilidad por UDN
- Fix de IDs desalineados: LinkedIn Orgánico/Ads en IAM usaban `linkedin-org`/`linkedin-ads`, corregido a `li-org`/`li-ads` (coincide con `RedesUPAX.tsx`).
- `page.tsx` ahora pasa `perfil?.permisos` a los 3 módulos (Brújula Comercial, Redes UPAX, Data & Analytics) — antes no llegaba a ninguno.
- Sub-tabs sin permiso ahora se muestran atenuados con badge "Sin acceso", click bloqueado, sin ocultarlos (a diferencia del badge "En proceso" que indica falta de construcción, no de permiso).
- UDNs visibles separadas por tab en Brújula Comercial: "Inteligencia Comercial" respeta `udn` asignada del usuario (vía `perfil.udn`), "Inteligencia de Demanda" siempre muestra las 8 UDNs completas — estado independiente por tab (`udnsVisiblesComercial` vs `udnsVisiblesDemanda`), con `useEffect` que reubica `udnActiva` al cambiar de tab si queda fuera de rango.
- Bug corregido: `tienePermiso` y la firma `{ permisos }` de `BrujulaComercial.tsx` se perdieron por un `assert` fallido a medio escribir en una edición previa — restaurado completo.

### Tracking de uso (module_access_log)
- Tabla nueva `module_access_log` en Supabase (`szxdvdbdyuxtvyvxbder`) con RLS: policy de insert (`perfil_id = auth.uid()`) y policy de lectura (`true`, cualquier autenticado).
- `SidebarV2.tsx`: cada click en un módulo del sidebar dispara un insert a `module_access_log` (fire-and-forget, no bloquea navegación).
- IAM: columna "Visitas" ahora clickeable ("Ver detalle"), abre popover con desglose de clicks por módulo por usuario.
- Bug corregido: el popover leía `module_access_log` con un cliente Supabase sin sesión (`createClient()` genérico en `iam/page.tsx`, rol `anon`), bloqueado silenciosamente por RLS sin error visible. Fix: usar `getSupabase()` (cliente autenticado con sesión) para esa query específica.
- Fix de contraste (texto oscuro sobre fondo oscuro) y overlap visual del badge "Ver detalle" (apilado debajo del número en vez de al lado).

### Migración Inteligencia Comercial (legacy → ORBIT)
- 4 componentes migrados de `BRUJULA-COMERCIAL-UPAX` a `app/components/brujula-comercial/`: `BloqueDENUE.tsx`, `CalendarioGrid.tsx`, `PicosEmpresasTable.tsx`, `IcpChips.tsx`.
- Nuevo componente orquestador `InteligenciaComercial.tsx` — lee `public/data/brujula_data.json` (mismo patrón `fetch` que ya usaba el proyecto legacy), arma props para los 3 componentes según `udnId` activo.
- Cableado en el placeholder "Inteligencia Comercial — próximo paso" de `BrujulaComercial.tsx`.
- Fix de imports: `CalendarioGrid`/`PicosEmpresasTable` son named exports (no default, a diferencia de `BloqueDENUE`); import de tipos ajustado a `../../lib/types` (un nivel extra de carpeta).
- `UDN_COLORS` no duplicado — se reusa el existente (indexado por nombre completo de UDN: `'Marketing United'`, `'House Of Films'`, etc., no por código corto).

### Popover "Ganados por facturar" (Data & Analytics)
- RPC nueva `get_ganados_por_facturar_detalle(fecha_desde, fecha_hasta, p_udn, p_origen, p_fuente)` en `wuwhcljeigskajjoyghv` (misma base que `mbr`, requerido por Postgres al no permitir queries cross-database) — devuelve `company, udn, propietario, fuente, monto, fecha_por_facturar, closedate`.
- Popover rediseñado como modal centrado con backdrop (no popover angosto anclado a la card), columnas Empresa | Fuente | Valor, total sumado en el header, animación stagger por fila.
- Trigger visible con badge "Ver detalle ›" y hover, en vez de solo un ícono ✨ pequeño.
- Confetti (`canvas-confetti`) al hacer click.

### Compartir sin login — embed por UDN
- Nueva ruta `/embed/[udn]` — sin autenticación, muestra `FunnelPanel` + `TeamsPanel` (funnel de conversión + tablas Marketing/Comercial) filtrado por una sola UDN vía slug de URL.
- `FunnelPanel`, `TeamsPanel`, y el tipo `FiltrosHome` exportados desde `HubSpotAnalytics.tsx` (antes privados al archivo) para poder reusarlos en la página embed sin duplicar código.
- `next.config.ts`: header `Content-Security-Policy: frame-ancestors` restringido a `/embed/:path*` únicamente — autoriza iframe solo desde `https://mktcorp-estatus.vercel.app`. El resto de la app no lleva este header.
- Mapeo de slugs ya preparado para las 8 UDNs en `UDN_SLUGS` (`app/embed/[udn]/page.tsx`) — agregar una UDN nueva no requiere tocar código, solo usar la URL correcta.
- Vivo hoy: `https://orbit-hub-fgap.vercel.app/embed/house-of-films` (compartido con el director de Marketing Corporativo). Pendiente mañana: `marketing-united`, mismo patrón, sin cambios de código.
- Nota técnica: `params` en Next.js 15+/16 es una `Promise`, no un objeto plano — usar `use(params)`, no acceso directo (`params.udn` sin `use()` causaba 404 silencioso en producción aunque compilaba bien local, porque `next.config.ts` tiene `ignoreBuildErrors: true`).

### Deuda técnica / pendiente
- Bloque de debug temporal en `app/embed/[udn]/page.tsx` (mensaje "UDN no reconocida...") — revisar si conviene quitarlo o dejarlo como manejo de error real para slugs inválidos.

## [v2.4.0] - 2026-08-06

### Brújula Comercial 2.0 — Inteligencia de Demanda (cruce con volumen de mercado de Google)
- Bug raíz resuelto: `keyword_market_volumes` tenía RLS activado sin ninguna policy, bloqueando lectura del rol `anon` — causaba que la gráfica y el marcador de pico no cargaran datos reales. Fix: `CREATE POLICY "anon_read" ... FOR SELECT TO anon USING (true)`.
- `get_keywords_signal` migrada a `(p_udn, p_desde, p_hasta)`; base del índice cambiada de `AVG` a `percentile_cont(0.5)` (mediana) para no distorsionarse con outliers de keywords genéricas de alto volumen estacional (ej. "customer journey", "design thinking", "ab testing" en UIX).
- Índice trigram (`pg_trgm`) en `gads_search_terms(search_term)`: resuelto timeout (`57014`) en `get_segmentos_udn` causado por `JOIN ... LIKE '%...%'` sin índice contra 685K filas/mes.
- `vol_mercado` agregado a `get_segmentos_udn`, `get_keywords_table`, `get_keywords_segmento` (join exacto por texto contra `keyword_market_volumes`).
- `get_kpis_udn`, `get_segmentos_udn`, `get_keywords_table`, `get_keywords_segmento` migradas de `p_mes` único a `p_desde/p_hasta` (rango de meses), con agregación por suma/promedio según corresponda.
- `get_kpis_udn`: nueva columna `busquedas_mercado_total` (suma cruda sin normalizar); `indice_senal` ahora lee `indice_mercado` (antes leía `indice_campana`, duplicando info con "Impresiones Google Ads"); nuevas columnas `keywords_research_activas/total`.

### Filtro de periodo unificado
- Componente nuevo `FiltroPeriodoGlobal.tsx`: botón único arriba a la derecha con presets (Últimos 3/6 meses, Este año, Todo el historial) + rango personalizado limitado a meses con datos reales — mismo patrón visual que Redes UPAX / HubSpot Analytics.
- Reemplaza `FiltrosPeriodo.tsx` y `SelectorRangoMeses.tsx` (quedan huérfanos en el repo, pendientes de limpieza).
- Estado `{desde, hasta}` levantado a `BrujulaComercial.tsx`, controla scorecards + gráfica + tablas desde un solo punto. Default: año actual (Ene–Ago 2026).

### Scorecards (`KpiScoreCards.tsx`)
- "Señal de Búsqueda" corregida a índice de mercado real (antes duplicaba el índice de campaña).
- Nueva scorecard "Búsquedas de mercado" (total crudo, formato K/M corregido para números en millones).
- "Keywords SEO Activas" rediseñada a 2 niveles: Golden · Campaña (7 keywords curadas) vs. Research · Mercado (universo completo del plan SEO) — evita confusión entre ambas listas.

### Tabla "Actividad por segmento de servicio" (`SegmentosServicio.tsx`)
- Indicador principal cambiado de impresiones a volumen de mercado, ordenado de mayor a menor.
- Detalle expandido con badge "ACTIVA" y resaltado visual para keywords con actividad real de campaña.
- Texto clarificador agregado: distingue explícitamente Golden Keywords (7) de Keyword Research completo (171, en 6 categorías).

### Tabla "Inteligencia de búsqueda" (`TablaKeywords.tsx`)
- Eliminada la sección "Oportunidades no mapeadas" (nunca tenía volumen de mercado asociado, generaba confusión).
- "Competidores detectados": límite subido de 8 a 10 resultados; columna Vol. mercado ocultada (no aplica a search terms sin research asociado).
- Título duplicado eliminado; leyenda de intención y fecha con mejor contraste/tamaño.

### Gráfica "Cruce de señales" (`GraficaCruceSenales.tsx`)
- Rediseño visual: card con fondo propio, chip legible para el umbral base-100, curvas suavizadas (`monotone`), relleno sutil y hover states.
- Bug resuelto: UDNs sin ningún dato real de mercado (ej. Zeus, sin research cargado) rompían la posición del marcador de pico y dejaban una banda "fantasma" — ahora se ocultan los overlays completos cuando no hay datos reales.
- Umbral de la banda de "señal activa" recalibrado de 115 a 100 (consistente con la base de mediana).
- Nuevo subtítulo explicativo del propósito de cruzar las 3 señales (Intención de Búsqueda anticipa, Pulso del Mercado marca el pico del sector, MQLs confirman).

### Pendiente
- Ocultar la pestaña de UDN "Zeus" del selector (sin Keyword Research cargado en Supabase).
- Scorecard de correlación Spearman (índice de mercado vs. índice de campaña) y tarjeta "Atención prioritaria" — no construidas aún.
- Ventanas visuales de "despertar / pico económico / confirmación" en la gráfica, y análisis de lag (anticipación en meses) entre Intención de Búsqueda y Pulso del Mercado — en diseño conceptual, pendiente de implementar (requiere más historia para el análisis estadístico).
- Limpieza de `FiltrosPeriodo.tsx` y `SelectorRangoMeses.tsx` (ya no se usan).
- Refrescar `keyword_market_volumes` corriendo de nuevo `gads_keyword_volumes.py` (histórico actual solo cubre hasta 2026-06).

## [v2.3.0] - 2026-07-31

### HubSpot Analytics — Filtros multi-selección
- 5 filtros del Home convertidos de `<select>` a dropdown con checkboxes ("N seleccionadas" + Limpiar)
- 21 RPCs migradas a `ANY(string_to_array(p_x, '|'))` sin cambiar firmas (retrocompatible)
- DROP del overload duplicado `propuestas_perdidas_por_origen(date,date)`
- Eliminado hack `case UIX→UiX` en `sql_credenciales_completadas_por_mes_udn`
- `FiltrosHome`: `string` → `string[]` + helper `arrToParam()`
- `filtrosParams3()` desduplica 12 bodies inline idénticos del Grupo B
- Componente `MultiSelect` self-contained (light theme, clic-fuera-para-cerrar)

### Pendiente
- Badge "Última sincronización con HubSpot" (RPC `mbr_ultima_sincronizacion` lista en Supabase)

# Changelog — ORBIT Hub
## [Sin versión] — 30 de julio de 2026

### HubSpot Analytics — Brújula Comercial 2.0 (FunnelPanel)
- Corregido bug de fórmula en el Sheets de Forecast (Cumplimiento Marketing de Lead referenciaba la columna de Comercial).
- Remapeo de metas: la meta del forecast "Lead" se reasigna a la etapa Contactos; la etapa Leads del `mbr` queda sin meta ("Sin meta en forecast").
- RPC `metas_forecast_rango`: prorrateo diario de metas mensuales segun dias cubiertos en el rango filtrado, con bandera `es_prorrateado` y etiqueta "Meta prorrateada".
- Cumplimiento global en Opps y Clientes (etapas sin split Marketing/Comercial), evitando dividir una meta compartida entre ambas columnas.
- RPC `funnel_totales`: distingue fecha de creacion (funnel) de fecha de facturacion (scorecards ejecutivas) via los campos nuevos `clientes_facturados_rango` y `clientes_valor_facturado_rango`.
- Scorecards ejecutivas agregadas: Clientes ($), Ganados por facturar ($), Proyectos ganados — con meta anual fija sin prorratear.
- Rediseño del panel del funnel: grid de 3 columnas (funnel 3D | tasas de conversion | Calidad y perdidas), reemplazando el posicionamiento absoluto en escalera.

### Sidebar / Identidad
- Rebranding "Brújula Comercial" → "Brújula Comercial 2.0".
- Badge "En proceso" en tabs no conectados (META Ads, Google Ads, GA4, LinkedIn Organico/Ads, MBR, Email marketing).
- Nuevos iconos SVG del sidebar (outline / activo) y color de acento cambiado de morado (#7c3aed) a #7038D8.
- Filtrado real de modulos visibles segun `perfil.permisos` (antes el checkbox no ocultaba nada).

### Redes UPAX — META Orgánico
- Pipeline migrado a `pipeline_redes/`, automatizado con GitHub Actions (`redes.yml`) cada 6 horas.
- Corregido `Invalid header value` por saltos de linea en los secrets de Supabase (`.strip()` en ambas keys).
- Imagenes de Meta (URLs efimeras `scontent-*`) ahora se descargan y suben a Supabase Storage (bucket `meta-organico-media`), con URL publica permanente — incluye Historias capturadas dentro de su ventana de 24h.
- Corregido bug de paginacion: `fetchSB` solo traia 1,000 filas por el limite de PostgREST; ahora pagina con header `Range` hasta traer el dataset completo.
- Filtros UDN/Red/Tipo con seleccion multiple (checkboxes).
- Bitacora de Contenido: orden por defecto cambiado de ER% a Alcance (evita sesgo hacia Historias); labels aclaran Reacciones/Me gusta y Compartidos/Guardado segun plataforma; zoom de imagen con `position: fixed` (ya no se corta en bordes de tabla) y sin texto superpuesto; paginacion de 10 en 10.
- Componente `InfoTip` reutilizable (icono ⓘ con tooltip al hover): agregado a las KPICards (Alcance, Impresiones, Interacciones, Seguidores, Engagement Rate, Compartidos) y a los encabezados de tabla (Reacciones, Compartidos) con la formula/definicion exacta de cada metrica.
- Labels y valores de KPICards y encabezados de tabla dinamicos segun filtro de fuente: al filtrar solo Facebook o solo Instagram, se muestra el nombre nativo de esa plataforma (Alcance/Cuentas alcanzadas, Reproducciones de video/Visualizaciones, Reacciones/Me gusta, Compartidos/Guardados).
- Graficos corregidos: "Interacciones vs Posts" (barras dentro del area, con etiqueta de valor), "Alcance vs Impresiones" (bug de escala independiente por serie corregido, sombreado de brecha real entre lineas), "Engagement Rate por UDN/mes" (labels de ejes agregados).
- Indicador dinamico "Ultima actualizacion" / "Proxima actualizacion" conectado a `MAX(audit_date)` real, con punto parpadeante.
- Extractores `google_ads`, `ga4`, `linkedin_organico` pausados en el cron hasta abordar esas pestañas.

### IAM
- Corregido: `/api/iam/crear` no guardaba `udn_madre`, `nivel_jerarquico` ni `reporta_a`.
- Corregido: `/api/iam/editar` guardaba string vacio en campos opcionales, violando el CHECK constraint.
- Rollback agregado en `/api/iam/crear`: evita usuarios huerfanos en Auth si falla el insert del perfil.
- Constraint de rol ampliado: rol "Marketing" + 15 puestos del organigrama.
- Nueva columna `squad` en `perfiles`, con catalogo de 5 squads del organigrama.
- Formulario de alta de usuario reordenado y condicional segun modulos seleccionados (UDNs/UDN madre solo si Brujula; Squad solo si Redes y/o HubSpot).

### Pendientes abiertos
- Conciliacion de criterio "Real" (creacion vs facturacion/cierre) entre `mbr` y el Sheets de Forecast para MQLs y otras etapas.
- Split de metas por etapa (SQLs) no sigue el patron generico 60/40 — pendiente traer valores reales del Sheets.
- Reactivar y construir frontend de google_ads/ga4/linkedin_organico cuando se aborden esas pestañas.
- Migracion de imagenes a Storage solo aplica hacia adelante; historico fuera de la ventana de 90 dias no se repara retroactivamente.
- Fase C de permisos IAM (ocultar tabs/componentes especificos dentro de cada modulo) pendiente.


## [Sin versión] — 29 de julio de 2026 (sesión 2)

### Layout y marca
- Topbar movido a franja blanca de ancho completo con línea de acento (gradiente de marca) entre el topbar y el sidebar; curva estilo 6sense añadida en la esquina superior del sidebar para eliminar la esquina picuda.
- Tema oscuro de ORBIT unificado con los tonos de Brújula (`#0F172A` / `#030712`), reemplazando el morado (`#1e1b2e`/`#211936`) que no calzaba con el resto de módulos.
- Rediseño completo de marca (logo v2): nuevo ícono octagonal generado con ChatGPT, con set completo de assets (app icon 1024 dark/light, maskables Android 192/512, favicon multiresolución, tile Apple touch, íconos UI transparentes 32/64/192/512).
- Íconos de PWA corregidos tras varias iteraciones: causa raíz identificada como `app/favicon.ico` heredado del template default de Next/Vercel (nunca se había reemplazado) sirviendo como fuente real del ícono en el popup de instalación de Chrome, no un problema de caché como se sospechó inicialmente.
- Topbar reconstruido con lockup de marca (octágono SVG + texto "ORBIT" / "MARKETING HUB" en HTML) para control fino de tamaño de subtítulo, tras descubrir que el SVG lockup entregado no escalaba bien el texto secundario.
- Persistencia del módulo activo (sidebar) y de la subtab activa (dentro de HubSpot Analytics) vía `localStorage`, para que recargar la página no regrese siempre a Brújula/Home.

### HubSpot Analytics — migración de esquema Supabase
- Diagnóstico y corrección de ~20 funciones RPC tras un cambio de esquema en la tabla `mbr` (columnas renombradas: `fecha_mql`→`fecha_calificacion`, `fecha_lead`→`fecha_apertura`, `lead_status`/`etapa`→`estado`, `descalificacion`→`perdido`, `meeting_activity_type`→`subtipo`, `meeting_outcome`→`estado`).
- Normalización de la inconsistencia `UIX` (mayúsculas, en negocios y reuniones) vs `UiX` (resto de módulos) directamente en la tabla `mbr`, y en las RPCs relevantes.
- Resuelto timeout intermitente (`500` en `contactos_por_mes_udn`) causado por bloat de la tabla (~10x el tamaño esperado por reescrituras del sync cada 2h sin vacuum): aplicado `VACUUM FULL`, 4 índices nuevos (`idx_mbr_tipo`, `idx_mbr_tipo_fecha_registro`, `idx_mbr_tipo_fecha_calificacion`, `idx_mbr_tipo_fecha_apertura`), y `statement_timeout` extendido a 20s en la función.
- Identificados y resueltos múltiples casos de RPCs duplicadas (overloads con distinta firma) tras actualizaciones con `CREATE OR REPLACE` que cambiaban el número de parámetros; PostgREST no resolvía cuál usar y devolvía 400/404/500 según el caso.
- Pendiente para el equipo de datos: normalizar `UIX`→`UiX` directamente en `sync.py`, y agregar `VACUUM ANALYZE` (o cambiar el patrón de reescritura a `TRUNCATE`) al final de cada corrida del sync para que el bloat no regrese cada 2 horas.

### Vista "Negocios perdidos" (HubSpot Analytics)
- Construida de cero, replicando el reporte de Looker Studio existente: 3 tarjetas (por UDN, por Fuente, por Motivo), 2 series de tiempo apiladas (por Fuente y por UDN) con totales sobre cada barra estilo Home, y tabla de detalle paginada con link directo a HubSpot (`portalId` 24172997).
- 6 RPCs nuevas/actualizadas con la regla de negocio exacta (`estado in ('Descalificado','7. Perdido') OR (estado='Objetada' AND subtipo='Credenciales')`).
- 4 filtros (Unidad de negocio, Generado por, Fuente adquisición, Motivo de perdido) conectados server-side a las 6 RPCs, con date picker de presets igual al de Home y botón "Borrar filtros" funcional.

### Filtros server-side del Home (HubSpot Analytics)
- Los 5 filtros de la barra superior (Unidad de negocio, Generado por, Contacto convertido, Fuente adquisición, Fuente MQL) conectados a los 10 paneles del Home, aplicados solo donde la lógica de HubSpot lo permite (p. ej. "Contacto convertido"/"Fuente MQL" solo afectan las métricas de tipo `contacto`, no SQLs/Opps/Clientes).
- Trabajo dividido en 3 lotes verificados independientemente: (1) Funnel principal + paneles Marketing/Comercial, (2) las 6 series de tiempo por UDN (Contactos, MQL, MQL descalificados, SQL credenciales, Propuestas creadas, Propuestas perdidas), (3) Propuestas activas/ganadas por facturar/facturadas.
- ~19 RPCs actualizadas en total con parámetros de filtro opcionales.

### IAM — gestión de usuarios
- Restablecimiento de contraseña de usuarios agregado al modal de edición, vía nuevo API route server-side (`/api/iam/password`) que usa la Admin API de Supabase (`service_role` key, nunca expuesta al frontend).
- Sistema de permisos por módulo y vista/tab: columna `permisos` (JSONB) en `perfiles`, con selector en los modales de crear/editar usuario (checkbox de módulo + chips de "Todas" o tabs específicas: Brújula con Director/Operativa/Analista, Redes con sus 6 tabs, HubSpot con sus 4 tabs). Compatible hacia atrás con el campo `vistas` existente.
- Modales de crear/editar usuario con `maxHeight: 90vh` y scroll interno, corrigiendo que el botón "Crear usuario" quedara fuera de pantalla en zooms altos o pantallas chicas.
- Pendiente: aplicar los permisos guardados para filtrar el sidebar y las tabs visibles de cada módulo según el usuario autenticado (fase de consumo, aún no implementada — solo existe la captura/almacenamiento del permiso).

### Documentación
- `README.md` reescrito: pasó de ser una copia literal del README de Brújula Comercial standalone (Motor 1/Motor 2, Prophet, DENUE) a describir ORBIT Hub como plataforma (los 3 módulos, stack, arquitectura de proyectos), con la nota de autoría del modelo Brújula Comercial acotada a su propia sección.

### Colaboración
- Acceso al repo `orbit-hub` compartido con el equipo de RevOps vía GitHub Collaborators (invitación pendiente de aceptación).
- Acceso a Supabase pendiente de definir con el Manager para la unificación de bases de datos entre proyectos.

### Pendiente
- Fase C de permisos: aplicar los permisos de `perfiles.permisos` para ocultar módulos/tabs no autorizados en el sidebar y en cada componente de módulo.
- Migración de Brújula Comercial 2.0: integrar el módulo completo de Brújula standalone (3 vistas: Director/Operativa/Analista) dentro de ORBIT, renombrando el módulo actual a "Brújula Comercial 2.0" — pausada para atender el fix del esquema de HubSpot Analytics.
- Fix de bloat/normalización UDN en `sync.py` (ver sección HubSpot Analytics arriba) — pendiente del lado del equipo de datos, no de ORBIT Hub.
- Definir nombre final de marca (aún sin resolver desde la sesión anterior).

## [Sin versión] — 28-29 de julio de 2026

### Arquitectura
- **Separación en 3 proyectos standalone**: Brújula Comercial, Redes UPAX y HubSpot Analytics migrados a repos y deploys de Vercel independientes (`brujula-comercial-upax`, `redes-sociales-upax`, `hubspot-analytics-upax`).
- **ORBIT Hub reconstruido como cascarón**: se retiró todo el código de negocio duplicado (pipelines Python, componentes de módulo, tipos, mock data) que vivía en el repo original de ORBIT.
- **Decisión de arquitectura de integración**: se evaluaron y descartaron iframe (bloqueado por `X-Frame-Options`/CSP de los módulos) y Multi-Zones vía rewrites (rompía assets JS por falta de `basePath`/`assetPrefix`, y no compartía sesión de login entre dominios). Se adoptó la solución final: los 3 módulos viven como componentes React copiados dentro de ORBIT-HUB, compartiendo una sola sesión de Supabase.

### Autenticación
- Login rediseñado desde cero, con diseño tomado de un mockup propio (canvas de partículas animadas, logos de UDN flotantes, blobs de fondo), conectado a autenticación real vía `supabase.auth.signInWithPassword`.
- Eliminado el Service Worker heredado de Brújula (`sw.js`) que cacheaba agresivamente `/` y `/login`, causando que el navegador sirviera contenido viejo pese a los despliegues nuevos.
- Recuperación de contraseña vía API admin de Supabase para desbloquear acceso durante pruebas.

### Diseño visual
- Nueva paleta de marca (rojo `#dc2626` → morado `#7c3aed` → índigo `#4f46e5`), reemplazando el magenta heredado de Brújula en topbar, sidebar y botones.
- Logo nuevo generado y recortado en 4 tamaños (512/192/64/32px), integrado en topbar, favicon y `manifest.json`.
- Iterado dos veces sobre un segundo logo (kit de favicon optimizado) para reemplazar el primero en todos los puntos de uso.
- Tema oscuro global aclarado (de negro puro `#0F172A` a tonos con más presencia de color) para mejorar contraste del logo y el texto de marca.
- Rediseño de layout tipo "app shell" (inspirado en HubSpot/6sense): sidebar como única franja de color fija, contenido como tarjeta flotante con esquinas redondeadas.
- Ajuste final: topbar (toggle de tema, notificaciones, avatar) movido de franja oscura superior a vivir dentro de la tarjeta de contenido con fondo claro, evitando duplicar superficies oscuras y mejorando la jerarquía visual tipo dashboard SaaS.

### Funcionalidad del sidebar
- Sección "Plataforma" agregada (enlace a IAM · Gestión de usuarios), sobre la sección "Módulos" existente.
- Botón de "Cerrar sesión" funcional agregado al pie del sidebar.
- Soporte responsive: colapso del sidebar en pantallas menores a 768px.
- Marca (logo + "ORBIT Hub") integrada de forma fija en la parte superior del sidebar.

### PWA
- `InstallBanner` (banner de instalación para desktop/mobile) integrado en el layout raíz.
- `manifest.json` corregido: `start_url` apuntaba a una ruta obsoleta (`/preview`), íconos actualizados a los nuevos assets de marca, colores de tema sincronizados con la nueva paleta.

### Infraestructura / despliegue
- Repos conectados a GitHub bajo la cuenta `diegolunal-git`, con autenticación por Personal Access Token resuelta tras conflicto con credenciales de otra cuenta (`dlunalop`) guardadas en el keychain.
- Todos los proyectos desplegados y verificados en Vercel; flujo de trabajo ajustado para probar cambios directamente en producción (sin entornos locales).

### Pendiente
- Confirmar visualmente el último ajuste de layout (topbar dentro de la tarjeta de contenido).
- Verificar contraste de `ChangelogBell` y `UserMenu` sobre el nuevo fondo claro del topbar.
- Confirmar que las variables de entorno de Supabase MBR estén correctamente configuradas en Vercel para ORBIT-HUB.
- Definir nombre final de marca (evaluando alternativas a "ORBIT" por posible conflicto con otras plataformas existentes).
