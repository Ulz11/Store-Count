import type { Timestamp } from 'firebase/firestore';

export interface Presence {
  name: string;
  lastSeen: Timestamp;
  uid: string;
}
