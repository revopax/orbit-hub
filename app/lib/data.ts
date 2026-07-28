import type { UDN, KPI, Industria, TemperaturaData, DataTemporalidad, PicoRow, RescueRow, CalendarioCell } from './types';

export const UDNS: UDN[] = [
  { id: 'UIX',  sigla: 'UIX',  nombre: 'UIX',             color: '#8C59FE', secundario: '#597AFF', texto: '#fff' },
  { id: 'MU',   sigla: 'MU',   nombre: 'Marketing United', color: '#DCFF00', secundario: '#000000', texto: '#FFFFFF' },
  { id: 'PE',   sigla: 'PE',   nombre: 'Promo Espacio',    color: '#FF7600',                        texto: '#fff' },
  { id: 'ZU',   sigla: 'ZU',   nombre: 'Zeus',             color: '#61ACAA', secundario: '#FF004F', texto: '#fff' },
  { id: 'NC',   sigla: 'NC',   nombre: 'Neracode',         color: '#3E31CC',                        texto: '#fff' },
  { id: 'HOF',  sigla: 'HOF',  nombre: 'House Of Films',   color: '#000000', secundario: '#3274FC', texto: '#FFFFFF' },
  { id: 'RL',   sigla: 'RL',   nombre: 'Research Land',    color: '#770EB7',                        texto: '#fff' },
  { id: 'MEXA', sigla: 'MEXA', nombre: 'Mexa Creativa',    color: '#FD00C7',                        texto: '#fff' },
];

