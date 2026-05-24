// Size normalization: "38x40" / "38 x 40" / "38X40" all collapse to the same slug
// so two counters typing slightly different forms still merge into the same group.
export function slugifySize(size: string): string {
  return size
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9x]/g, '_')
    .slice(0, 32) || 'unknown';
}

// Strip non-alphanumerics from barcode for safe use in doc IDs
export function slugifyBarcode(barcode: string): string {
  return barcode.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
}

export function groupedItemId(barcode: string, size: string): string {
  return `grouped_${slugifyBarcode(barcode)}_${slugifySize(size)}`;
}

export function uniqueItemId(): string {
  // crypto.randomUUID requires HTTPS / secure context — Vercel provides this
  return `unique_${crypto.randomUUID()}`;
}

export function isValidBarcode(barcode: string): boolean {
  const cleaned = barcode.trim();
  if (cleaned.length < 6 || cleaned.length > 32) return false;
  return /^[a-zA-Z0-9\-]+$/.test(cleaned);
}
