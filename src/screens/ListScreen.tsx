import { useMemo, useState } from 'react';
import { StatusBar } from '@/components/shell/StatusBar';
import { useSessionStore } from '@/stores/sessionStore';
import { usePaginatedItems } from '@/hooks/usePaginatedItems';
import { useCounterStore } from '@/stores/counterStore';
import {
  COUNTER_COLORS,
  CURRENCY,
  type CounterName,
} from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  adjustQuantity,
  restoreItem,
  softDeleteItem,
  updateItemFields,
} from '@/services/items';
import { toast } from '@/stores/toastStore';
import type { Item } from '@/types/item';

export function ListScreen() {
  const sessionId = useSessionStore((s) => s.activeSessionId);
  const counter = useCounterStore((s) => s.activeCounter);
  const { items, loading, done, loadMore, refresh } = usePaginatedItems(sessionId);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Item | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.barcode.toLowerCase().includes(q) ||
        i.size.toLowerCase().includes(q) ||
        i.color.toLowerCase().includes(q) ||
        (i.description ?? '').toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <div className="flex flex-col h-full">
      <StatusBar />

      <div className="px-4 pt-2 pb-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search barcode, size, color…"
          className="w-full bg-ink-800 text-white px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-accent-orange"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {filtered.length === 0 && !loading && (
          <div className="text-center text-ink-300 py-12 text-sm">
            {items.length === 0 ? 'No items yet.' : 'No matches.'}
          </div>
        )}
        <ul className="space-y-2 pb-4">
          {filtered.map((it) => {
            const color = COUNTER_COLORS[it.lastCountedBy as CounterName] ?? '#888';
            return (
              <li key={it.id}>
                <button
                  onClick={() => setSelected(it)}
                  className="w-full bg-ink-800 rounded-2xl px-4 py-3 flex items-center gap-3 active:bg-ink-700 touch-manip text-left"
                >
                  {it.thumbUrl ? (
                    <img
                      src={it.thumbUrl}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover bg-ink-700"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-ink-700 flex items-center justify-center text-ink-300">
                      ?
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {it.color} · {it.size}
                      {it.discount > 0 && <span className="text-accent-orange ml-2">{it.discount}%</span>}
                    </p>
                    <p className="text-ink-300 text-xs font-mono truncate">{it.barcode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold tabular-nums">×{it.quantity}</p>
                    <p className="text-ink-300 text-[10px]">
                      {it.finalPrice.toLocaleString()} {CURRENCY}
                    </p>
                  </div>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                </button>
              </li>
            );
          })}
        </ul>

        {!done && (
          <div className="pb-4 text-center">
            <Button variant="secondary" size="md" onClick={loadMore} disabled={loading}>
              {loading ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        )}
        {done && items.length > 0 && (
          <p className="text-center text-ink-300 text-xs pb-4">— end of list —</p>
        )}
      </div>

      <ItemDetailModal
        item={selected}
        onClose={() => setSelected(null)}
        onDelete={async (id) => {
          if (!counter) return;
          await softDeleteItem(id, counter);
          await refresh();
          toast('Deleted', {
            variant: 'success',
            duration: 5000,
            action: {
              label: 'Undo',
              onClick: async () => {
                await restoreItem(id, counter);
                await refresh();
                toast('Restored');
              },
            },
          });
          setSelected(null);
        }}
        onUpdate={async (id, updates) => {
          if (!counter) return;
          await updateItemFields(id, updates, counter);
          await refresh();
          toast('Updated', { variant: 'success' });
          setSelected(null);
        }}
        onAdjustQty={async (id, qty) => {
          if (!counter) return;
          await adjustQuantity(id, qty, counter);
          await refresh();
          toast('Quantity adjusted', { variant: 'success' });
          setSelected(null);
        }}
      />
    </div>
  );
}

interface ItemDetailModalProps {
  item: Item | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Item>) => Promise<void>;
  onAdjustQty: (id: string, qty: number) => Promise<void>;
}

function ItemDetailModal({ item, onClose, onDelete, onUpdate, onAdjustQty }: ItemDetailModalProps) {
  const [qty, setQty] = useState(item?.quantity ?? 1);

  if (!item) return null;

  return (
    <Modal open={!!item} onClose={onClose} title="Item details" fullScreen>
      <div className="px-5 py-4 space-y-4">
        {item.photoUrl && (
          <img src={item.photoUrl} alt="" className="w-full max-h-64 object-contain rounded-2xl bg-ink-800" />
        )}
        <div className="bg-ink-800 rounded-2xl p-4 space-y-2 text-sm">
          <Row label="Barcode" value={item.barcode} mono />
          <Row label="Size" value={item.size} />
          <Row label="Color" value={item.color} />
          {item.pattern && <Row label="Pattern" value={item.pattern} />}
          {item.description && <Row label="Description" value={item.description} />}
          <Row label="Original" value={`${item.originalPrice.toLocaleString()} ${CURRENCY}`} />
          <Row label="Discount" value={`${item.discount}%`} />
          <Row label="Final" value={`${item.finalPrice.toLocaleString()} ${CURRENCY}`} />
          <Row label="Created by" value={item.createdBy} />
          <Row label="Last counted" value={item.lastCountedBy} />
          <Row label="Type" value={item.isUnique ? 'Unique' : 'Grouped'} />
        </div>

        <div>
          <label className="block text-ink-300 text-xs uppercase tracking-wider mb-2">
            Quantity
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value || '1', 10)))}
              className="flex-1 bg-ink-800 text-white text-2xl font-mono px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-accent-orange text-center"
            />
            <Button
              variant="success"
              size="lg"
              onClick={() => onAdjustQty(item.id, qty)}
              disabled={qty === item.quantity}
            >
              Set
            </Button>
          </div>
        </div>

        <Button
          variant="danger"
          size="lg"
          className="w-full mt-4"
          onClick={() => {
            if (confirm('Delete this item? You can undo right after.')) {
              void onDelete(item.id);
            }
          }}
        >
          Delete
        </Button>
        {/* onUpdate available for future inline edits */}
        <button hidden onClick={() => onUpdate(item.id, {})} />
      </div>
    </Modal>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-ink-300">{label}</span>
      <span className={mono ? 'font-mono' : ''}>{value}</span>
    </div>
  );
}
