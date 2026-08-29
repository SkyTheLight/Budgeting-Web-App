// CSV helpers shared by the client export button and the server export route.
// Neutralize spreadsheet formula injection and quote fields correctly for Excel.

export function csvField(value: string): string {
  const field = value.trim();
  const dangerous = /^[=+\-@]/.test(field);
  const needsQuotes = /[",\n\r]/.test(field) || dangerous;
  const sanitized = dangerous ? `'${field}` : field;
  return needsQuotes ? `"${sanitized.replace(/"/g, '""')}"` : sanitized;
}