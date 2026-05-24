import { useState } from 'react';
import { StatusBar } from '@/components/shell/StatusBar';
import { useSessionStore } from '@/stores/sessionStore';
import { useSessionTotals } from '@/hooks/useSessionTotals';
import { useRecentItems } from '@/hooks/useRecentItems';
import { COUNTER_COLORS, type CounterName, CURRENCY } from '@/lib/constants';
import { AddItemFlow } from '@/components/add-item/AddItemFlow';

export function CounterScreen() {
  const sessionId = useSessionStore((s) => s.activeSessionId);
  const session = useSessionTotals(sessionId);
  const { items } = useRecentItems(sessionId, 12);
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <StatusBar />

      {/* Big total display — calculator vibes */}
      <div className="px-6 pt-6 pb-4">
        <p className="text-ink-300 text-xs uppercase tracking-wider">Total counted</p>
        <p className="text-6xl font-light tabular-nums mt-1">
          {(session?.totalQuantity ?? 0).toLocaleString()}
        </p>
        <p className="text-ink-300 text-sm mt-1">
          {(session?.itemCount ?? 0).toLocaleString()} unique items
        </p>
      </div>

      {/* Recent feed */}
      <div className="flex-1 overflow-y-auto px-4 pt-2">
        <h2 className="text-ink-300 text-xs uppercase tracking-wider px-2 mb-2">Recent</h2>
        {items.length === 0 ? (
          <div className="text-center text-ink-300 py-12">
            <p className="text-sm">No items yet.</p>
            <p className="text-xs mt-1">Tap + to start counting.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => {
              const color = COUNTER_COLORS[it.lastCountedBy as CounterName] ?? '#888';
              return (
                <li
                  key={it.id}
                  className="bg-ink-800 rounded-2xl px-4 py-3 flex items-center gap-3"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {it.color || it.description || 'Item'} · {it.size}
                    </p>
                    <p className="text-ink-300 text-xs font-mono truncate">
                      {it.barcode}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold tabular-nums">×{it.quantity}</p>
                    <p className="text-ink-300 text-[10px]">
                      {it.finalPrice.toLocaleString()} {CURRENCY}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Add button — Apple Calculator-style big circle */}
      <div className="px-4 pb-4 pt-2">
        <button
          onClick={() => setAdding(true)}
          className="w-full h-20 rounded-3xl bg-accent-orange text-black text-3xl font-light active:opacity-80 touch-manip flex items-center justify-center gap-3 shadow-lg"
        >
          <span className="text-4xl leading-none">+</span>
          <span className="text-lg font-semibold">Add Item</span>
        </button>
      </div>

      <AddItemFlow open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}