export const mockKPIs: Record<string, KPI[]> = {
  UIX: [
    { label: 'Real YTD',           valor: '$1.73M', meta: '$10.0M', badge: '17.3% del año', badgeColor: 'red',   tipo: 'moneda',   acento: '#8C59FE' },
    { label: 'Avance vs meta 2026',valor: '17.3%',  meta: '$10.0M', pct: 17, badge: '▼ vs plan Q1', badgeColor: 'red', tipo: 'progreso', acento: '#8C59FE' },
    { label: 'Proyectos ganados',   valor: 3,        meta: 20,       badge: '▼ 85% vs meta', badgeColor: 'red',   tipo: 'numero',  acento: '#8C59FE' },
    { label: 'Leads acumulados',    valor: '3,840',  meta: '14,000 · mes: 320', badge: '▼ 73% vs meta', badgeColor: 'red', tipo: 'numero', acento: '#8C59FE' },
    { label: 'Ticket promedio',     valor: '$578K',  meta: '$520K',  badge: '▲ $58K vs meta', badgeColor: 'green', tipo: 'moneda', acento: '#8C59FE' },
  ],
  MU: [
    { label: 'Real YTD',           valor: '$744K',  meta: '$12.0M', badge: '6.2% del año', badgeColor: 'red',   tipo: 'moneda',  acento: '#DCFF00' },
    { label: 'Avance vs meta 2026',valor: '6.2%',   meta: '$12.0M', pct: 42, badge: '-2% vs ene', badgeColor: 'red', tipo: 'progreso', acento: '#DCFF00' },
    { label: 'Proyectos ganados',   valor: 9,        meta: 22,       badge: '▼ 59% vs meta', badgeColor: 'red',   tipo: 'numero',  acento: '#DCFF00' },
    { label: 'Leads acumulados',    valor: '5,210',  meta: '18,000 · mes: 434', badge: '▼ 71% vs meta', badgeColor: 'red', tipo: 'numero', acento: '#DCFF00' },
    { label: 'Ticket promedio',     valor: '$320K',  meta: '$380K',  badge: '▼ $60K vs meta', badgeColor: 'red', tipo: 'moneda',  acento: '#DCFF00' },
  ],
  PE: [
    { label: 'Real YTD',           valor: '$2.02M', meta: '$18.0M', badge: '11.2% del año', badgeColor: 'green', tipo: 'moneda',  acento: '#FF7600' },
    { label: 'Avance vs meta 2026',valor: '11.2%',  meta: '$18.0M', pct: 65, badge: '+5% vs ene', badgeColor: 'green', tipo: 'progreso', acento: '#FF7600' },
    { label: 'Proyectos ganados',   valor: 19,       meta: 30,       badge: '▲ 63% avance',  badgeColor: 'green', tipo: 'numero', acento: '#FF7600' },
    { label: 'Leads acumulados',    valor: '7,445',  meta: '20,000 · mes: 620', badge: '▲ 37% vs meta', badgeColor: 'amber', tipo: 'numero', acento: '#FF7600' },
    { label: 'Ticket promedio',     valor: '$210K',  meta: '$250K',  badge: '▼ $40K vs meta', badgeColor: 'amber', tipo: 'moneda', acento: '#FF7600' },
  ],
  ZU: [
    { label: 'Real YTD',           valor: '$1.32M', meta: '$14.5M', badge: '9.1% del año', badgeColor: 'green', tipo: 'moneda',  acento: '#61ACAA' },
    { label: 'Avance vs meta 2026',valor: '9.1%',   meta: '$14.5M', pct: 63, badge: '+1% vs ene', badgeColor: 'green', tipo: 'progreso', acento: '#61ACAA' },
    { label: 'Proyectos ganados',   valor: 11,       meta: 18,       badge: '▼ 61% avance',  badgeColor: 'amber', tipo: 'numero', acento: '#61ACAA' },
    { label: 'Leads acumulados',    valor: '4,267',  meta: '12,000 · mes: 355', badge: '▼ 64% vs meta', badgeColor: 'red', tipo: 'numero', acento: '#61ACAA' },
    { label: 'Ticket promedio',     valor: '$610K',  meta: '$650K',  badge: '▼ $40K vs meta', badgeColor: 'amber', tipo: 'moneda', acento: '#61ACAA' },
  ],
  NC: [
    { label: 'Real YTD',           valor: '$1.17M', meta: '$15.0M', badge: '7.8% del año', badgeColor: 'red',   tipo: 'moneda',  acento: '#3E31CC' },
    { label: 'Avance vs meta 2026',valor: '7.8%',   meta: '$15.0M', pct: 52, badge: '-5% vs ene', badgeColor: 'red', tipo: 'progreso', acento: '#3E31CC' },
    { label: 'Proyectos ganados',   valor: 7,        meta: 28,       badge: '▼ 75% vs meta', badgeColor: 'red',   tipo: 'numero',  acento: '#3E31CC' },
    { label: 'Leads acumulados',    valor: '3,200',  meta: '14,000 · mes: 290', badge: '▼ 77% vs meta', badgeColor: 'red', tipo: 'numero', acento: '#3E31CC' },
    { label: 'Ticket promedio',     valor: '$240K',  meta: '$420K',  badge: '▼ 43% vs meta', badgeColor: 'red', tipo: 'moneda',  acento: '#3E31CC' },
  ],
  HOF: [
    { label: 'Real YTD',           valor: '$2.48M', meta: '$20.0M', badge: '12.4% del año', badgeColor: 'green', tipo: 'moneda', acento: '#94A3B8' },
    { label: 'Avance vs meta 2026',valor: '12.4%',  meta: '$20.0M', pct: 71, badge: '+8% vs ene', badgeColor: 'green', tipo: 'progreso', acento: '#94A3B8' },
    { label: 'Proyectos ganados',   valor: 22,       meta: 32,       badge: '▲ 69% avance',  badgeColor: 'green', tipo: 'numero', acento: '#94A3B8' },
    { label: 'Leads acumulados',    valor: '8,512',  meta: '22,000 · mes: 710', badge: '▲ 39% avance', badgeColor: 'amber', tipo: 'numero', acento: '#94A3B8' },
    { label: 'Ticket promedio',     valor: '$890K',  meta: '$900K',  badge: '▼ $10K vs meta', badgeColor: 'amber', tipo: 'moneda', acento: '#94A3B8' },
  ],
  RL: [
    { label: 'Real YTD',           valor: '$460K',  meta: '$10.0M', badge: '4.6% del año', badgeColor: 'red',   tipo: 'moneda',  acento: '#770EB7' },
    { label: 'Avance vs meta 2026',valor: '4.6%',   meta: '$10.0M', pct: 46, badge: '-8% vs ene', badgeColor: 'red', tipo: 'progreso', acento: '#770EB7' },
    { label: 'Proyectos ganados',   valor: 5,        meta: 16,       badge: '▼ 69% vs meta', badgeColor: 'red',   tipo: 'numero',  acento: '#770EB7' },
    { label: 'Leads acumulados',    valor: '1,890',  meta: '8,000 · mes: 158', badge: '▼ 76% vs meta', badgeColor: 'red', tipo: 'numero', acento: '#770EB7' },
    { label: 'Ticket promedio',     valor: '$1.1M',  meta: '$1.2M',  badge: '▼ $100K vs meta', badgeColor: 'red', tipo: 'moneda', acento: '#770EB7' },
  ],
  MEXA: [
    { label: 'Real YTD',           valor: '$1.21M', meta: '$13.0M', badge: '9.3% del año', badgeColor: 'green', tipo: 'moneda',  acento: '#FD00C7' },
    { label: 'Avance vs meta 2026',valor: '9.3%',   meta: '$13.0M', pct: 62, badge: '+2% vs ene', badgeColor: 'green', tipo: 'progreso', acento: '#FD00C7' },
    { label: 'Proyectos ganados',   valor: 13,       meta: 24,       badge: '▼ 54% avance',  badgeColor: 'amber', tipo: 'numero', acento: '#FD00C7' },
    { label: 'Leads acumulados',    valor: '4,289',  meta: '11,000 · mes: 358', badge: '▼ 61% vs meta', badgeColor: 'red', tipo: 'numero', acento: '#FD00C7' },
    { label: 'Ticket promedio',     valor: '$275K',  meta: '$310K',  badge: '▼ $35K vs meta', badgeColor: 'amber', tipo: 'moneda', acento: '#FD00C7' },
  ],
};

