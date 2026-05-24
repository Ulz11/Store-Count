import { Button } from '@/components/ui/Button';
import type { Item } from '@/types/item';
import { CURRENCY } from '@/lib/constants';

interface DuplicateModalProps {
  open: boolean;
  existing: Item | null;
  onIncrement: () => void;
  onNewEntry: () => void;
  onCancel: () => void;
}

export function DuplicateModal({
  open,
  existing,
  onIncrement,
  onNewEntry,
  onCancel,
}: DuplicateModalProps) {
  if (!open || !existing) return null;

  const when = existing.updatedAt?.toDate?.()?.toLocaleString?.() ?? 'recently';

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
      <div className="bg-ink-900 w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-5 pb-safe animate-slide-up">
        <h2 className="text-lg font-semibold mb-1">Already counted</h2>
        <p className="text-ink-300 text-sm mb-4">
          Counted by <span className="text-white font-medium">{existing.lastCountedBy}</span> · {when}
        </p>

        <div className="bg-ink-800 rounded-2xl p-4 mb-5 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-ink-300">Barcode</span><span className="font-mono">{existing.barcode}</span></div>
          <div className="flex justify-between"><span className="text-ink-300">Size</span><span>{existing.size}</span></div>
          <div className="flex justify-between"><span className="text-ink-300">Color</span><span>{existing.color}</span></div>
          <div className="flex justify-between"><span className="text-ink-300">Quantity</span><span className="text-xl font-semibold">{existing.quantity}</span></div>
          <div className="flex justify-between"><span className="text-ink-300">Price</span><span>{existing.finalPrice.toLocaleString()} {CURRENCY}</span></div>
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="success" size="lg" onClick={onIncrement}>
            + Increment quantity
          </Button>
          <Button variant="secondary" size="lg" onClick={onNewEntry}>
            Save as new unique entry
          </Button>
          <Button variant="ghost" size="md" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
