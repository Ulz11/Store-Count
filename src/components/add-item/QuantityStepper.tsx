import { useState } from 'react';
import { QUANTITY_SOFT_CAP } from '@/lib/constants';

interface QuantityStepperProps {
  value: number;
  onChange: (v: number) => void;
}

export function QuantityStepper({ value, onChange }: QuantityStepperProps) {
  const [capOverridden, setCapOverridden] = useState(false);
  const max = capOverridden ? 9999 : QUANTITY_SOFT_CAP;

  return (
    <div>
      <div className="flex items-center justify-between bg-ink-800 rounded-2xl p-2">
        <button
          type="button"
          className="w-14 h-14 rounded-xl bg-ink-700 active:bg-ink-600 text-3xl touch-manip flex items-center justify-center"
          onClick={() => onChange(Math.max(1, value - 1))}
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={max}
          value={value}
          onChange={(e) => {
            const n = Math.max(1, Math.min(max, parseInt(e.target.value || '1', 10)));
            onChange(n);
          }}
          className="flex-1 bg-transparent text-center text-4xl font-light tabular-nums outline-none mx-2"
        />
        <button
          type="button"
          className="w-14 h-14 rounded-xl bg-ink-700 active:bg-ink-600 text-3xl touch-manip flex items-center justify-center"
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </button>
      </div>
      {value >= QUANTITY_SOFT_CAP && !capOverridden && (
        <button
          type="button"
          onClick={() => setCapOverridden(true)}
          className="mt-2 text-accent-orange text-sm touch-manip"
        >
          Allow larger quantity →
        </button>
      )}
    </div>
  );
}
