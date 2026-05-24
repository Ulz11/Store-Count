import type { Timestamp } from 'firebase/firestore';
import type { Discount } from '@/lib/constants';

export interface Item {
  id: string;
  barcode: string;
  size: string;          // user-visible label (e.g., "M", "XXL", "38x40")
  sizeSlug: string;      // normalized for ID
  color: string;
  pattern: string | null;
  description: string | null;
  originalPrice: number; // integer MNT
  discount: Discount;
  finalPrice: number;    // snapshot
  quantity: number;
  photoUrl: string | null;
  thumbUrl: string | null;
  createdBy: string;
  lastCountedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isUnique: boolean;
  deleted: boolean;
  sessionId: string;
}

// Form input from AddItemFlow — no IDs or timestamps yet
export interface ItemInput {
  barcode: string;
  size: string;
  color: string;
  pattern?: string | null;
  description?: string | null;
  originalPrice: number;
  discount: Discount;
  photoUrl?: string | null;
  thumbUrl?: string | null;
  counterName: string;
  isUnique: boolean;
  sessionId: string;
  quantityToAdd?: number; // defaults to 1
}
