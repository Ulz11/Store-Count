import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/Button';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onCancel: () => void;
  onManualEntry: () => void;
}

const SCANNER_ID = 'barcode-scanner-region';

export function BarcodeScanner({ onScan, onCancel, onManualEntry }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let active = true;
    let scanner: Html5Qrcode | null = null;

    const start = async () => {
      try {
        scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: (vw: number, vh: number) => {
            const minEdge = Math.min(vw, vh);
            const w = Math.round(minEdge * 0.75);
            const h = Math.round(w * 0.6);
            return { width: w, height: h };
          },
          aspectRatio: window.innerHeight / window.innerWidth,
        };

        // Prefer back camera; fall back if 'exact' rejects
        try {
          await scanner.start(
            { facingMode: { exact: 'environment' } },
            config,
            handleSuccess,
            () => undefined
          );
        } catch {
          await scanner.start(
            { facingMode: 'environment' },
            config,
            handleSuccess,
            () => undefined
          );
        }
        if (active) setStarting(false);
      } catch (e) {
        if (!active) return;
        const msg = e instanceof Error ? e.message : String(e);
        if (/permission|notallow/i.test(msg)) {
          setError('Camera permission denied. Please allow camera access in browser settings.');
        } else if (/notfound|nodevice/i.test(msg)) {
          setError('No camera found on this device.');
        } else {
          setError('Could not start camera. Tap "Type code" to enter manually.');
        }
        setStarting(false);
      }
    };

    const handleSuccess = (decoded: string) => {
      if (!active) return;
      active = false;
      void stop().then(() => onScan(decoded.trim()));
    };

    const stop = async () => {
      const s = scannerRef.current;
      if (!s) return;
      try {
        if (s.isScanning) await s.stop();
        s.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    };

    void start();

    return () => {
      active = false;
      void stop();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="pt-safe">
        <div className="flex items-center justify-between px-4 py-3 text-white">
          <button
            onClick={onCancel}
            className="text-accent-orange text-base touch-manip"
          >
            Cancel
          </button>
          <span className="text-sm font-semibold">Scan Barcode</span>
          <span className="w-14" />
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div id={SCANNER_ID} className="absolute inset-0" />

        {/* Scanline overlay */}
        {!error && !starting && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-3/4 max-w-sm aspect-[5/3]">
              <div className="absolute inset-0 border-2 border-white/70 rounded-2xl" />
              <div className="absolute left-2 right-2 h-px bg-accent-orange shadow-[0_0_8px_#ff9f0a] animate-scan-line" />
            </div>
          </div>
        )}

        {starting && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
            Starting camera…
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center gap-4">
            <p className="text-white text-base max-w-xs">{error}</p>
            <Button variant="primary" size="md" onClick={onManualEntry}>
              Type code
            </Button>
          </div>
        )}
      </div>

      <div className="pb-safe bg-black">
        <div className="px-4 py-4 flex gap-3">
          <Button variant="secondary" size="lg" className="flex-1" onClick={onManualEntry}>
            Type code
          </Button>
        </div>
      </div>
    </div>
  );
}
