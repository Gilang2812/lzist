/**
 * Generate a unique ID using crypto.randomUUID with a short prefix.
 */
export function generateId(prefix = ''): string {
  const id = crypto.randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}
