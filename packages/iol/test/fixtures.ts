// Synthetic schema-based fixtures. No broker/account response was copied.
export const instrumentFixture =
  '{"simbolo":"AL30","mercado":"bCBA","pais":"argentina","tipo":"titulosPublicos","plazo":"t0","moneda":"dolar_Estadounidense"}';
export const accountFixture = `{
  "cuentas": [
    {"numero":"FAKE-ACCOUNT-A", "tipo":"inversion_Argentina_Dolares", "moneda":"dolar_Estadounidense", "saldo":0, "saldos":[
      {"liquidacion":"inmediato", "disponible":0.1}, {"liquidacion":"hrs24", "saldo":12345678901234567890.123456789}
    ]},
    {"numero":"FAKE-ACCOUNT-B", "tipo":"inversion_Estados_Unidos_Dolares", "moneda":"dolar_Estadounidense", "saldos":[{"liquidacion":"hrs48", "saldo":0}]}
  ], "totalEnPesos":0
}`;
export const portfolioFixture = `{"pais":"argentina","activos":[{"cantidad":0.125,"titulo":${instrumentFixture},"parking":{"disponibleInmediato":0}}]}`;
export const quoteFixture = `{
  "simbolo":"AL30","mercado":"bCBA","pais":"argentina","tipo":"titulosPublicos","plazo":"t0","moneda":"dolar_Estadounidense",
  "ultimoPrecio":0.1,"fechaHora":"2026-10-18T09:31:00","apertura":0,"maximo":0.2,"minimo":0.01,"cierreAnterior":0.09,"volumenNominal":2147483647,
  "puntas":[{"cantidadCompra":0.125,"precioCompra":0.09,"precioVenta":0.11,"cantidadVenta":1.5}]
}`;
