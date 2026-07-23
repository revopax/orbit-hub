import os, re

DIR = 'app/components'

# =============================================================================
# 1. VISTA ANALISTA — quitar título, ancho completo, más espacio entre bloques
# =============================================================================
path = f'{DIR}/VistaAnalista.tsx'
with open(path, 'r') as f: c = f.read()

# Quitar el header "Vista del Analista"
c = re.sub(
    r'      {/* Header */}\s*<div className="mb-6">\s*<h2[^>]*>Vista del Analista</h2>.*?</p>\s*</div>',
    '      {/* Selector UDNs */}',
    c, flags=re.DOTALL
)

# Ancho completo + espaciado generoso entre bloques
c = c.replace(
    '<div className="max-w-6xl mx-auto px-4 py-6">',
    '<div className="w-full space-y-10 px-3 py-4">'
)

# Aumentar gap entre tarjetas EDA y añadir mt antes de componentes
c = c.replace('className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"', 'className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"')

# Añadir mt-10 (margen top grande) antes de cada Bloque para separarlos
c = c.replace(
    '{/* Bloque 2: Calidad de leads */}\n      <BloqueCalidadLeads',
    '{/* Bloque 2: Calidad de leads */}\n      <div className="mt-10" />\n      <BloqueCalidadLeads'
)
c = c.replace(
    '{/* Bloque 3: ¿Por qué perdemos? */}\n      <RadarPerdidas',
    '{/* Bloque 3: ¿Por qué perdemos? */}\n      <div className="mt-10" />\n      <RadarPerdidas'
)
c = c.replace(
    '{/* Bloque 4: Sectores competidos */}\n      <BloqueSectoresCompetencia',
    '{/* Bloque 4: Sectores competidos */}\n      <div className="mt-10" />\n      <BloqueSectoresCompetencia'
)
c = c.replace(
    '{/* Bloque 5: Cross-sell */}\n      <BloqueCrossSell',
    '{/* Bloque 5: Cross-sell */}\n      <div className="mt-10" />\n      <BloqueCrossSell'
)
c = c.replace(
    '{/* Bloque 6: Ceguera operativa */}\n      <BloqueCegueraOperativa',
    '{/* Bloque 6: Ceguera operativa */}\n      <div className="mt-10" />\n      <BloqueCegueraOperativa'
)

with open(path, 'w') as f: f.write(c)
print(f"✅ {path}: título eliminado, layout ancho, espaciado x3")

# =============================================================================
# 2. RADAR PERDIDAS — más grande, mejor contraste, textos más legibles
# =============================================================================
path = f'{DIR}/RadarPerdidas.tsx'
with open(path, 'r') as f: c = f.read()

# Radar más grande
c = c.replace('const size = 280', 'const size = 360')
c = c.replace('const radius = size * 0.38', 'const radius = size * 0.40')

# Mayor opacidad de fill para ver superposición
c = c.replace('fillOpacity={0.12}', 'fillOpacity={0.30}')
c = c.replace('strokeWidth="2"', 'strokeWidth="3"')

# Labels más grandes y legibles
c = c.replace('text-[9px]', 'text-[11px]')
c = c.replace('style={{ fontSize: 9 }}', 'style={{ fontSize: 11 }}')

with open(path, 'w') as f: f.write(c)
print(f"✅ {path}: radar 360px, fill 30%, stroke 3px, labels 11px")

# =============================================================================
# 3. BLOQUE CALIDAD LEADS — textos más grandes
# =============================================================================
path = f'{DIR}/BloqueCalidadLeads.tsx'
with open(path, 'r') as f: c = f.read()

# Aumentar textos pequeños a legibles
c = c.replace('text-[10px]', 'text-xs')   # 10px -> 12px
c = c.replace('text-xs text-slate-500 mb-4', 'text-sm text-[var(--txt-3)] mb-5')  # subtítulo más grande

with open(path, 'w') as f: f.write(c)
print(f"✅ {path}: textos aumentados")

# =============================================================================
# 4. BLOQUE SECTORES COMPETENCIA — textos más grandes
# =============================================================================
path = f'{DIR}/BloqueSectoresCompetencia.tsx'
with open(path, 'r') as f: c = f.read()

c = c.replace('text-[10px]', 'text-xs')
c = c.replace('text-xs text-slate-500 mb-4', 'text-sm text-[var(--txt-3)] mb-5')

with open(path, 'w') as f: f.write(c)
print(f"✅ {path}: textos aumentados")

# =============================================================================
# 5. BLOQUE CROSS-SELL — textos más grandes
# =============================================================================
path = f'{DIR}/BloqueCrossSell.tsx'
with open(path, 'r') as f: c = f.read()

c = c.replace('text-[10px]', 'text-xs')
c = c.replace('text-xs text-slate-500 mb-4', 'text-sm text-[var(--txt-3)] mb-5')

with open(path, 'w') as f: f.write(c)
print(f"✅ {path}: textos aumentados")

# =============================================================================
# 6. BLOQUE CEGUERA OPERATIVA — textos más grandes
# =============================================================================
path = f'{DIR}/BloqueCegueraOperativa.tsx'
with open(path, 'r') as f: c = f.read()

c = c.replace('text-[10px]', 'text-xs')
c = c.replace('text-xs text-slate-500 mb-4', 'text-sm text-[var(--txt-3)] mb-5')

with open(path, 'w') as f: f.write(c)
print(f"✅ {path}: textos aumentados")

print("\n🔥 Todos los fixes aplicados. Corre: npm run build")
