import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { requireDb } from '@/lib/firebase';
import type { Item } from '@/types/item';
import { CURRENCY } from '@/lib/constants';

const PAGE_SIZE = 200;

interface ExportProgress {
  loaded: number;
  total?: number;
}

/**
 * Stream items out of Firestore in pages, build a workbook row-by-row,
 * then download as .xlsx. Avoids loading 20k docs into one array.
 */
export async function exportSessionToExcel(
  sessionId: string,
  onProgress?: (p: ExportProgress) => void
): Promise<{ fileName: string; rowCount: number }> {
  const db = requireDb();
  const itemsRef = collection(db, 'items');

  const rows: Array<Record<string, string | number>> = [];
  let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
  let loaded = 0;

  while (true) {
    const constraints: QueryConstraint[] = [
      where('sessionId', '==', sessionId),
      where('deleted', '==', false),
      orderBy('createdAt', 'asc'),
      limit(PAGE_SIZE),
    ];
    if (lastDoc) constraints.push(startAfter(lastDoc));
    const q = query(itemsRef, ...constraints);
    const snap = await getDocs(q);

    if (snap.empty) break;

    for (const docSnap of snap.docs) {
      const item = { id: docSnap.id, ...docSnap.data() } as Item;
      rows.push(formatRow(item));
    }
    loaded += snap.size;
    onProgress?.({ loaded });

    lastDoc = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE_SIZE) break;

    // Yield to the UI between pages
    await new Promise((r) => setTimeout(r, 0));
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');

  // Set column widths
  worksheet['!cols'] = [
    { wch: 18 }, // Barcode
    { wch: 8 },  // Size
    { wch: 16 }, // Color
    { wch: 16 }, // Pattern
    { wch: 30 }, // Description
    { wch: 14 }, // Original Price
    { wch: 10 }, // Discount %
    { wch: 14 }, // Final Price
    { wch: 8 },  // Quantity
    { wch: 16 }, // Line Total
    { wch: 12 }, // Type
    { wch: 12 }, // Created By
    { wch: 12 }, // Last Counted By
    { wch: 20 }, // Created At
    { wch: 20 }, // Updated At
    { wch: 50 }, // Photo URL
  ];

  const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const fileName = `stock-count-${sessionId}-${ts}.xlsx`;
  XLSX.writeFile(workbook, fileName);

  return { fileName, rowCount: rows.length };
}

function formatRow(item: Item): Record<string, string | number> {
  const created = item.createdAt?.toDate?.()?.toISOString?.() ?? '';
  const updated = item.updatedAt?.toDate?.()?.toISOString?.() ?? '';
  return {
    'Barcode': item.barcode,
    'Size': item.size,
    'Color': item.color,
    'Pattern': item.pattern ?? '',
    'Description': item.description ?? '',
    [`Original Price (${CURRENCY})`]: item.originalPrice,
    'Discount %': item.discount,
    [`Final Price (${CURRENCY})`]: item.finalPrice,
    'Quantity': item.quantity,
    [`Line Total (${CURRENCY})`]: item.finalPrice * item.quantity,
    'Type': item.isUnique ? 'Unique' : 'Grouped',
    'Created By': item.createdBy,
    'Last Counted By': item.lastCountedBy,
    'Created At': created,
    'Updated At': updated,
    'Photo URL': item.photoUrl ?? '',
  };
}
