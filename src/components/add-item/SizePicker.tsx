import { useState } from 'react';
import { LETTER_SIZES } from '@/lib/constants';
import { Chip } from '@/components/ui/Chip';

interface SizePickerProps {
  value: string;
  onChange: (v: string) => void;
}

export function SizePicker({ value, onChange }: SizePickerProps) {
  const isLetter = LETTER_SIZES.includes(value as (typeof LETTER_SIZES)[number]);
  const [showOther, setShowOther] = useState(value !== '' && !isLetter);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {LETTER_SIZES.map((s) => (
          <Chip
            key={s}
            selected={value === s}
            onClick={() => {
              setShowOther(false);
              onChange(s);
            }}
          >
            {s}
          </Chip>
        ))}
        <Chip
          selected={showOther || (value !== '' && !isLetter)}
          onClick={() => {
            setShowOther(true);
            if (isLetter) onChange('');
          }}
        >
          Other
        </Chip>
      </div>
      {(showOther || (value !== '' && !isLetter)) && (
        <input
          type="text"
          autoFocus
          inputMode="text"
          autoCapitalize="characters"
          placeholder="Type size (e.g. 38x40)"
          value={isLetter ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-ink-800 text-white text-lg px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-accent-orange"
        />
      )}
    </div>
  );
}