export const mockIndustrias: Record<string, Industria[]> = {
  UIX: [
    { nombre: 'Tecnología de la Información', temperatura: 'caliente', mesPico: 'mayo 2026', accion: 'llamar', leads: 1708 },
    { nombre: 'Servicios Financieros', temperatura: 'caliente', mesPico: 'jun 2026', accion: 'llamar', leads: 2047 },
    { nombre: 'Manufactura Automotriz', temperatura: 'templado', mesPico: 'jul 2026', accion: 'prepararse', leads: 980 },
    { nombre: 'Comercio al por Menor', temperatura: 'tibio', mesPico: 'ago 2026', accion: 'esperar', leads: 620 },
    { nombre: 'Construcción e Infraestructura', temperatura: 'frio', mesPico: 'ene 2027', accion: 'esperar', leads: 385 },
  ],
  MU: [
    { nombre: 'Publicidad y Medios', temperatura: 'caliente', mesPico: 'mayo 2026', accion: 'llamar', leads: 2340 },
    { nombre: 'Retail y Consumo Masivo', temperatura: 'caliente', mesPico: 'jun 2026', accion: 'llamar', leads: 1870 },
    { nombre: 'Telecomunicaciones', temperatura: 'templado', mesPico: 'jul 2026', accion: 'prepararse', leads: 1200 },
    { nombre: 'Alimentos y Bebidas', temperatura: 'tibio', mesPico: 'ago 2026', accion: 'esperar', leads: 780 },
    { nombre: 'Educación Superior', temperatura: 'frio', mesPico: 'oct 2026', accion: 'esperar', leads: 420 },
  ],
  PE: [
    { nombre: 'Retail y Puntos de Venta', temperatura: 'caliente', mesPico: 'abr 2026', accion: 'llamar', leads: 4721 },
    { nombre: 'Entretenimiento y Eventos', temperatura: 'caliente', mesPico: 'mayo 2026', accion: 'llamar', leads: 2047 },
    { nombre: 'Turismo y Hospitalidad', temperatura: 'templado', mesPico: 'jun 2026', accion: 'prepararse', leads: 1993 },
    { nombre: 'Servicios de Salud', temperatura: 'tibio', mesPico: 'jul 2026', accion: 'esperar', leads: 1702 },
    { nombre: 'Automotriz y Distribuidores', temperatura: 'frio', mesPico: 'ene 2027', accion: 'esperar', leads: 982 },
  ],
  ZU: [
    { nombre: 'Banca y Seguros', temperatura: 'caliente', mesPico: 'jun 2026', accion: 'llamar', leads: 1890 },
    { nombre: 'Energía y Minería', temperatura: 'caliente', mesPico: 'mayo 2026', accion: 'llamar', leads: 1340 },
    { nombre: 'Logística y Transporte', temperatura: 'templado', mesPico: 'jul 2026', accion: 'prepararse', leads: 1120 },
    { nombre: 'Manufactura Industrial', temperatura: 'tibio', mesPico: 'ago 2026', accion: 'esperar', leads: 677 },
    { nombre: 'Agroindustria', temperatura: 'frio', mesPico: 'nov 2026', accion: 'esperar', leads: 240 },
  ],
  NC: [
    { nombre: 'Fintech y servicios digitales', temperatura: 'caliente', mesPico: 'mayo 2026', accion: 'llamar', leads: 1708 },
    { nombre: 'Banca y seguros', temperatura: 'caliente', mesPico: 'jun 2026', accion: 'llamar', leads: 2047 },
    { nombre: 'E-commerce y retail tech', temperatura: 'templado', mesPico: 'ago 2026', accion: 'prepararse', leads: 4721 },
    { nombre: 'Manufactura 4.0', temperatura: 'tibio', mesPico: 'oct 2026', accion: 'esperar', leads: 1993 },
    { nombre: 'Logística y transporte', temperatura: 'frio', mesPico: 'ene 2027', accion: 'esperar', leads: 1702 },
  ],
  HOF: [
    { nombre: 'Entretenimiento y Streaming', temperatura: 'caliente', mesPico: 'abr 2026', accion: 'llamar', leads: 3120 },
    { nombre: 'Publicidad y Marketing Digital', temperatura: 'caliente', mesPico: 'mayo 2026', accion: 'llamar', leads: 2480 },
    { nombre: 'Medios de Comunicación', temperatura: 'templado', mesPico: 'jun 2026', accion: 'prepararse', leads: 1890 },
    { nombre: 'Turismo y Hospitalidad', temperatura: 'tibio', mesPico: 'jul 2026', accion: 'esperar', leads: 980 },
    { nombre: 'Gobierno y Sector Público', temperatura: 'frio', mesPico: 'sep 2026', accion: 'esperar', leads: 532 },
  ],
  RL: [
    { nombre: 'Consultoría y Servicios Prof.', temperatura: 'caliente', mesPico: 'jun 2026', accion: 'llamar', leads: 540 },
    { nombre: 'Gobierno y Sector Público', temperatura: 'caliente', mesPico: 'mayo 2026', accion: 'llamar', leads: 780 },
    { nombre: 'Farmacéutica y Biotech', temperatura: 'templado', mesPico: 'jul 2026', accion: 'prepararse', leads: 390 },
    { nombre: 'Telecomunicaciones', temperatura: 'tibio', mesPico: 'ago 2026', accion: 'esperar', leads: 180 },
    { nombre: 'Educación Superior', temperatura: 'frio', mesPico: 'nov 2026', accion: 'esperar', leads: 92 },
  ],
  MEXA: [
    { nombre: 'Moda y Diseño', temperatura: 'caliente', mesPico: 'mayo 2026', accion: 'llamar', leads: 1680 },
    { nombre: 'Cultura y Entretenimiento', temperatura: 'caliente', mesPico: 'jun 2026', accion: 'llamar', leads: 1240 },
    { nombre: 'Alimentos Gourmet y Restaurantes', temperatura: 'templado', mesPico: 'jul 2026', accion: 'prepararse', leads: 880 },
    { nombre: 'Turismo y Hospitalidad', temperatura: 'tibio', mesPico: 'ago 2026', accion: 'esperar', leads: 489 },
    { nombre: 'Artesanía y Comercio Local', temperatura: 'frio', mesPico: 'oct 2026', accion: 'esperar', leads: 278 },
  ],
};

