import { IOL_COUNTRIES, IOL_MARKETS } from '../values';
import {
  array,
  decimal,
  enumeration,
  int32,
  object,
  optional,
  stringValue,
  type Decoded,
} from './json';

const currency = enumeration([
  'peso_Argentino',
  'dolar_Estadounidense',
  'real',
  'peso_Mexicano',
  'peso_Chileno',
  'yen',
  'libra',
  'euro',
  'peso_Peruano',
  'peso_Colombiano',
  'peso_Uruguayo',
] as const);
const settlement = enumeration(['t0', 't1', 't2', 't3'] as const);
const securityType = enumeration([
  'oPCIONES',
  'cEDEARS',
  'titulosPublicos',
  'aCCIONES',
  'cUPONESPRIVADOS',
  'fONDOSDEINVERSION',
  'aDR',
  'iNDICES',
  'bOCON',
  'bONEX',
  'cERTIFICADOSPAR',
  'oBLIGACIONESNEGOCIABLES',
  'oBLIGACIONESPYME',
  'cUPONESOBL',
  'lETRASDEPRECADO',
  'lETES',
  'tITULOSDEUDA',
  'cUPONESEXTRANJEROS',
  'cUPONESTPI',
  'bONOS',
  'dIVISAS',
  'fONDOSCOTIZANTES',
  'cAUCIONESPESOS',
  'cAUCIONESDOLARES',
  'cERTIFICADOSCREDITOFISCAL',
  'cEDRO',
  'bODEN',
  'fONDOSRENTAFIJA',
  'fideicomiso',
  'rENTAFIJA',
  'cHEQUEPAGODIFERIDO',
  'componenteDEEtf',
  'componenteDEEtf_Viejo',
  'futuros',
  'soja',
  'maiz',
  'trigo',
  'oro',
  'petroleo',
  'fideicomisoFinanciero',
  'obligacionesNegociables',
  'letraNota',
  'fondoComundeInversion',
  'titulosPublicosSuscribibles',
  'accionesSuscribibles',
  'incrementoCapital',
  'letesSuscribibles',
  'letras',
  'fondosMutuosUSA',
] as const);
const identity = {
  simbolo: stringValue,
  mercado: enumeration(IOL_MARKETS),
  pais: enumeration(IOL_COUNTRIES),
  tipo: securityType,
  plazo: settlement,
  moneda: currency,
};
export const instrument = object({
  ...identity,
  descripcion: optional(stringValue),
});
const balance = object({
  liquidacion: enumeration([
    'inmediato',
    'hrs24',
    'hrs48',
    'hrs72',
    'otro',
    'masHrs72',
  ] as const),
  saldo: optional(decimal),
  comprometido: optional(decimal),
  disponible: optional(decimal),
  disponibleOperar: optional(decimal),
});
const account = object(
  {
    tipo: enumeration([
      'inversion_Argentina_Pesos',
      'inversion_Argentina_Dolares',
      'inversion_Estados_Unidos_Dolares',
      'administrada_Argentina_Pesos',
      'administrada_Argentina_Dolares',
      'administrada_Estados_Unidos_Dolares',
    ] as const),
    moneda: currency,
    estado: optional(
      enumeration(['operable', 'cerrada', 'bloqueada'] as const),
    ),
    disponible: optional(decimal),
    comprometido: optional(decimal),
    saldo: optional(decimal),
    titulosValorizados: optional(decimal),
    total: optional(decimal),
    margenDescubierto: optional(decimal),
    saldos: optional(array(balance)),
  },
  { numero: optional(stringValue) },
);
export const accountState = object({
  cuentas: array(account),
  totalEnPesos: optional(decimal),
  estadisticas: optional(
    array(
      object({
        descripcion: optional(stringValue),
        cantidad: optional(int32),
        volumen: optional(decimal),
      }),
    ),
  ),
});
const position = object({
  titulo: instrument,
  cantidad: optional(decimal),
  comprometido: optional(decimal),
  puntosVariacion: optional(decimal),
  variacionDiaria: optional(decimal),
  ultimoPrecio: optional(decimal),
  ppc: optional(decimal),
  gananciaPorcentaje: optional(decimal),
  gananciaDinero: optional(decimal),
  valorizado: optional(decimal),
  parking: optional(object({ disponibleInmediato: optional(int32) })),
});
export const portfolio = object({
  pais: enumeration(IOL_COUNTRIES),
  activos: array(position),
});
export const quoteDetail = object({
  ...identity,
  ultimoPrecio: optional(decimal),
  fechaHora: optional(stringValue),
  variacion: optional(decimal),
  apertura: optional(decimal),
  maximo: optional(decimal),
  minimo: optional(decimal),
  cierreAnterior: optional(decimal),
  montoOperado: optional(decimal),
  // Detail schema says int32; the excluded CotizacionModel says double. No coercion.
  volumenNominal: optional(int32),
  precioPromedio: optional(decimal),
  precioAjuste: optional(decimal),
  interesesAbiertos: optional(decimal),
  cantidadOperaciones: optional(int32),
  descripcionTitulo: optional(stringValue),
  tendencia: optional(enumeration(['sube', 'baja', 'mantiene'] as const)),
  laminaMinima: optional(int32),
  lote: optional(int32),
  cantidadMinima: optional(int32),
  puntosVariacion: optional(decimal),
  puntas: optional(
    array(
      object({
        cantidadCompra: optional(decimal),
        precioCompra: optional(decimal),
        precioVenta: optional(decimal),
        cantidadVenta: optional(decimal),
      }),
    ),
  ),
});

// Provider DTO views, not normalized portfolio domain objects. All numbers are strings.
export type IolAccountState = Decoded<typeof accountState>;
export type IolPortfolio = Decoded<typeof portfolio>;
export type IolInstrument = Decoded<typeof instrument>;
export type IolQuoteDetail = Decoded<typeof quoteDetail>;
