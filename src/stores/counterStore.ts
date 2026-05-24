import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CounterName } from '@/lib/constants';

interface CounterState {
  activeCounter: CounterName | null;
  setCounter: (name: CounterName) => void;
  clearCounter: () => void;
}

export const useCounterStore = create<CounterState>()(
  persist(
    (set) => ({
      activeCounter: null,
      setCounter: (name) => set({ activeCounter: name }),
      clearCounter: () => set({ activeCounter: null }),
    }),
    { name: 'stock-count-counter' }
  )
);
