import { Instagram, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-forest-deep text-cream">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl">
            Suculento <span className="text-gold">·</span> Santa Elena
          </p>
          <p className="mt-4 max-w-sm font-serif-soft text-lg italic text-cream/75">
            Refugio privado entre el bosque de Santa Elena. Hecho para
            desconectarse y reconectar.
          </p>
        </div>

        <div>
          <p className="font-sans text-xs tracking-[0.3em] text-gold uppercase">
            Contacto
          </p>
          <ul className="mt-5 space-y-3 font-sans text-sm text-cream/85">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-gold" strokeWidth={1.5} />
              Corregimiento Cl. 51A, Santa Elena, Medellín
            </li>
            <li>
              <a
                href="tel:+573013060013"
                className="inline-flex items-center gap-3 transition hover:text-gold"
              >
                <Phone className="h-4 w-4 text-gold" strokeWidth={1.5} />
                +57 301 306 0013
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/chalets_suculento"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-3 transition hover:text-gold"
              >
                <Instagram className="h-4 w-4 text-gold" strokeWidth={1.5} />
                @chalets_suculento
              </a>
            </li>
          </ul>
        </div>

        <div className="md:text-right">
          <p className="font-sans text-xs tracking-[0.3em] text-gold uppercase">
            Síguenos
          </p>
          <a
            href="https://instagram.com/chalets_suculento"
            target="_blank"
            rel="noopener"
            className="mt-5 inline-flex items-center gap-3 font-display text-2xl text-cream transition hover:text-gold md:text-3xl"
          >
            <Instagram className="h-7 w-7" strokeWidth={1.3} />
            @chalets_suculento
          </a>
          <p className="mt-6 font-serif-soft text-sm italic text-cream/60">
            +180 experiencias memorables · 5.0 ★
          </p>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-cream/50 md:flex-row">
          <p>© {new Date().getFullYear()} Chalet Suculento Santa Elena.</p>
          <p className="font-serif-soft italic">
            Diseñado para parejas que necesitan parar el mundo.
          </p>
        </div>
      </div>
    </footer>
  );
}
