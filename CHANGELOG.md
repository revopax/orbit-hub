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
