import { useState } from 'react';
import { StatusBar } from '@/components/shell/StatusBar';
import { useSessionStore } from '@/stores/sessionStore';
import { useSessionTotals } from '@/hooks/useSessionTotals';
import { Button } from '@/components/ui/Button';
import { exportSessionToExcel } from '@/services/export';
import { toast } from '@/stores/toastStore';
import { CURRENCY } from '@/lib/constants';

export function ExportScreen() {
  const sessionId = useSessionStore((s) => s.activeSessionId);
  const session = useSessionTotals(sessionId);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    setProgress(0);
    try {
      const { fileName, rowCount } = await exportSessionToExcel(sessionId, (p) =>
        setProgress(p.loaded)
      );
      toast(`Exported ${rowCount} rows → ${fileName}`, { variant: 'success', duration: 6000 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Export failed';
      toast(msg, { variant: 'error' });
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <StatusBar />

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        <div>
          <h1 className="text-2xl font-light">Export</h1>
          <p className="text-ink-300 text-sm mt-1">
            Download all counted items as an Excel (.xlsx) file.
          </p>
        </div>

        <div className="bg-ink-800 rounded-2xl p-5">
          <p className="text-ink-300 text-xs uppercase tracking-wider">Session</p>
          <p className="text-xl mt-1">{session?.name ?? sessionId}</p>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-ink-700 rounded-xl p-3">
              <p className="text-ink-300 text-xs uppercase">Total qty</p>
              <p className="text-2xl font-light tabular-nums">
                {(session?.totalQuantity ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-ink-700 rounded-xl p-3">
              <p className="text-ink-300 text-xs uppercase">Unique items</p>
              <p className="text-2xl font-light tabular-nums">
                {(session?.itemCount ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-ink-800 rounded-2xl p-4 text-sm text-ink-200">
          <p className="font-semibold mb-1">Included columns</p>
          <p className="text-ink-300">
            Barcode · Size · Color · Pattern · Description · Original Price ({CURRENCY}) ·
            Discount % · Final Price ({CURRENCY}) · Quantity · Line Total · Type ·
            Created By · Last Counted By · Created At · Updated At · Photo URL
          </p>
        </div>

        <p className="text-ink-300 text-xs px-1">
          💡 For best results on a 20,000-row export, use a laptop browser. iPhone Safari
          can do it but may be slow.
        </p>
      </div>

      <div className="pb-safe bg-ink-900 border-t border-ink-800">
        <div className="px-4 py-4">
          {busy && progress !== null && (
            <p className="text-center text-ink-300 text-sm mb-3">
              Building workbook… {progress.toLocaleString()} rows
            </p>
          )}
          <Button
            variant="primary"
            size="xl"
            className="w-full"
            onClick={handleExport}
            disabled={busy || (session?.itemCount ?? 0) === 0}
          >
            {busy ? 'Exporting…' : 'Download Excel'}
          </Button>
        </div>
      </div>
    </div>
  );
}
