import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:   'bg-accent-orange text-black font-semibold',
  secondary: 'bg-ink-700 text-white',
  ghost:     'bg-transparent text-ink-200',
  danger:    'bg-accent-red text-white font-semibold',
  success:   'bg-accent-green text-black font-semibold',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-xl',
  md: 'h-12 px-5 text-base rounded-2xl',
  lg: 'h-14 px-6 text-lg rounded-2xl',
  xl: 'h-16 px-8 text-xl rounded-3xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`btn ${variants[variant]} ${sizes[size]} flex items-center justify-center disabled:opacity-40 disabled:active:scale-100 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
