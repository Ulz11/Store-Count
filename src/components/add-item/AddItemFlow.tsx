import { useState } from 'react';
import { BarcodeScanner } from '@/components/scanner/BarcodeScanner';
import { ManualEntry } from '@/components/scanner/ManualEntry';
import { DuplicateModal } from '@/components/scanner/DuplicateModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SizePicker } from './SizePicker';
import { PricePad } from './PricePad';
import { DiscountToggle } from './DiscountToggle';
import { QuantityStepper } from './QuantityStepper';
import { PhotoCapture } from './PhotoCapture';
import { useCounterStore } from '@/stores/counterStore';
import { useSessionStore } from '@/stores/sessionStore';
import {
  addOrIncrementItem,
  findExistingGroupedItem,
  softDeleteItem,
} from '@/services/items';
import { uploadItemPhoto } from '@/services/photos';
import { toast } from '@/stores/toastStore';
import type { Item, ItemInput } from '@/types/item';
import type { Discount } from '@/lib/constants';
import { CURRENCY } from '@/lib/constants';

type Stage = 'scan' | 'manual' | 'duplicate' | 'form' | 'saving';

interface AddItemFlowProps {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  barcode: string;
  size: string;
  color: string;
  pattern: string;
  description: string;
  originalPrice: number;
  discount: Discount;
  quantity: number;
  isUnique: boolean;
  photoFile: File | null;
}

const emptyForm: FormState = {
  barcode: '',
  size: '',
  color: '',
  pattern: '',
  description: '',
  originalPrice: 0,
  discount: 0,
  quantity: 1,
  isUnique: false,
  photoFile: null,
};

