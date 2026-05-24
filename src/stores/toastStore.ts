import { create } from 'zustand';

export interface Toast {
  id: number;
  message: string;
  variant: 'info' | 'success' | 'error';
  action?: { label: string; onClick: () => void };
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  show: (toast: Omit<Toast, 'id'>) => number;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (t) => {
    const id = nextId++;
    const toast: Toast = { id, ...t };
    set({ toasts: [...get().toasts, toast] });
    setTimeout(() => get().dismiss(id), t.duration);
    return id;
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export function toast(message: string, opts?: Partial<Omit<Toast, 'id' | 'message'>>): number {
  return useToastStore.getState().show({
    message,
    variant: opts?.variant ?? 'info',
    action: opts?.action,
    duration: opts?.duration ?? 3000,
  });
}
