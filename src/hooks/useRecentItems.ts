import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { requireDb, isFirebaseConfigured } from '@/lib/firebase';
import type { Item } from '@/types/item';

export function useRecentItems(sessionId: string, count = 20) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const db = requireDb();
    const q = query(
      collection(db, 'items'),
      where('sessionId', '==', sessionId),
      where('deleted', '==', false),
      orderBy('updatedAt', 'desc'),
      limit(count)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Item);
        setItems(docs);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [sessionId, count]);

  return { items, loading };
}
