export function magicNumbers(buffer: Buffer): string | null {
  const hex = buffer.toString('hex', 0, 16).toUpperCase();
  if (hex.startsWith('25504446')) return 'application/pdf';
  if (hex.startsWith('504B0304')) return 'application/zip';
  if (hex.startsWith('0A0D0A0D')) return 'text/plain';
  return null;
}