export const mockTemperatura: Record<string, TemperaturaData> = {
  UIX: { caliente: 1240, templado: 980, tibio: 920, frio: 700 },
  MU: { caliente: 1820, templado: 1540, tibio: 1100, frio: 750 },
  PE: { caliente: 2480, templado: 2020, tibio: 1740, frio: 1205 },
  ZU: { caliente: 1090, templado: 1380, tibio: 1120, frio: 677 },
  NC: { caliente: 6187, templado: 10741, tibio: 4062, frio: 13012 },
  HOF: { caliente: 3120, templado: 2480, tibio: 1890, frio: 1022 },
  RL: { caliente: 540, templado: 780, tibio: 390, frio: 180 },
  MEXA: { caliente: 1680, templado: 1240, tibio: 880, frio: 489 },
};

const meses = ['Ene\'24','Feb\'24','Mar\'24','Abr\'24','May\'24','Jun\'24','Jul\'24','Ago\'24','Sep\'24','Oct\'24','Nov\'24','Dic\'24','Ene\'25','Feb\'25','Mar\'25','Abr\'25','May\'25','Jun\'25','Jul\'25','Ago\'25','Sep\'25','Oct\'25','Nov\'25','Dic\'25','Ene\'26','Feb\'26','Mar\'26','Abr\'26','May\'26'];

function genHistorico(base: number, variacion: number, count: number): number[] {
  let val = base;
  return Array.from({ length: count }, () => {
    val += (Math.random() - 0.5) * variacion;
    return parseFloat(val.toFixed(2));
  });
}

function genForecast(lastVal: number, trend: number, count: number): (number | null)[] {
  let val = lastVal;
  return Array.from({ length: count }, () => {
    val += trend + (Math.random() - 0.4) * 2;
    return parseFloat(val.toFixed(2));
  });
}

function buildTemporalidad(sectores: { nombre: string; base: number; variacion: number; trend: number }[]): DataTemporalidad {
  const historicoLen = 24;
  return {
    labels: meses,
    sectores: sectores.map(s => {
      const hist = genHistorico(s.base, s.variacion, historicoLen);
      const lastVal = hist[hist.length - 1];
      const forecast = genForecast(lastVal, s.trend, meses.length - historicoLen);
      const historicoFull: (number | null)[] = [...hist, ...Array(meses.length - historicoLen).fill(null)];
      const forecastFull: (number | null)[] = [...Array(historicoLen - 1).fill(null), lastVal, ...forecast];
      return { nombre: s.nombre, historico: historicoFull, forecast: forecastFull };
    }),
  };
}

export const mockTemporalidad: Record<string, DataTemporalidad> = {
  UIX: buildTemporalidad([
    { nombre: 'Tecnología de la Información', base: 108, variacion: 4, trend: 1.2 },
    { nombre: 'Servicios Financieros', base: 102, variacion: 3, trend: 0.8 },
    { nombre: 'Manufactura Automotriz', base: 95, variacion: 5, trend: -0.3 },
  ]),
  MU: buildTemporalidad([
    { nombre: 'Publicidad y Medios', base: 105, variacion: 5, trend: 1.5 },
    { nombre: 'Retail y Consumo Masivo', base: 99, variacion: 4, trend: 0.6 },
    { nombre: 'Telecomunicaciones', base: 103, variacion: 3, trend: 0.4 },
  ]),
  PE: buildTemporalidad([
    { nombre: 'Retail y Puntos de Venta', base: 112, variacion: 6, trend: 1.8 },
    { nombre: 'Entretenimiento y Eventos', base: 106, variacion: 5, trend: 1.3 },
    { nombre: 'Turismo y Hospitalidad', base: 97, variacion: 7, trend: 0.9 },
  ]),
  ZU: buildTemporalidad([
    { nombre: 'Banca y Seguros', base: 107, variacion: 3, trend: 0.7 },
    { nombre: 'Energía y Minería', base: 100, variacion: 6, trend: 1.1 },
    { nombre: 'Logística y Transporte', base: 98, variacion: 4, trend: 0.5 },
  ]),
  NC: buildTemporalidad([
    { nombre: 'Fintech y Criptomonedas', base: 115, variacion: 8, trend: 2.1 },
    { nombre: 'Salud Digital y Healthtech', base: 108, variacion: 5, trend: 1.6 },
    { nombre: 'E-commerce y Marketplaces', base: 104, variacion: 6, trend: 1.0 },
  ]),
  HOF: buildTemporalidad([
    { nombre: 'Entretenimiento y Streaming', base: 118, variacion: 7, trend: 2.4 },
    { nombre: 'Publicidad y Marketing Digital', base: 110, variacion: 5, trend: 1.9 },
    { nombre: 'Medios de Comunicación', base: 101, variacion: 4, trend: 0.7 },
  ]),
  RL: buildTemporalidad([
    { nombre: 'Consultoría y Servicios Prof.', base: 103, variacion: 3, trend: 0.6 },
    { nombre: 'Gobierno y Sector Público', base: 98, variacion: 4, trend: 0.3 },
    { nombre: 'Farmacéutica y Biotech', base: 106, variacion: 4, trend: 0.9 },
  ]),
  MEXA: buildTemporalidad([
    { nombre: 'Moda y Diseño', base: 109, variacion: 6, trend: 1.7 },
    { nombre: 'Cultura y Entretenimiento', base: 104, variacion: 5, trend: 1.2 },
    { nombre: 'Alimentos Gourmet y Restaurantes', base: 100, variacion: 5, trend: 0.8 },
  ]),
};

const mesesCalendario = ['Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'];

