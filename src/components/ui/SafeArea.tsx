import type { ReactNode } from 'react';

interface SafeAreaProps {
  children: ReactNode;
  top?: boolean;
  bottom?: boolean;
  className?: string;
}

export function SafeArea({ children, top = true, bottom = true, className = '' }: SafeAreaProps) {
  return (
    <div
      className={`${top ? 'pt-safe' : ''} ${bottom ? 'pb-safe' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
