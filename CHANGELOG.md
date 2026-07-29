# Changelog — ORBIT Hub

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
