import { useRef, useState } from 'react';

interface PhotoCaptureProps {
  file: File | null;
  onChange: (f: File | null) => void;
}

export function PhotoCapture({ file, onChange }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (f: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    if (f) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
    onChange(f);
  };

  if (file && preview) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-ink-800 aspect-video">
        <img src={preview} alt="" className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={() => {
            handleFile(null);
            if (inputRef.current) inputRef.current.value = '';
          }}
          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/70 text-white text-xl touch-manip flex items-center justify-center"
          aria-label="Remove photo"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full h-24 bg-ink-800 border-2 border-dashed border-ink-600 rounded-2xl flex flex-col items-center justify-center gap-1 active:bg-ink-700 touch-manip"
      >
        <span className="text-3xl">📷</span>
        <span className="text-ink-300 text-sm">Take photo (optional)</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </>
  );
}
