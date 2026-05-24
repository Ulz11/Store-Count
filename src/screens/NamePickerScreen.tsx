import { useState } from 'react';
import { COUNTER_NAMES, COUNTER_COLORS, type CounterName } from '@/lib/constants';
import { useCounterStore } from '@/stores/counterStore';
import { Button } from '@/components/ui/Button';
import { claimCounter, signInIfNeeded } from '@/lib/auth';
import { toast } from '@/stores/toastStore';
import { isFirebaseConfigured } from '@/lib/firebase';

export function NamePickerScreen() {
  const setCounter = useCounterStore((s) => s.setCounter);
  const [selected, setSelected] = useState<CounterName | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      if (isFirebaseConfigured) {
        const user = await signInIfNeeded();
        if (user) await claimCounter(user.uid, selected);
      }
      setCounter(selected);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign-in failed';
      toast(msg, { variant: 'error' });
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-6 pt-safe pb-safe">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <h1 className="text-4xl font-light text-center mb-2">Who's counting?</h1>
        <p className="text-ink-300 text-center mb-10">Pick your name to begin.</p>

        <div className="space-y-3">
          {COUNTER_NAMES.map((name) => {
            const isSel = selected === name;
            return (
              <button
                key={name}
                onClick={() => setSelected(name)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl touch-manip transition-all ${
                  isSel
                    ? 'bg-ink-700 ring-2 ring-accent-orange'
                    : 'bg-ink-800 active:bg-ink-700'
                }`}
              >
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center text-black font-semibold"
                  style={{ backgroundColor: COUNTER_COLORS[name] }}
                >
                  {name[0]}
                </span>
                <span className="text-lg font-medium">{name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pb-2 max-w-md mx-auto w-full">
        <Button
          variant="primary"
          size="xl"
          className="w-full"
          disabled={!selected || submitting}
          onClick={handleContinue}
        >
          {submitting ? 'Signing in…' : 'Continue'}
        </Button>
        {!isFirebaseConfigured && (
          <p className="text-accent-red text-xs text-center mt-3">
            Firebase not configured. Copy <code>.env.example</code> to <code>.env.local</code> and fill in your project keys.
          </p>
        )}
      </div>
    </div>
  );
}
