import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { requireDb, isFirebaseConfigured } from '@/lib/firebase';
import { PRESENCE_TIMEOUT_MS } from '@/lib/constants';
import type { Presence } from '@/types/presence';

export function usePresence() {
  const [online, setOnline] = useState<Presence[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const db = requireDb();
    const unsub = onSnapshot(collection(db, 'presence'), (snap) => {
      const now = Date.now();
      const docs = snap.docs
        .map((d) => d.data() as Presence)
        .filter((p) => {
          const ts = p.lastSeen?.toDate?.()?.getTime?.() ?? 0;
          return now - ts < PRESENCE_TIMEOUT_MS;
        });
      setOnline(docs);
    });
    return unsub;
  }, []);

  return online;
}
