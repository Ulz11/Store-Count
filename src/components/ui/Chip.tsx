import type { ReactNode } from 'react';

interface ChipProps {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}

export function Chip({ selected, onClick, children, className = '' }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn touch-manip rounded-2xl px-4 h-12 min-w-[3.5rem] flex items-center justify-center text-base font-medium transition-colors ${
        selected
          ? 'bg-accent-orange text-black'
          : 'bg-ink-700 text-white active:bg-ink-600'
      } ${className}`}
    >
      {children}
    </button>
  );
}
