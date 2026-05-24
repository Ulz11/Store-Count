import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  fullScreen?: boolean;
}

export function Modal({ open, onClose, children, title, fullScreen = true }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`absolute bg-ink-900 text-white animate-slide-up ${
          fullScreen
            ? 'inset-0 flex flex-col'
            : 'left-2 right-2 bottom-2 rounded-3xl max-h-[90vh] overflow-hidden flex flex-col'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="pt-safe">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-700">
              <button
                onClick={onClose}
                className="text-accent-orange text-base touch-manip"
              >
                Cancel
              </button>
              <h2 className="text-base font-semibold">{title}</h2>
              <span className="w-14" />
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
