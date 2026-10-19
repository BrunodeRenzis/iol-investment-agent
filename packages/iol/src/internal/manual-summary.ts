import type {
  IolAccountState,
  IolInstrument,
  IolPortfolio,
  IolQuoteDetail,
} from './models';

type RecordView = Readonly<Record<string, unknown>>;

/** Only constant field names, boolean presence and type labels leave this module. */
function fields(
  records: readonly RecordView[],
  names: readonly string[],
): RecordView {
  return Object.fromEntries(
    names.map((name) => {
      let absent = false;
      let nulls = false;
      let present = false;
      const types = new Set<string>();
      for (const record of records) {
        const value = record[name];
        if (value === undefined) absent = true;
        else {
          present = true;
          if (value === null) nulls = true;
          else types.add(Array.isArray(value) ? 'array' : typeof value);
        }
      }
      return [
        name,
        {
          present,
          absent,
          null: nulls,
          types: [...types].sort(),
        },
      ];
    }),
  );
}
const identity = [
  'simbolo',
  'mercado',
  'pais',
  'tipo',
  'plazo',
  'moneda',
] as const;
const passed = {
  status: 'ok',
  schema: 'pass',
  casing: 'v2_validated',
  numericLexemes: 'lossless_validated',
} as const;

export function instrumentSummary(value: IolInstrument): string {
  return JSON.stringify({
    operation: 'instrument',
    ...passed,
    fields: fields([value], [...identity, 'descripcion']),
  });
}
export function quoteSummary(value: IolQuoteDetail): string {
  return JSON.stringify({
    operation: 'quoteDetail',
    ...passed,
    fields: fields(
      [value],
      [...identity, 'ultimoPrecio', 'fechaHora', 'volumenNominal', 'puntas'],
    ),
    depth: value.puntas?.length ? 'present' : 'none',
    depthFields: fields(value.puntas ?? [], [
      'precioCompra',
      'cantidadCompra',
      'precioVenta',
      'cantidadVenta',
    ]),
    volumenNominal: 'int32_contract_enforced',
  });
}
export function accountSummary(value: IolAccountState): string {
  return JSON.stringify({
    operation: 'accountState',
    ...passed,
    fields: fields([value], ['cuentas', 'totalEnPesos', 'estadisticas']),
    accounts: value.cuentas.length ? 'present' : 'none',
    accountFields: fields(value.cuentas, [
      'tipo',
      'moneda',
      'estado',
      'saldo',
      'disponible',
      'comprometido',
      'total',
      'saldos',
    ]),
    balanceFields: fields(
      value.cuentas.flatMap((account) => account.saldos ?? []),
      [
        'liquidacion',
        'saldo',
        'disponible',
        'comprometido',
        'disponibleOperar',
      ],
    ),
    accountIdentifiers: 'discarded',
  });
}
export function portfolioSummary(value: IolPortfolio): string {
  return JSON.stringify({
    operation: 'portfolio',
    ...passed,
    fields: fields([value], ['pais', 'activos']),
    holdings: value.activos.length ? 'present' : 'none',
    holdingFields: fields(value.activos, [
      'titulo',
      'cantidad',
      'comprometido',
      'ultimoPrecio',
      'ppc',
      'valorizado',
      'parking',
    ]),
    titleFields: fields(
      value.activos.map((holding) => holding.titulo),
      identity,
    ),
  });
}
