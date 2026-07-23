> ⚠️ **AVISO**: Este documento se actualizó por última vez en su versión original
> alrededor de enero 2026. El proyecto evolucionó significativamente desde entonces.
> **Lee primero la sección "ACTUALIZACIÓN 2026-06-17" al final de este archivo**
> para el estado real actual — luego usa las secciones de arriba solo como contexto
> histórico de diseño original (varios datos ahí ya están desactualizados, señalados
> abajo). Ver también CHANGELOG.md para el detalle cronológico completo de decisiones.

---

# Brújula Comercial — Contexto para AI (Replit)

## Qué es
App web B2B para UPAX (Grupo Salinas). Muestra cuándo prospectar
cada sector económico mexicano basándose en el IGAE del INEGI.

## El problema que resuelve
78% de los leads en HubSpot no tienen industria registrada.
Sin saber el sector del cliente, no se puede saber si su economía
está activa o deprimida. Los SDRs prospectan a ciegas.

## La solución
1. Se recuperó el sector SCIAN de cada empresa via DENUE (INEGI)
2. Se cruzó con el IGAE mensual del INEGI por sector
3. Se calculó Z-score para etiquetar temperatura económica
4. Prophet proyecta los próximos 12 meses por sector

## Output del modelo (ya construido en Python/Colab)
Archivo: df_forecast.parquet
Contenido: 18 sectores × 12 meses (feb 2026 - ene 2027)
Campos: scian_2d, nombre_sector, periodo, yhat, z_score, temperatura
Temperaturas: Caliente / Templado / Tibio / Frio

Archivo: df_brujula.parquet  
Contenido: 22,317 leads de HubSpot con temperatura económica asignada
Campos: ID, empresa, scian_2d, industria_normalizada, 
        periodo_cruce, z_score, temperatura, UDN/Pipeline,
        Motivo de descalificación

## Lo que debe construir la app

### Vista 1 — Director
- Tabla: sector × mes con emojis de temperatura
- Ranking de sectores más calientes HOY
- Alerta cuando un sector cambia de temperatura

### Vista 2 — Operativa (SDRs)
- Semáforo por sector: prospectar / esperar / pausar
- Lista de leads a reactivar (estaban Fríos, ahora Calientes)
- Recomendación de la semana por UDN

## Stack de la app
- Frontend: Next.js (React)
- Deploy: Vercel
- Backend/datos: Google Sheets como base de datos ligera
- Auth: Google OAuth (cuentas @upax.mx)
- Datos del modelo: leer desde parquets en Drive o exportar a Sheets

## UDNs de UPAX (9 unidades de negocio)
UIX, Marketing United, Researchland, Zeus, Promo Espacio,
House of Films, Neracode, Mexa Creativa, UPAX staff

## Sectores críticos ahora (enero 2026, dato más reciente)
Calientes: 62-Salud, 52-Financiero, 54-TI, 61-Educación,
           53-Inmobiliario, 46-Comercio menor, 51-Telecomunicaciones,
           48-Transportes, 23-Construcción
Fríos:     56-Servicios apoyo negocios, 22-Electricidad, 21-Minería

## Lo que NO hace la app
- No conecta en tiempo real con HubSpot
- No hace el análisis de datos (eso ya está hecho en Colab)
- No modifica el CRM


---

## ACTUALIZACIÓN 2026-06-17 — Estado real actual (Diego Luna)

### Qué cambió desde el diseño original (arriba)
- **Escala real**: no son 22,317 leads / 18 sectores — son **75,969 registros** y
  **91 subsectores SCIAN** (2 y 3 dígitos). El archivo real es `pipeline/data/df_maestro.parquet`,
  no `df_forecast.parquet`/`df_brujula.parquet`.
- **Stack real de datos**: NO es Google Sheets como base de datos. Es **Supabase** (Postgres)
  para usuarios/perfiles (tabla `perfiles`) y autenticación (email/password, no Google OAuth).
  Los parquets del pipeline de matching SCIAN se generan en local (VS Code, ya no Colab) y se
  consumen vía API routes de Next.js, no se exportan a Sheets.
- **UDNs actuales (8, no 9)**: UIX, MU (Marketing United), PE (Promo Espacio), ZU (Zeus),
  NC (Neracode), HOF (House Of Films), RL (Research Land), MEXA (Mexa Creativa).
  "UPAX staff" del diseño original ahora es **MKT** (Marketing Corporativo), tratada como
  una UDN madre más (no como caso especial) en el sistema de jerarquía del IAM.
- **Sectores críticos**: el dato de "enero 2026" ya no aplica. El IGAE más reciente
  disponible es de **marzo 2026** (actualizado 22 de mayo 2026, próxima actualización
  23 de junio 2026). Esto se actualiza manualmente por ahora en `Topbar.tsx` y
  `TemporalidadChart.tsx` (pendiente: automatizar con scraper del sitemap INEGI, sin IA,
  ya que es dato estructurado no ambiguo).

### Funcionalidad nueva no contemplada en el diseño original
- **Módulo IAM** (`/app/iam/page.tsx`): gestión de usuarios con roles de permisos
  (admin/director/comercial/sdr) Y un sistema de jerarquía organizacional separado
  (`udn_madre`, `reporta_a`, `nivel_jerarquico`: principal/gerente/comercial/sdr/analista).
  Tabla agrupada visualmente por UDN madre con indentación jerárquica y grupos colapsables.
- **Pipeline de matching SCIAN multi-capa** (no estaba en el diseño original como tal):
  Capa 0 catálogo manual de marcas → Capa 1 Jaro-Winkler vs DENUE → Capa 2 catálogo HubSpot
  heredado → Capa 3 campo Industria Apollo/HubSpot → Capa 4 IA (Groq, con fallback a
  Cohere y Mistral si se agota cuota). Orquestador real: `pipeline/integrar_groq.py`
  (el nombre del archivo es engañoso, no es solo de Groq).
- **Cobertura actual**: SCIAN_2 (sector) = 94.4%. SCIAN_3 (subrama, ej. Automotriz vs
  Farmacéutica dentro de Manufactura) = 67.7%, subiendo gradualmente. Ver CHANGELOG.md
  v1.3.0 a v1.5.0 para el detalle de cómo se llegó ahí y qué falta.

### Confirmaciones que SÍ siguen vigentes del diseño original
- No conecta en tiempo real con HubSpot — todo sigue siendo semi-automatizado, ejecución manual.
- No modifica el CRM directamente.
- El propósito de fondo (saber cuándo prospectar por sector según temporalidad económica
  IGAE) sigue siendo el mismo norte del proyecto.

### Para otra IA que retome este proyecto (ej. en Replit)
1. Lee este archivo completo + CHANGELOG.md (versión más reciente primero) antes de tocar código.
2. El pipeline de matching SCIAN vive en `pipeline/` y corre desde **la raíz del proyecto**
   (no desde dentro de `pipeline/`), ej: `python3 pipeline/integrar_groq.py`.
3. Las API keys (GROQ/COHERE/MISTRAL/SUPABASE) están en `.env.local`, no se cargan
   automáticamente con dotenv en los scripts de Python — hay que exportarlas manualmente
   en la sesión de shell antes de correr cualquier script del pipeline.
4. Pendientes activos al cierre de esta sesión: ver última sección de CHANGELOG.md
   ("Pendientes para próxima sesión").
