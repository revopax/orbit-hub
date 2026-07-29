# 🌐 ORBIT Hub — UPAX Marketing Corporativo

## Descripción

ORBIT Hub es el cascarón (shell) que unifica los tres sistemas de inteligencia
comercial y de marketing de UPAX en una sola plataforma, con sesión compartida
y navegación centralizada. Cada módulo vive como componente React dentro del
mismo proyecto Next.js, sin iframes ni rewrites.

## Módulos

### 🧭 Brújula Comercial
Modelo analítico de prospección B2B basado en temporalidad económica sectorial.
Cruza el CRM de HubSpot contra el DENUE y el IGAE del INEGI para identificar
el momento óptimo de prospección por sector económico y UDN. Incluye 3 vistas
por rol (Director, Operativa, Analista) con radar de pérdidas, cruce de señales,
ceguera operativa y calendario de servicios.

> **Autoría:** modelo original de Diego Leonel Luna López, desarrollado
> inicialmente como tesis de maestría en Ciencia de Datos e Información
> (INFOTEC/CONACYT), previo a su implementación en UPAX — "Modelo predictivo
> de timing comercial basado en indicadores macroeconómicos sectoriales del INEGI".

### 📱 Redes UPAX
Dashboard de performance de redes sociales y pauta digital: META Orgánico,
META Ads, Google Ads, GA4, LinkedIn Orgánico y LinkedIn Ads. Engagement,
alcance, impresiones y bitácora de contenido por UDN.

### 🔶 HubSpot Analytics
Analítica de embudo comercial (Data Engineering + Marketing Analytics) sobre
la tabla `mbr` de Supabase, sincronizada desde HubSpot cada 2 horas. Incluye
Home (funnel completo, series de tiempo, paneles por equipo/UDN), MBR,
Negocios perdidos y Email marketing — todo con filtros server-side
(UDN, generado por, fuente de adquisición, motivo de pérdida).

## Stack

- **Frontend:** Next.js (App Router) + TypeScript + Recharts
- **Backend de datos:** Supabase (Postgres + RPCs + Auth)
  - Proyecto de autenticación, perfiles, IAM, Brújula/Redes
  - Proyecto de tabla `mbr` (HubSpot sync), Radar Político
- **Despliegue:** Vercel
- **Auth compartida:** Supabase Auth con perfiles y permisos por módulo/vista (IAM)

## Arquitectura de los proyectos

ORBIT Hub aloja los componentes de interfaz ya construidos, copiados dentro de
`app/components/`. Los proyectos standalone de cada módulo (Brújula Comercial,
Redes UPAX, HubSpot Analytics) contienen la lógica de negocio pesada (pipelines
Python, notebooks, modelos de datos).

## Contexto de negocio

- **Empresa:** UPAX (Grupo Salinas) — holding B2B con 9 UDNs
- **UDNs:** UiX, Marketing United, Research Land, Zeus, Promo Espacio,
  House Of Films, Neracode, Mexa Creativa, UPAX
- **Equipo beneficiado:** Performance y Conversión (pauta), SDRs (prospección),
  Comerciales (forecast de cierre)
