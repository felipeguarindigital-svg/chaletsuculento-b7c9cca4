import { useEffect, useCallback, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type LightboxImage = { src: string; alt: string };

type Props = {
  open: boolean;
  onClose: () => void;
  images: LightboxImage[];
  chaletName: string;
  initialIndex?: number;
};

export function ChaletLightbox({ open, onClose, images, chaletName, initialIndex = 0 }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [fade, setFade] = useState(true);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => {
      const total = images.length;
      const i = ((next % total) + total) % total;
      setFade(false);
      requestAnimationFrame(() => {
        setIndex(i);
        requestAnimationFrame(() => setFade(true));
      });
    },
    [images.length],
  );

  const prev = useCallback(() => go(index - 1), [go, index]);
  const next = useCallback(() => go(index + 1), [go, index]);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, prev, next]);

  if (!open) return null;

  const current = images[index];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Galería ${chaletName}`}
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3 text-cream md:px-6 md:py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-sans text-xs tracking-[0.25em] uppercase text-cream/80">
          {chaletName} · {index + 1} / {images.length}
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar galería"
          className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-cream transition hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main image area */}
      <div
        className="relative flex flex-1 items-center justify-center px-2 md:px-16"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
          touchStartX.current = null;
        }}
      >
        <button
          onClick={prev}
          aria-label="Foto anterior"
          className="absolute left-2 top-1/2 hidden -translate-y-1/2 grid place-items-center h-12 w-12 rounded-full bg-white/10 text-cream transition hover:bg-white/20 md:grid"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <img
          key={current.src}
          src={current.src}
          alt={current.alt}
          className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}
        />

        <button
          onClick={next}
          aria-label="Foto siguiente"
          className="absolute right-2 top-1/2 hidden -translate-y-1/2 grid place-items-center h-12 w-12 rounded-full bg-white/10 text-cream transition hover:bg-white/20 md:grid"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Thumbnails */}
      <div
        className="flex gap-2 overflow-x-auto px-4 py-3 md:justify-center md:px-6 md:py-4"
        onClick={(e) => e.stopPropagation()}
      >
        {images.map((img, i) => (
          <button
            key={img.src}
            onClick={() => go(i)}
            aria-label={`Ver foto ${i + 1}`}
            className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md transition md:h-16 md:w-24 ${
              i === index ? "ring-2 ring-gold opacity-100" : "opacity-60 hover:opacity-100"
            }`}
          >
            <img src={img.src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
