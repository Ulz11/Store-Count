import { useCounterStore } from '@/stores/counterStore';
import { useSessionStore } from '@/stores/sessionStore';
import { usePresence } from '@/hooks/usePresence';
import { COUNTER_COLORS, type CounterName } from '@/lib/constants';

export function StatusBar() {
  const activeCounter = useCounterStore((s) => s.activeCounter);
  const clearCounter = useCounterStore((s) => s.clearCounter);
  const syncStatus = useSessionStore((s) => s.syncStatus);
  const online = usePresence();

  const others = online.filter((p) => p.name !== activeCounter);
  const myColor = activeCounter ? COUNTER_COLORS[activeCounter as CounterName] : '#888';

  const syncDot =
    syncStatus === 'online' ? 'bg-accent-green' :
    syncStatus === 'connecting' ? 'bg-accent-orange animate-pulse-soft' :
    syncStatus === 'offline' ? 'bg-accent-red' :
    syncStatus === 'error' ? 'bg-accent-red' :
    'bg-ink-500';

  return (
    <div className="pt-safe">
      <div className="px-4 py-3 flex items-center justify-between text-sm">
        <button
          className="flex items-center gap-2 touch-manip active:opacity-70"
          onClick={() => {
            if (confirm('Switch counter? You will need to pick a name again.')) {
              clearCounter();
            }
          }}
        >
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: myColor }}
          />
          <span className="font-medium">{activeCounter ?? 'No counter'}</span>
        </button>

        <div className="flex items-center gap-3">
          {others.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1">
                {others.slice(0, 3).map((p) => (
                  <span
                    key={p.name}
                    className="w-3 h-3 rounded-full ring-2 ring-ink-950"
                    style={{ backgroundColor: COUNTER_COLORS[p.name as CounterName] ?? '#888' }}
                    title={p.name}
                  />
                ))}
              </div>
              <span className="text-ink-300 text-xs">+{others.length} online</span>
            </div>
          )}
          <span className={`w-2 h-2 rounded-full ${syncDot}`} title={`Sync: ${syncStatus}`} />
        </div>
      </div>
    </div>
  );
}
