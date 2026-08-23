/**
 * Standard Currency Formatter
 * Safely converts any value (string, null, undefined, NaN) to formatted currency string (e.g. 1,250.00).
 * Never returns "NaN" or "Rs. NaN".
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') return '0.00';
  const num = parseFloat(amount);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Format date string safely
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};
