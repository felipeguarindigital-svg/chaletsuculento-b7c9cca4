import { Car, Route as RouteIcon, ShieldCheck } from "lucide-react";
import { Reveal } from "./Reveal";

const features = [
  { icon: Car, label: "Parqueadero privado" },
  { icon: RouteIcon, label: "Fácil acceso" },
  { icon: ShieldCheck, label: "Zona segura" },
];

export function LocationMap() {
  return (
    <section className="bg-background py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2 md:gap-16">
        <Reveal>
          <p className="font-serif-soft text-sm tracking-[0.3em] text-gold uppercase">
            Ubicación
          </p>
          <h2 className="mt-5 font-display text-4xl leading-[1.1] text-forest-deep md:text-5xl text-balance">
            Lo suficientemente <em>cerca</em> para llegar fácil.
            <br />
            Lo suficientemente <em>lejos</em> para desconectarte.
          </h2>
          <p className="mt-8 font-serif-soft text-xl text-foreground/80">
            Santa Elena, Medellín — a menos de 45 minutos del Valle de Aburrá.
          </p>
          <address className="mt-3 not-italic font-sans text-sm tracking-wide text-foreground/70">
            Corregimiento Cl. 51A, Santa Elena, Medellín, Antioquia
          </address>

          <ul className="mt-10 flex flex-wrap gap-3">
            {features.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-cream px-5 py-2.5 text-sm text-forest-deep"
              >
                <Icon className="h-4 w-4 text-gold" strokeWidth={1.6} />
                {label}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120} className="overflow-hidden rounded-3xl shadow-warm">
          <iframe
            title="Mapa Chalet Suculento Santa Elena"
            src="https://www.google.com/maps?q=Chalet+Suculento+Santa+Elena&z=14&output=embed"
            loading="lazy"
            className="h-[420px] w-full border-0 md:h-full md:min-h-[460px]"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Reveal>
      </div>
    </section>
  );
}
