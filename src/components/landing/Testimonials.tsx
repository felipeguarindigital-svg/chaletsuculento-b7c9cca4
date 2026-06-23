import { Star } from "lucide-react";
import { Reveal } from "./Reveal";

const reviews = [
  {
    quote:
      "Todo estaba impecable, privado y rodeado de naturaleza. La atención fue excelente en cada detalle.",
    name: "Sara Gómez",
    context: "Aniversario",
  },
  {
    quote:
      "Exactamente como se ve en las fotos. Una experiencia llena de paz, perfecta para desconectarse.",
    name: "Mileidys Bermúdez",
    context: "Escapada de fin de semana",
  },
  {
    quote:
      "Super hermoso, muy limpio y muy privado. Ideal para disfrutar de la naturaleza en pareja.",
    name: "Paula Moriones",
    context: "Cumpleaños",
  },
  {
    quote:
      "El jacuzzi fue espectacular. Salimos renovados, como si hubiéramos viajado lejísimos.",
    name: "Andrés & Camila",
    context: "Escapada romántica",
  },
];

export function Testimonials() {
  return (
    <section id="resenas" className="bg-cream py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <Reveal>
            <p className="font-serif-soft text-sm tracking-[0.3em] text-gold uppercase">
              Lo que dicen
            </p>
            <h2 className="mt-4 font-display text-4xl text-forest-deep md:text-5xl text-balance">
              184 parejas. <em>5 estrellas.</em>
            </h2>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {reviews.map((r, i) => (
            <Reveal
              key={r.name}
              delay={i * 90}
              className="group relative rounded-3xl border border-gold/30 bg-background p-8 shadow-soft transition hover:-translate-y-1 hover:shadow-warm md:p-10"
            >
              <div className="flex items-center gap-1 text-gold">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-gold" strokeWidth={0} />
                ))}
              </div>
              <blockquote className="mt-5 font-serif-soft text-2xl italic leading-snug text-forest-deep md:text-3xl text-balance">
                “{r.quote}”
              </blockquote>
              <footer className="mt-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-pine font-display text-lg text-cream">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <p className="font-sans text-sm font-medium text-foreground">{r.name}</p>
                  <p className="font-serif-soft text-sm italic text-foreground/60">
                    {r.context}
                  </p>
                </div>
              </footer>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
