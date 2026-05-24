import { NumPad } from '@/components/ui/NumPad';
import { CURRENCY } from '@/lib/constants';

interface PricePadProps {
  value: number;
  onChange: (v: number) => void;
}

export function PricePad({ value, onChange }: PricePadProps) {
  const text = value === 0 ? '0' : value.toLocaleString();

  const handleDigit = (d: string) => {
    const next = value === 0 ? Number(d) : Number(`${value}${d}`);
    if (next > 99_999_999) return; // sanity cap
    onChange(next);
  };
  const handleBackspace = () => {
    onChange(Math.floor(value / 10));
  };
  const handleClear = () => onChange(0);

  return (
    <div className="flex flex-col">
      <div className="px-6 pt-4 pb-6 text-right">
        <p className="text-ink-300 text-xs uppercase tracking-wider">Original Price</p>
        <p className="text-5xl font-light tabular-nums mt-1">
          {text}
          <span className="text-2xl text-ink-300 ml-2">{CURRENCY}</span>
        </p>
      </div>
      <NumPad onDigit={handleDigit} onBackspace={handleBackspace} onClear={handleClear} />
    </div>
  );
}
