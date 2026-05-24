import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { requireDb, isFirebaseConfigured } from '@/lib/firebase';
import type { Item } from '@/types/item';

const PAGE_SIZE = 50;

export function usePaginatedItems(sessionId: string) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const loadMore = useCallback(async () => {
    if (!isFirebaseConfigured || loading || done) return;
    setLoading(true);
    try {
      const db = requireDb();
      const constraints: QueryConstraint[] = [
        where('sessionId', '==', sessionId),
        where('deleted', '==', false),
        orderBy('updatedAt', 'desc'),
        limit(PAGE_SIZE),
      ];
      if (cursor) constraints.push(startAfter(cursor));
      const snap = await getDocs(query(collection(db, 'items'), ...constraints));
      const newItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Item);
      setItems((prev) => [...prev, ...newItems]);
      setCursor(snap.docs[snap.docs.length - 1] ?? cursor);
      if (snap.size < PAGE_SIZE) setDone(true);
    } finally {
      setLoading(false);
    }
  }, [sessionId, cursor, loading, done]);

  const refresh = useCallback(async () => {
    setItems([]);
    setCursor(null);
    setDone(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [sessionId, refresh]);

  useEffect(() => {
    if (items.length === 0 && !done) {
      void loadMore();
    }
  }, [items.length, done, loadMore]);

  return { items, loading, done, loadMore, refresh };
}
