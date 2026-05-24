import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/Button';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onCancel: () => void;
  onManualEntry: () => void;
}

const SCANNER_ID = 'barcode-scanner-region';

// 1D barcodes on clothing tags are usually EAN-13 or Code-128.
// QR is included as a bonus. Telling the decoder which formats to look for
// dramatically speeds up scanning vs the default "try everything" mode.
const FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.QR_CODE,
];

export function BarcodeScanner({ onScan, onCancel, onManualEntry }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let active = true;
    let scanner: Html5Qrcode | null = null;

    const start = async () => {
      try {
        scanner = new Html5Qrcode(SCANNER_ID, {
          verbose: false,
          formatsToSupport: FORMATS,
          useBarCodeDetectorIfSupported: true,
        });
        scannerRef.current = scanner;

        const config = {
          fps: 15,
          // Wide rectangle suited for 1D barcodes (EAN/UPC are ~3:1)
          qrbox: (vw: number, vh: number) => {
            const w = Math.round(Math.min(vw, vh) * 0.9);
            const h = Math.round(w * 0.5);
            return { width: w, height: h };
          },
          aspectRatio: window.innerHeight / window.innerWidth,
          videoConstraints: {
            facingMode: { ideal: 'environment' },
            // Higher resolution → small/dense tag barcodes decode reliably.
            // iOS Safari clamps this if camera can't deliver, so it's safe.
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            // Hint for autofocus on supported devices
            focusMode: 'continuous',
          } as MediaTrackConstraints,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        };

        // Prefer the exact back camera first; fall back to any environment-facing.
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
          setError('Camera permission denied. Allow camera access in Safari settings.');
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
          <>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-[90%] aspect-[2.2/1]">
                <div className="absolute inset-0 border-2 border-white/70 rounded-2xl" />
                <div className="absolute left-2 right-2 h-px bg-accent-orange shadow-[0_0_8px_#ff9f0a] animate-scan-line" />
              </div>
            </div>
            <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
              <p className="text-white/80 text-xs">
                Hold ~15 cm away · fill the box · steady
              </p>
            </div>
          </>
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