export const mockCalendario: Record<string, { meses: string[]; filas: { industria: string; celdas: CalendarioCell['estado'][] }[] }> = {
  UIX: {
    meses: mesesCalendario,
    filas: [
      { industria: 'Tecnología de la Información', celdas: ['prep', 'pico', 'ok', 'vacio', 'vacio', 'vacio'] },
      { industria: 'Servicios Financieros', celdas: ['vacio', 'prep', 'pico', 'ok', 'vacio', 'vacio'] },
      { industria: 'Manufactura Automotriz', celdas: ['vacio', 'vacio', 'prep', 'pico', 'ok', 'vacio'] },
      { industria: 'Comercio al por Menor', celdas: ['vacio', 'vacio', 'vacio', 'prep', 'pico', 'ok'] },
      { industria: 'Construcción e Infraestructura', celdas: ['vacio', 'vacio', 'vacio', 'vacio', 'prep', 'pico'] },
    ],
  },
  MU: {
    meses: mesesCalendario,
    filas: [
      { industria: 'Publicidad y Medios', celdas: ['prep', 'pico', 'ok', 'vacio', 'vacio', 'vacio'] },
      { industria: 'Retail y Consumo Masivo', celdas: ['vacio', 'prep', 'pico', 'ok', 'vacio', 'vacio'] },
      { industria: 'Telecomunicaciones', celdas: ['vacio', 'vacio', 'prep', 'pico', 'vacio', 'vacio'] },
      { industria: 'Alimentos y Bebidas', celdas: ['vacio', 'vacio', 'vacio', 'prep', 'pico', 'vacio'] },
      { industria: 'Educación Superior', celdas: ['vacio', 'vacio', 'vacio', 'vacio', 'vacio', 'prep'] },
    ],
  },
  PE: {
    meses: mesesCalendario,
    filas: [
      { industria: 'Retail y Puntos de Venta', celdas: ['pico', 'ok', 'vacio', 'vacio', 'vacio', 'vacio'] },
      { industria: 'Entretenimiento y Eventos', celdas: ['prep', 'pico', 'ok', 'vacio', 'vacio', 'vacio'] },
      { industria: 'Turismo y Hospitalidad', celdas: ['vacio', 'prep', 'pico', 'ok', 'vacio', 'vacio'] },
      { industria: 'Servicios de Salud', celdas: ['vacio', 'vacio', 'prep', 'pico', 'vacio', 'vacio'] },
      { industria: 'Automotriz y Distribuidores', celdas: ['vacio', 'vacio', 'vacio', 'vacio', 'prep', 'pico'] },
    ],
  },
  ZU: {
    meses: mesesCalendario,
    filas: [
      { industria: 'Energía y Minería', celdas: ['prep', 'pico', 'ok', 'vacio', 'vacio', 'vacio'] },
      { industria: 'Banca y Seguros', celdas: ['vacio', 'prep', 'pico', 'ok', 'vacio', 'vacio'] },
      { industria: 'Logística y Transporte', celdas: ['vacio', 'vacio', 'prep', 'pico', 'vacio', 'vacio'] },
      { industria: 'Manufactura Industrial', celdas: ['vacio', 'vacio', 'vacio', 'prep', 'pico', 'vacio'] },
      { industria: 'Agroindustria', celdas: ['vacio', 'vacio', 'vacio', 'vacio', 'vacio', 'prep'] },
    ],
  },
  NC: {
    meses: mesesCalendario,
    filas: [
      { industria: 'Fintech y Criptomonedas', celdas: ['prep', 'pico', 'ok', 'vacio', 'vacio', 'vacio'] },
      { industria: 'Salud Digital y Healthtech', celdas: ['vacio', 'prep', 'pico', 'ok', 'vacio', 'vacio'] },
      { industria: 'E-commerce y Marketplaces', celdas: ['vacio', 'vacio', 'prep', 'pico', 'vacio', 'vacio'] },
      { industria: 'Educación Online', celdas: ['vacio', 'vacio', 'vacio', 'prep', 'pico', 'vacio'] },
      { industria: 'IoT e Industria 4.0', celdas: ['vacio', 'vacio', 'vacio', 'vacio', 'prep', 'pico'] },
    ],
  },
  HOF: {
    meses: mesesCalendario,
    filas: [
      { industria: 'Entretenimiento y Streaming', celdas: ['pico', 'ok', 'vacio', 'vacio', 'vacio', 'vacio'] },
      { industria: 'Publicidad y Mkt Digital', celdas: ['prep', 'pico', 'ok', 'vacio', 'vacio', 'vacio'] },
      { industria: 'Medios de Comunicación', celdas: ['vacio', 'prep', 'pico', 'ok', 'vacio', 'vacio'] },
      { industria: 'Turismo y Hospitalidad', celdas: ['vacio', 'vacio', 'prep', 'pico', 'vacio', 'vacio'] },
      { industria: 'Gobierno y Sector Público', celdas: ['vacio', 'vacio', 'vacio', 'prep', 'pico', 'ok'] },
    ],
  },
  RL: {
    meses: mesesCalendario,
    filas: [
      { industria: 'Gobierno y Sector Público', celdas: ['prep', 'pico', 'ok', 'vacio', 'vacio', 'vacio'] },
      { industria: 'Consultoría y Servicios Prof.', celdas: ['vacio', 'prep', 'pico', 'ok', 'vacio', 'vacio'] },
      { industria: 'Farmacéutica y Biotech', celdas: ['vacio', 'vacio', 'prep', 'pico', 'vacio', 'vacio'] },
      { industria: 'Telecomunicaciones', celdas: ['vacio', 'vacio', 'vacio', 'prep', 'pico', 'vacio'] },
      { industria: 'Educación Superior', celdas: ['vacio', 'vacio', 'vacio', 'vacio', 'prep', 'pico'] },
    ],
  },
  MEXA: {
    meses: mesesCalendario,
    filas: [
      { industria: 'Moda y Diseño', celdas: ['prep', 'pico', 'ok', 'vacio', 'vacio', 'vacio'] },
      { industria: 'Cultura y Entretenimiento', celdas: ['vacio', 'prep', 'pico', 'ok', 'vacio', 'vacio'] },
      { industria: 'Alimentos Gourmet y Rest.', celdas: ['vacio', 'vacio', 'prep', 'pico', 'vacio', 'vacio'] },
      { industria: 'Turismo y Hospitalidad', celdas: ['vacio', 'vacio', 'vacio', 'prep', 'pico', 'vacio'] },
      { industria: 'Artesanía y Comercio Local', celdas: ['vacio', 'vacio', 'vacio', 'vacio', 'prep', 'pico'] },
    ],
  },
};

