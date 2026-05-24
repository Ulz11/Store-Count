import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { requireDb, isFirebaseConfigured } from '@/lib/firebase';
import type { Session } from '@/types/session';

export function useSessionTotals(sessionId: string) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const db = requireDb();
    const unsub = onSnapshot(doc(db, 'sessions', sessionId), (snap) => {
      if (snap.exists()) {
        setSession({ id: snap.id, ...snap.data() } as Session);
      } else {
        setSession(null);
      }
    });
    return unsub;
  }, [sessionId]);

  return session;
}
