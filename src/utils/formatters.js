export function formatCurrencyCOP(value = 0) {
  const v = Number(value) || 0;
  return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}

export function formatCurrencyUSD(value = 0) {
  const v = Number(value) || 0;
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}