export const mockPicos: Record<string, PicoRow[]> = {
  UIX: [
    { industria: 'Tecnología de la Información', temperatura: 'caliente', mesPico: 'May 2026', accion: 'Contactar ahora a prospectos identificados', leadsEnBase: 48 },
    { industria: 'Servicios Financieros', temperatura: 'caliente', mesPico: 'Jun 2026', accion: 'Preparar propuesta y presentar', leadsEnBase: 34 },
    { industria: 'Manufactura Automotriz', temperatura: 'templado', mesPico: 'Jul 2026', accion: 'Calificar leads y agendar demos', leadsEnBase: 22 },
    { industria: 'Comercio al por Menor', temperatura: 'tibio', mesPico: 'Ago 2026', accion: 'Nutrir base con contenido', leadsEnBase: 15 },
    { industria: 'Construcción e Infraestructura', temperatura: 'frio', mesPico: 'Sep 2026', accion: 'Monitorear señales del sector', leadsEnBase: 8 },
  ],
  MU: [
    { industria: 'Publicidad y Medios', temperatura: 'caliente', mesPico: 'May 2026', accion: 'Contactar ahora a prospectos identificados', leadsEnBase: 56 },
    { industria: 'Retail y Consumo Masivo', temperatura: 'caliente', mesPico: 'Jun 2026', accion: 'Preparar propuesta y presentar', leadsEnBase: 41 },
    { industria: 'Telecomunicaciones', temperatura: 'templado', mesPico: 'Jul 2026', accion: 'Calificar leads y agendar demos', leadsEnBase: 28 },
    { industria: 'Alimentos y Bebidas', temperatura: 'tibio', mesPico: 'Ago 2026', accion: 'Nutrir base con contenido', leadsEnBase: 19 },
    { industria: 'Educación Superior', temperatura: 'frio', mesPico: 'Oct 2026', accion: 'Monitorear señales del sector', leadsEnBase: 11 },
  ],
  PE: [
    { industria: 'Retail y Puntos de Venta', temperatura: 'caliente', mesPico: 'Abr 2026', accion: 'Contactar ahora — pico este mes', leadsEnBase: 62 },
    { industria: 'Entretenimiento y Eventos', temperatura: 'caliente', mesPico: 'May 2026', accion: 'Contactar ahora a prospectos identificados', leadsEnBase: 44 },
    { industria: 'Turismo y Hospitalidad', temperatura: 'templado', mesPico: 'Jun 2026', accion: 'Calificar leads y agendar demos', leadsEnBase: 31 },
    { industria: 'Servicios de Salud', temperatura: 'tibio', mesPico: 'Jul 2026', accion: 'Nutrir base con contenido', leadsEnBase: 17 },
    { industria: 'Automotriz y Distribuidores', temperatura: 'frio', mesPico: 'Sep 2026', accion: 'Monitorear señales del sector', leadsEnBase: 9 },
  ],
  ZU: [
    { industria: 'Energía y Minería', temperatura: 'caliente', mesPico: 'May 2026', accion: 'Contactar ahora a prospectos identificados', leadsEnBase: 29 },
    { industria: 'Banca y Seguros', temperatura: 'caliente', mesPico: 'Jun 2026', accion: 'Preparar propuesta y presentar', leadsEnBase: 39 },
    { industria: 'Logística y Transporte', temperatura: 'templado', mesPico: 'Jul 2026', accion: 'Calificar leads y agendar demos', leadsEnBase: 24 },
    { industria: 'Manufactura Industrial', temperatura: 'tibio', mesPico: 'Ago 2026', accion: 'Nutrir base con contenido', leadsEnBase: 14 },
    { industria: 'Agroindustria', temperatura: 'frio', mesPico: 'Nov 2026', accion: 'Monitorear señales del sector', leadsEnBase: 7 },
  ],
  NC: [
    { industria: 'Fintech y Criptomonedas', temperatura: 'caliente', mesPico: 'May 2026', accion: 'Contactar ahora a prospectos identificados', leadsEnBase: 52 },
    { industria: 'Salud Digital y Healthtech', temperatura: 'caliente', mesPico: 'Jun 2026', accion: 'Preparar propuesta y presentar', leadsEnBase: 38 },
    { industria: 'E-commerce y Marketplaces', temperatura: 'templado', mesPico: 'Jul 2026', accion: 'Calificar leads y agendar demos', leadsEnBase: 26 },
    { industria: 'Educación Online', temperatura: 'tibio', mesPico: 'Ago 2026', accion: 'Nutrir base con contenido', leadsEnBase: 16 },
    { industria: 'IoT e Industria 4.0', temperatura: 'frio', mesPico: 'Oct 2026', accion: 'Monitorear señales del sector', leadsEnBase: 10 },
  ],
  HOF: [
    { industria: 'Entretenimiento y Streaming', temperatura: 'caliente', mesPico: 'Abr 2026', accion: 'Contactar ahora — pico este mes', leadsEnBase: 71 },
    { industria: 'Publicidad y Mkt Digital', temperatura: 'caliente', mesPico: 'May 2026', accion: 'Contactar ahora a prospectos identificados', leadsEnBase: 55 },
    { industria: 'Medios de Comunicación', temperatura: 'templado', mesPico: 'Jun 2026', accion: 'Calificar leads y agendar demos', leadsEnBase: 33 },
    { industria: 'Turismo y Hospitalidad', temperatura: 'tibio', mesPico: 'Jul 2026', accion: 'Nutrir base con contenido', leadsEnBase: 21 },
    { industria: 'Gobierno y Sector Público', temperatura: 'frio', mesPico: 'Sep 2026', accion: 'Monitorear señales del sector', leadsEnBase: 12 },
  ],
  RL: [
    { industria: 'Gobierno y Sector Público', temperatura: 'caliente', mesPico: 'May 2026', accion: 'Contactar ahora a prospectos identificados', leadsEnBase: 19 },
    { industria: 'Consultoría y Servicios Prof.', temperatura: 'caliente', mesPico: 'Jun 2026', accion: 'Preparar propuesta y presentar', leadsEnBase: 27 },
    { industria: 'Farmacéutica y Biotech', temperatura: 'templado', mesPico: 'Jul 2026', accion: 'Calificar leads y agendar demos', leadsEnBase: 15 },
    { industria: 'Telecomunicaciones', temperatura: 'tibio', mesPico: 'Ago 2026', accion: 'Nutrir base con contenido', leadsEnBase: 10 },
    { industria: 'Educación Superior', temperatura: 'frio', mesPico: 'Nov 2026', accion: 'Monitorear señales del sector', leadsEnBase: 5 },
  ],
  MEXA: [
    { industria: 'Moda y Diseño', temperatura: 'caliente', mesPico: 'May 2026', accion: 'Contactar ahora a prospectos identificados', leadsEnBase: 47 },
    { industria: 'Cultura y Entretenimiento', temperatura: 'caliente', mesPico: 'Jun 2026', accion: 'Preparar propuesta y presentar', leadsEnBase: 36 },
    { industria: 'Alimentos Gourmet y Rest.', temperatura: 'templado', mesPico: 'Jul 2026', accion: 'Calificar leads y agendar demos', leadsEnBase: 25 },
    { industria: 'Turismo y Hospitalidad', temperatura: 'tibio', mesPico: 'Ago 2026', accion: 'Nutrir base con contenido', leadsEnBase: 18 },
    { industria: 'Artesanía y Comercio Local', temperatura: 'frio', mesPico: 'Oct 2026', accion: 'Monitorear señales del sector', leadsEnBase: 9 },
  ],
};