export function AddItemFlow({ open, onClose }: AddItemFlowProps) {
  const counter = useCounterStore((s) => s.activeCounter);
  const sessionId = useSessionStore((s) => s.activeSessionId);

  const [stage, setStage] = useState<Stage>('scan');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [existing, setExisting] = useState<Item | null>(null);

  if (!open) return null;

  const reset = () => {
    setForm(emptyForm);
    setExisting(null);
    setStage('scan');
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleScanned = async (barcode: string) => {
    setForm((f) => ({ ...f, barcode }));
    // We don't check duplicates yet — size isn't known. Move to form.
    setStage('form');
  };

  const handleSizeBlur = async () => {
    if (!form.barcode || !form.size || form.isUnique) return;
    const found = await findExistingGroupedItem(form.barcode, form.size);
    if (found) {
      setExisting(found);
      setStage('duplicate');
    }
  };

  const handleSave = async () => {
    if (!counter) {
      toast('Pick a counter name first', { variant: 'error' });
      return;
    }
    if (!form.barcode || !form.size || form.originalPrice <= 0 || !form.color) {
      toast('Fill barcode, size, color, and price', { variant: 'error' });
      return;
    }
    setStage('saving');
    try {
      // Upload photo first (if any) — we need a temp ID for the path
      let photoUrl: string | null = null;
      let thumbUrl: string | null = null;
      if (form.photoFile) {
        const tempId = `tmp_${crypto.randomUUID()}`;
        const { photoUrl: pu, thumbUrl: tu } = await uploadItemPhoto(tempId, form.photoFile);
        photoUrl = pu;
        thumbUrl = tu;
      }

      const input: ItemInput = {
        barcode: form.barcode,
        size: form.size,
        color: form.color,
        pattern: form.pattern || null,
        description: form.description || null,
        originalPrice: form.originalPrice,
        discount: form.discount,
        photoUrl,
        thumbUrl,
        counterName: counter,
        isUnique: form.isUnique,
        sessionId,
        quantityToAdd: form.quantity,
      };

      const { id, wasNew } = await addOrIncrementItem(input);

      toast(wasNew ? `Saved · ${form.quantity}×` : `Incremented · +${form.quantity}`, {
        variant: 'success',
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              await softDeleteItem(id, counter);
              toast('Undone', { variant: 'info' });
            } catch {
              toast('Could not undo', { variant: 'error' });
            }
          },
        },
      });
      close();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      toast(msg, { variant: 'error' });
      setStage('form');
    }
  };

  return (
    <>
      {stage === 'scan' && (
        <BarcodeScanner
          onScan={handleScanned}
          onCancel={close}
          onManualEntry={() => setStage('manual')}
        />
      )}

      <ManualEntry
        open={stage === 'manual'}
        onSubmit={(b) => {
          setForm((f) => ({ ...f, barcode: b }));
          setStage('form');
        }}
        onCancel={() => setStage('scan')}
      />

      <DuplicateModal
        open={stage === 'duplicate'}
        existing={existing}
        onIncrement={() => {
          if (!existing) return;
          // Pre-fill from existing so user can confirm details
          setForm((f) => ({
            ...f,
            color: existing.color,
            pattern: existing.pattern ?? '',
            description: existing.description ?? '',
            originalPrice: existing.originalPrice,
            discount: existing.discount,
            isUnique: false,
          }));
          setStage('form');
        }}
        onNewEntry={() => {
          setForm((f) => ({ ...f, isUnique: true }));
          setStage('form');
        }}
        onCancel={() => setStage('form')}
      />

      <Modal
        open={stage === 'form' || stage === 'saving'}
        onClose={close}
        title="Add Item"
        fullScreen
      >
        <div className="px-5 py-4 space-y-5 pb-32">
          <Field label="Barcode">
            <div className="flex items-center justify-between bg-ink-800 px-4 py-3 rounded-2xl">
              <span className="font-mono text-lg">{form.barcode || '—'}</span>
              <button
                type="button"
                onClick={() => setStage('scan')}
                className="text-accent-orange text-sm touch-manip"
              >
                Re-scan
              </button>
            </div>
          </Field>

          <Field label="Size">
            <SizePicker
              value={form.size}
              onChange={(v) => setForm((f) => ({ ...f, size: v }))}
            />
            <button
              type="button"
              onClick={handleSizeBlur}
              className="text-ink-300 text-xs touch-manip mt-2 underline"
            >
              Check for duplicate
            </button>
          </Field>

          <Field label="Color">
            <input
              type="text"
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              placeholder="e.g. Navy blue"
              className="w-full bg-ink-800 text-white text-lg px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-accent-orange"
            />
          </Field>

          <Field label="Pattern (optional)">
            <input
              type="text"
              value={form.pattern}
              onChange={(e) => setForm((f) => ({ ...f, pattern: e.target.value }))}
              placeholder="e.g. Striped, floral"
              className="w-full bg-ink-800 text-white text-lg px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-accent-orange"
            />
          </Field>

          <Field label="Description (optional)">
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="e.g. Wool blazer"
              className="w-full bg-ink-800 text-white text-lg px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-accent-orange"
            />
          </Field>

          <Field label={`Price (${CURRENCY})`}>
            <input
              type="number"
              inputMode="numeric"
              value={form.originalPrice || ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  originalPrice: Math.max(0, parseInt(e.target.value || '0', 10)),
                }))
              }
              placeholder="0"
              className="w-full bg-ink-800 text-white text-2xl font-mono px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-accent-orange text-right"
            />
          </Field>

          <Field label="Discount">
            <DiscountToggle
              value={form.discount}
              onChange={(d) => setForm((f) => ({ ...f, discount: d }))}
            />
            {form.discount > 0 && form.originalPrice > 0 && (
              <p className="text-ink-300 text-sm mt-2 text-right">
                Final: <span className="text-white font-semibold">
                  {Math.round(form.originalPrice * (1 - form.discount / 100)).toLocaleString()}
                </span> {CURRENCY}
              </p>
            )}
          </Field>

          <Field label="Quantity">
            <QuantityStepper
              value={form.quantity}
              onChange={(q) => setForm((f) => ({ ...f, quantity: q }))}
            />
          </Field>

          <Field label="Photo">
            <PhotoCapture
              file={form.photoFile}
              onChange={(f) => setForm((s) => ({ ...s, photoFile: f }))}
            />
          </Field>

          <label className="flex items-center gap-3 bg-ink-800 px-4 py-3 rounded-2xl">
            <input
              type="checkbox"
              checked={form.isUnique}
              onChange={(e) => setForm((f) => ({ ...f, isUnique: e.target.checked }))}
              className="w-5 h-5 accent-accent-orange"
            />
            <span className="text-sm">Save as unique entry (don't merge with same barcode)</span>
          </label>
        </div>

        <div className="absolute left-0 right-0 bottom-0 pb-safe bg-ink-900/95 backdrop-blur border-t border-ink-800">
          <div className="px-4 py-3">
            <Button
              variant="primary"
              size="xl"
              className="w-full"
              onClick={handleSave}
              disabled={stage === 'saving'}
            >
              {stage === 'saving' ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-ink-300 text-xs uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  );
}
