import { useToastStore } from '@/stores/toastStore';

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pt-safe pointer-events-none flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto mt-2 min-w-[280px] max-w-md w-full px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg animate-slide-up ${
            t.variant === 'success'
              ? 'bg-accent-green text-black'
              : t.variant === 'error'
                ? 'bg-accent-red text-white'
                : 'bg-ink-700 text-white'
          }`}
        >
          <span className="flex-1 text-sm">{t.message}</span>
          {t.action && (
            <button
              className="text-sm font-semibold underline touch-manip"
              onClick={() => {
                t.action!.onClick();
                dismiss(t.id);
              }}
            >
              {t.action.label}
            </button>
          )}
          <button
            className="text-base touch-manip opacity-70"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
