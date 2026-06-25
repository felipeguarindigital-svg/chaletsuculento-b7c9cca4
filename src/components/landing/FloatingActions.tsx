import { MessageCircle } from "lucide-react";

const WHATSAPP_URL =
  "https://wa.me/573013060013?text=Hola%2C%20quiero%20reservar%20en%20Chalet%20Suculento";

export function FloatingActions() {
  return (
    <>
      {/* WhatsApp floating bubble + icon */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-center gap-2 md:bottom-6 md:right-6">
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener"
          aria-label="¿Dudas? Escríbenos por WhatsApp"
          className="inline-flex items-center rounded-full border border-foreground/10 bg-cream/95 px-3 py-1.5 text-xs font-medium text-forest-deep shadow-sm backdrop-blur"
        >
          ¿Dudas?
        </a>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener"
          aria-label="Chatear por WhatsApp"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-110 md:h-14 md:w-14"
        >
          <MessageCircle className="h-6 w-6 md:h-7 md:w-7" strokeWidth={1.6} />
        </a>
      </div>

    </>
  );
}
