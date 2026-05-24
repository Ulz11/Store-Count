import { create } from 'zustand';
import { DEFAULT_SESSION_ID } from '@/lib/constants';

type SyncStatus = 'idle' | 'connecting' | 'online' | 'offline' | 'error';

interface SessionState {
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  syncStatus: SyncStatus;
  setSyncStatus: (s: SyncStatus) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSessionId: DEFAULT_SESSION_ID,
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  syncStatus: 'idle',
  setSyncStatus: (s) => set({ syncStatus: s }),
}));
