import { MessageCircle } from "lucide-react";

export function FloatingActions() {
  return (
    <>
      {/* WhatsApp floating bubble */}
      <a
        href="https://wa.me/573013060013?text=Hola%2C%20quiero%20reservar%20en%20Chalet%20Suculento"
        target="_blank"
        rel="noopener"
        aria-label="Chatear por WhatsApp"
        className="fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-warm transition hover:scale-110 md:bottom-6 md:h-16 md:w-16"
      >
        <MessageCircle className="h-7 w-7" strokeWidth={1.6} />
      </a>

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
