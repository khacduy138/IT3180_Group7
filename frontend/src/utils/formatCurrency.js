export default function formatCurrency(value, options = {}) {
  const { locale = 'vi-VN', currency = 'VND' } = options;

  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) return '';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(numberValue);
  } catch {
    return String(numberValue);
  }
}
