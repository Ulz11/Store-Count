import { useEffect } from 'react';
import { Route, Switch } from 'wouter';
import { useCounterStore } from '@/stores/counterStore';
import { useSessionStore } from '@/stores/sessionStore';
import { NamePickerScreen } from '@/screens/NamePickerScreen';
import { CounterScreen } from '@/screens/CounterScreen';
import { ListScreen } from '@/screens/ListScreen';
import { ExportScreen } from '@/screens/ExportScreen';
import { BottomNav } from '@/components/shell/BottomNav';
import { ToastContainer } from '@/components/ui/Toast';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  signInIfNeeded,
  observeAuth,
  startPresenceHeartbeat,
} from '@/lib/auth';
import { ensureSession } from '@/services/items';
import { DEFAULT_SESSION_ID, DEFAULT_SESSION_NAME } from '@/lib/constants';

export default function App() {
  const activeCounter = useCounterStore((s) => s.activeCounter);
  const sessionId = useSessionStore((s) => s.activeSessionId);
  const setSyncStatus = useSessionStore((s) => s.setSyncStatus);

  // Online/offline indicator
  useEffect(() => {
    const update = () => setSyncStatus(navigator.onLine ? 'online' : 'offline');
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, [setSyncStatus]);

  // Sign in + presence heartbeat
  useEffect(() => {
    if (!isFirebaseConfigured || !activeCounter) return;
    let stopHeartbeat: (() => void) | null = null;
    let cancelled = false;

    void (async () => {
      setSyncStatus('connecting');
      try {
        await signInIfNeeded();
        await ensureSession(sessionId, DEFAULT_SESSION_NAME, activeCounter);
        if (cancelled) return;
        setSyncStatus('online');
      } catch {
        setSyncStatus('error');
      }
    })();

    const unsubAuth = observeAuth((user) => {
      if (user && activeCounter) {
        stopHeartbeat?.();
        stopHeartbeat = startPresenceHeartbeat(user.uid, activeCounter);
      }
    });

    return () => {
      cancelled = true;
      unsubAuth();
      stopHeartbeat?.();
    };
  }, [activeCounter, sessionId, setSyncStatus]);

  if (!activeCounter) {
    return (
      <>
        <NamePickerScreen />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={CounterScreen} />
          <Route path="/list" component={ListScreen} />
          <Route path="/export" component={ExportScreen} />
          <Route>
            <CounterScreen />
          </Route>
        </Switch>
      </main>
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
