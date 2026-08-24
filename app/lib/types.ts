export type UDNId = 'UIX' | 'MU' | 'PE' | 'ZU' | 'NC' | 'HOF' | 'RL' | 'MEXA';

export interface UDN {
  id: UDNId;
  sigla: string;
  nombre: string;
  color: string;
  secundario?: string;
  texto: string;
}

export interface KPI {
  label: string;
  valor: number | string;
  meta: number | string;
  pct?: number;
  badge?: string;
  badgeColor?: 'green' | 'red' | 'amber';
  tipo: 'progreso' | 'numero' | 'moneda' | 'timing';
  acento: string;
  timingData?: {
    pct_total: number;
    caliente: number;
    templado?: number;
    total: number;
    pct_caliente?: number;
    pct_templado?: number;
    badge?: string;
    color?: string;
  };
}

export interface Industria {
  nombre: string;
  temperatura: 'caliente' | 'templado' | 'tibio' | 'frio';
  mesPico: string;
  generadoPor?: string;
  fechaCreacion?: string;
  faseAlContactar?: string;
  accion: 'llamar' | 'prepararse' | 'esperar';
  leads: number;
  leadsMkt: number;
  leadsComercial: number;
  leadsPerdidos: number;
  ejemplos?: string[];
}

export interface TemperaturaData {
  caliente: number;
  templado: number;
  tibio: number;
  frio: number;
}

export interface DataTemporalidad {
  labels: string[];
  sectores: {
    nombre: string;
    historico: (number | null)[];
    forecast: (number | null)[];
    pctMaximo: (number | null)[];
  }[];
}

export interface CalendarioCell {
  industria: string;
  estado: 'pico' | 'prep' | 'ok' | 'vacio';
}

export interface SubramaRow {
  scian3: string;
  nombre: string;
  leads: number;
}

export interface PicoRow {
  industria: string;
  temperatura: 'caliente' | 'templado' | 'tibio' | 'frio';
  mesPico: string;
  accion: string;
  leadsEnBase: number;
  subramas?: SubramaRow[];
}

export interface RescueRow {
  empresa: string;
  industria: string;
  scian3?: string;
  subrama?: string;
  motivoPerdida: string;
  fechaPerdido?: string;
  valor: number;
  mesPico: string;
  generadoPor?: string;
  fechaCreacion?: string;
  faseAlContactar?: string;
  accion: 'llamar' | 'prepararse' | 'esperar';
}

export interface EmpresaPico {
  es_cuenta_objetivo?: boolean;
  tier?: string;
  icp_industria_match?: boolean;
  decisor?: string;
  empresa: string;
  sector: string;
  scian3: string;
  subrama?: string;
  tipoObjeto?: string;
  etapa?: string;
  generadoPor: string;
  fechaCreacion: string;
  motivoPerdida: string;
  idRegistro?: string;
  valor: string;
  fechaPerdido: string;
}

export interface BrujulaData {
  meta:           Record<string, string>;
  kpis:           Record<string, KPI[]>;
  kpis_historico: Record<string, Record<string, Record<string, number>>>;
  temperatura:    Record<string, TemperaturaData>;
  industrias:     Record<string, Industria[]>;
  temporalidad:   Record<string, DataTemporalidad>;
  calendario:     Record<string, CalendarioCell[][]>;
  picos:          Record<string, PicoRow[]>;
  rescue:         Record<string, RescueRow[]>;
  empresas_pico:  Record<string, EmpresaPico[]>;
}
