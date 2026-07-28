export const parseIndonesianNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  // Remove dots (used as thousand separators) and convert comma to dot (if any)
  const cleaned = String(val).replace(/\./g, '').replace(/,/g, '.');
  return parseFloat(cleaned) || 0;
};
