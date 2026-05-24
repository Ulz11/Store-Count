import type { Timestamp } from 'firebase/firestore';

export interface Session {
  id: string;
  name: string;
  createdAt: Timestamp;
  createdBy: string;
  closedAt: Timestamp | null;
  itemCount: number;
  totalQuantity: number;
}