export const mockRescue: Record<string, RescueRow[]> = {
  UIX: [
    { empresa: 'TechGlobal MX', industria: 'Tecnología de la Información', motivoPerdida: 'Precio', valor: 2800000, mesPico: 'May 2026', accion: 'llamar' },
    { empresa: 'Banorte Digital', industria: 'Servicios Financieros', motivoPerdida: 'Timing', valor: 1950000, mesPico: 'Jun 2026', accion: 'llamar' },
    { empresa: 'AutoMex Corp', industria: 'Manufactura Automotriz', motivoPerdida: 'Competencia', valor: 1200000, mesPico: 'Jul 2026', accion: 'prepararse' },
    { empresa: 'Coppel Retail', industria: 'Comercio al por Menor', motivoPerdida: 'Presupuesto', valor: 890000, mesPico: 'Ago 2026', accion: 'esperar' },
    { empresa: 'Grupo Constructor GC', industria: 'Construcción e Infraestructura', motivoPerdida: 'Sin decisor', valor: 560000, mesPico: 'Sep 2026', accion: 'esperar' },
  ],
  MU: [
    { empresa: 'Grupo Televisa Digital', industria: 'Publicidad y Medios', motivoPerdida: 'Precio', valor: 3200000, mesPico: 'May 2026', accion: 'llamar' },
    { empresa: 'Walmart México', industria: 'Retail y Consumo Masivo', motivoPerdida: 'Timing', valor: 2100000, mesPico: 'Jun 2026', accion: 'llamar' },
    { empresa: 'AT&T México', industria: 'Telecomunicaciones', motivoPerdida: 'Competencia', valor: 1500000, mesPico: 'Jul 2026', accion: 'prepararse' },
    { empresa: 'Gruma S.A.B.', industria: 'Alimentos y Bebidas', motivoPerdida: 'Presupuesto', valor: 780000, mesPico: 'Ago 2026', accion: 'esperar' },
    { empresa: 'UNAM Online', industria: 'Educación Superior', motivoPerdida: 'Sin decisor', valor: 340000, mesPico: 'Oct 2026', accion: 'esperar' },
  ],
  PE: [
    { empresa: 'Liverpool Promo', industria: 'Retail y Puntos de Venta', motivoPerdida: 'Timing', valor: 2400000, mesPico: 'Abr 2026', accion: 'llamar' },
    { empresa: 'Cinemex Eventos', industria: 'Entretenimiento y Eventos', motivoPerdida: 'Precio', valor: 1800000, mesPico: 'May 2026', accion: 'llamar' },
    { empresa: 'Grupo Presidente', industria: 'Turismo y Hospitalidad', motivoPerdida: 'Competencia', valor: 1100000, mesPico: 'Jun 2026', accion: 'prepararse' },
    { empresa: 'Salud Digna', industria: 'Servicios de Salud', motivoPerdida: 'Presupuesto', valor: 670000, mesPico: 'Jul 2026', accion: 'esperar' },
    { empresa: 'Nissan Distribuidores', industria: 'Automotriz y Distribuidores', motivoPerdida: 'Sin decisor', valor: 450000, mesPico: 'Sep 2026', accion: 'esperar' },
  ],
  ZU: [
    { empresa: 'CFE Comercialización', industria: 'Energía y Minería', motivoPerdida: 'Proceso', valor: 5600000, mesPico: 'May 2026', accion: 'llamar' },
    { empresa: 'BBVA México', industria: 'Banca y Seguros', motivoPerdida: 'Timing', valor: 4200000, mesPico: 'Jun 2026', accion: 'llamar' },
    { empresa: 'DHL México', industria: 'Logística y Transporte', motivoPerdida: 'Precio', valor: 1900000, mesPico: 'Jul 2026', accion: 'prepararse' },
    { empresa: 'Vitro Group', industria: 'Manufactura Industrial', motivoPerdida: 'Competencia', valor: 1100000, mesPico: 'Ago 2026', accion: 'esperar' },
    { empresa: 'Maseca Gruma', industria: 'Agroindustria', motivoPerdida: 'Presupuesto', valor: 380000, mesPico: 'Nov 2026', accion: 'esperar' },
  ],
  NC: [
    { empresa: 'Konfío Fintech', industria: 'Fintech y Criptomonedas', motivoPerdida: 'Precio', valor: 3800000, mesPico: 'May 2026', accion: 'llamar' },
    { empresa: 'Sanitas Digital', industria: 'Salud Digital y Healthtech', motivoPerdida: 'Timing', valor: 2600000, mesPico: 'Jun 2026', accion: 'llamar' },
    { empresa: 'MercadoLibre MX', industria: 'E-commerce y Marketplaces', motivoPerdida: 'Competencia', valor: 1700000, mesPico: 'Jul 2026', accion: 'prepararse' },
    { empresa: 'Platzi México', industria: 'Educación Online', motivoPerdida: 'Presupuesto', valor: 920000, mesPico: 'Ago 2026', accion: 'esperar' },
    { empresa: 'Siemens MX IoT', industria: 'IoT e Industria 4.0', motivoPerdida: 'Sin decisor', valor: 650000, mesPico: 'Oct 2026', accion: 'esperar' },
  ],
  HOF: [
    { empresa: 'Netflix Producciones MX', industria: 'Entretenimiento y Streaming', motivoPerdida: 'Timing', valor: 8500000, mesPico: 'Abr 2026', accion: 'llamar' },
    { empresa: 'Ogilvy México', industria: 'Publicidad y Mkt Digital', motivoPerdida: 'Precio', valor: 5200000, mesPico: 'May 2026', accion: 'llamar' },
    { empresa: 'El Universal Digital', industria: 'Medios de Comunicación', motivoPerdida: 'Competencia', valor: 2800000, mesPico: 'Jun 2026', accion: 'prepararse' },
    { empresa: 'Marriott Hotels MX', industria: 'Turismo y Hospitalidad', motivoPerdida: 'Presupuesto', valor: 1400000, mesPico: 'Jul 2026', accion: 'esperar' },
    { empresa: 'IMSS Comunicación', industria: 'Gobierno y Sector Público', motivoPerdida: 'Proceso', valor: 980000, mesPico: 'Sep 2026', accion: 'esperar' },
  ],
  RL: [
    { empresa: 'Deloitte México', industria: 'Consultoría y Servicios Prof.', motivoPerdida: 'Precio', valor: 4100000, mesPico: 'Jun 2026', accion: 'llamar' },
    { empresa: 'SHCP Investigación', industria: 'Gobierno y Sector Público', motivoPerdida: 'Proceso', valor: 3200000, mesPico: 'May 2026', accion: 'llamar' },
    { empresa: 'Pfizer México', industria: 'Farmacéutica y Biotech', motivoPerdida: 'Timing', valor: 2100000, mesPico: 'Jul 2026', accion: 'prepararse' },
    { empresa: 'Telmex Datos', industria: 'Telecomunicaciones', motivoPerdida: 'Competencia', valor: 890000, mesPico: 'Ago 2026', accion: 'esperar' },
    { empresa: 'TEC de Monterrey', industria: 'Educación Superior', motivoPerdida: 'Presupuesto', valor: 560000, mesPico: 'Nov 2026', accion: 'esperar' },
  ],
  MEXA: [
    { empresa: 'Grupo Denim Kaltex', industria: 'Moda y Diseño', motivoPerdida: 'Precio', valor: 1900000, mesPico: 'May 2026', accion: 'llamar' },
    { empresa: 'OCESA Entretenimiento', industria: 'Cultura y Entretenimiento', motivoPerdida: 'Timing', valor: 1500000, mesPico: 'Jun 2026', accion: 'llamar' },
    { empresa: 'Grupo Herdez', industria: 'Alimentos Gourmet y Rest.', motivoPerdida: 'Competencia', valor: 980000, mesPico: 'Jul 2026', accion: 'prepararse' },
    { empresa: 'Xcaret Parks', industria: 'Turismo y Hospitalidad', motivoPerdida: 'Presupuesto', valor: 720000, mesPico: 'Ago 2026', accion: 'esperar' },
    { empresa: 'Fonart Artesanías', industria: 'Artesanía y Comercio Local', motivoPerdida: 'Sin decisor', valor: 280000, mesPico: 'Oct 2026', accion: 'esperar' },
  ],
};
