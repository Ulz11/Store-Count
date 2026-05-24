interface NumPadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear?: () => void;
  showDecimal?: boolean;
}

export function NumPad({ onDigit, onBackspace, onClear, showDecimal = false }: NumPadProps) {
  const keys: Array<{ label: string; onClick: () => void; variant?: 'dark' | 'accent' | 'gray' }> = [
    { label: '1', onClick: () => onDigit('1') },
    { label: '2', onClick: () => onDigit('2') },
    { label: '3', onClick: () => onDigit('3') },
    { label: '4', onClick: () => onDigit('4') },
    { label: '5', onClick: () => onDigit('5') },
    { label: '6', onClick: () => onDigit('6') },
    { label: '7', onClick: () => onDigit('7') },
    { label: '8', onClick: () => onDigit('8') },
    { label: '9', onClick: () => onDigit('9') },
    {
      label: showDecimal ? '.' : 'C',
      onClick: showDecimal ? () => onDigit('.') : () => onClear?.(),
      variant: 'gray',
    },
    { label: '0', onClick: () => onDigit('0') },
    { label: '⌫', onClick: onBackspace, variant: 'gray' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 px-4">
      {keys.map((k, i) => (
        <button
          key={i}
          type="button"
          onClick={k.onClick}
          className={`btn-calc h-16 active:opacity-60 ${
            k.variant === 'gray'
              ? 'bg-ink-600 text-white'
              : 'bg-ink-700 text-white'
          }`}
        >
          {k.label}
        </button>
      ))}
    </div>
  );
}
