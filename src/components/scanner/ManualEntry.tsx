import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { isValidBarcode } from '@/services/ids';

interface ManualEntryProps {
  open: boolean;
  onSubmit: (barcode: string) => void;
  onCancel: () => void;
}

export function ManualEntry({ open, onSubmit, onCancel }: ManualEntryProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const submit = () => {
    const cleaned = value.trim();
    if (!isValidBarcode(cleaned)) {
      setError('6–32 letters, digits, or hyphens');
      return;
    }
    onSubmit(cleaned);
    setValue('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
      <div className="bg-ink-900 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-5 pb-safe animate-slide-up">
        <h2 className="text-lg font-semibold mb-4">Enter barcode</h2>
        <input
          type="text"
          inputMode="numeric"
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="e.g. 8901234567890"
          className="w-full bg-ink-800 text-white text-2xl font-mono px-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-accent-orange"
        />
        {error && (
          <p className="text-accent-red text-sm mt-2">{error}</p>
        )}
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" size="lg" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" className="flex-1" onClick={submit}>
            Use code
          </Button>
        </div>
      </div>
    </div>
  );
}
