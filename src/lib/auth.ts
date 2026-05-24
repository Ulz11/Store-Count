import { signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { requireAuth, requireDb, isFirebaseConfigured } from './firebase';
import { PRESENCE_HEARTBEAT_MS } from './constants';

export async function signInIfNeeded(): Promise<User | null> {
  if (!isFirebaseConfigured) return null;
  const auth = requireAuth();
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

export function observeAuth(callback: (user: User | null) => void): () => void {
  if (!isFirebaseConfigured) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(requireAuth(), callback);
}

/** Bind this device's anonymous UID to the chosen counter name. */
export async function claimCounter(uid: string, counterName: string): Promise<void> {
  const db = requireDb();
  await setDoc(
    doc(db, 'users', uid),
    { uid, counterName, claimedAt: serverTimestamp() },
    { merge: true }
  );
}

/** Start a heartbeat that updates `presence/{counterName}` every 30s. */
export function startPresenceHeartbeat(uid: string, counterName: string): () => void {
  const db = requireDb();
  const ref = doc(db, 'presence', counterName);

  const beat = () => {
    setDoc(ref, { name: counterName, uid, lastSeen: serverTimestamp() }, { merge: true }).catch(
      () => undefined
    );
  };

  beat();
  const id = setInterval(beat, PRESENCE_HEARTBEAT_MS);
  return () => clearInterval(id);
}
