import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingActions() {
  const [showLabel, setShowLabel] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowLabel(false), 5000);
    const onScroll = () => {
      if (window.scrollY > 80) setShowLabel(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      {/* WhatsApp floating bubble */}
      <div className="fixed bottom-24 right-5 z-50 flex items-center gap-2 md:bottom-6">
        <a
          href="https://wa.me/573013060013?text=Hola%2C%20quiero%20reservar%20en%20Chalet%20Suculento"
          target="_blank"
          rel="noopener"
          aria-label="¿Tienes dudas? Escríbenos por WhatsApp"
          onMouseEnter={() => setShowLabel(true)}
          className={cn(
            "hidden sm:inline-flex items-center rounded-full bg-white/95 px-4 py-2 text-xs font-medium text-forest-deep shadow-lg border border-gold/30 backdrop-blur transition-all duration-500",
            showLabel
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-3 pointer-events-none",
          )}
        >
          ¿Tienes dudas? Escríbenos
        </a>
        <a
          href="https://wa.me/573013060013?text=Hola%2C%20quiero%20reservar%20en%20Chalet%20Suculento"
          target="_blank"
          rel="noopener"
          aria-label="Chatear por WhatsApp"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110 md:h-16 md:w-16"
        >
          <MessageCircle className="h-7 w-7" strokeWidth={1.6} />
        </a>
      </div>

      {/* Mobile sticky reserve bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gold/30 bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <a
          href="#reservas"
          className="flex w-full items-center justify-center rounded-full bg-forest-deep py-3.5 text-sm font-medium tracking-[0.2em] uppercase text-cream"
        >
          Reservar ahora
        </a>
      </div>
    </>
  );
}
