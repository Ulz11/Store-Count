import { DISCOUNTS, type Discount } from '@/lib/constants';

interface DiscountToggleProps {
  value: Discount;
  onChange: (v: Discount) => void;
}

export function DiscountToggle({ value, onChange }: DiscountToggleProps) {
  return (
    <div className="grid grid-cols-3 gap-2 p-1 bg-ink-800 rounded-2xl">
      {DISCOUNTS.map((d) => {
        const selected = value === d;
        return (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            className={`h-12 rounded-xl text-base font-semibold transition-colors touch-manip ${
              selected
                ? d === 0
                  ? 'bg-ink-600 text-white'
                  : 'bg-accent-orange text-black'
                : 'text-ink-200 active:bg-ink-700'
            }`}
          >
            {d === 0 ? 'No discount' : `${d}% off`}
          </button>
        );
      })}
    </div>
  );
}
