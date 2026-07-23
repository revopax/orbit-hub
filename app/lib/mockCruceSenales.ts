export interface PuntoSerie {
  mes: string;
  igae: number;
  reactiva: number;
  contactos: number;
}

export const mockSerieTemporal: PuntoSerie[] = [
  { mes: 'Ene', igae: 100, reactiva: 98,  contactos: 100 },
  { mes: 'Feb', igae: 101, reactiva: 100, contactos: 99  },
  { mes: 'Mar', igae: 103, reactiva: 105, contactos: 101 },
  { mes: 'Abr', igae: 106, reactiva: 112, contactos: 104 },
  { mes: 'May', igae: 110, reactiva: 119, contactos: 108 },
  { mes: 'Jun', igae: 115, reactiva: 126, contactos: 113 },
  { mes: 'Jul', igae: 120, reactiva: 131, contactos: 119 },
  { mes: 'Ago', igae: 124, reactiva: 130, contactos: 124 },
  { mes: 'Sep', igae: 126, reactiva: 124, contactos: 128 },
  { mes: 'Oct', igae: 124, reactiva: 116, contactos: 127 },
  { mes: 'Nov', igae: 118, reactiva: 106, contactos: 120 },
  { mes: 'Dic', igae: 110, reactiva: 100, contactos: 112 },
];

export interface EmpresaConvergencia {
  empresa: string;
  industria: string;
  udn: string;
  respaldoHistorico: 'alto' | 'medio' | 'bajo';
  señalesHoy: number;
  scoreCompuesto: number;
  estado: 'convergencia_validada' | 'anticipacion_pura' | 'reactiva_sin_respaldo';
}

export const mockEmpresasConvergencia: EmpresaConvergencia[] = [
  { empresa: 'Qbitss', industria: 'Tecnología', udn: 'Neracode', respaldoHistorico: 'alto', señalesHoy: 3, scoreCompuesto: 92, estado: 'convergencia_validada' },
  { empresa: 'Grupo Flexi', industria: 'Manufactura', udn: 'Neracode', respaldoHistorico: 'bajo', señalesHoy: 1, scoreCompuesto: 61, estado: 'reactiva_sin_respaldo' },
  { empresa: 'MacStore', industria: 'Retail', udn: 'UIX', respaldoHistorico: 'medio', señalesHoy: 0, scoreCompuesto: 38, estado: 'anticipacion_pura' },
  { empresa: 'Centro Imagen Dx', industria: 'Salud', udn: 'Neracode', respaldoHistorico: 'alto', señalesHoy: 2, scoreCompuesto: 88, estado: 'convergencia_validada' },
];
