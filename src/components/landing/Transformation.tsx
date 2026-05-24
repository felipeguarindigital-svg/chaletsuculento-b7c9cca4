import {
  Wind,
  Leaf,
  Bath,
  PowerOff,
  MessageCircle,
  Sparkles,
  Moon,
  Sunrise,
} from "lucide-react";
import { Reveal } from "./Reveal";

const steps = [
  { icon: Wind, label: "Llegan con el ruido de la ciudad" },
  { icon: Leaf, label: "Respiran aire de montaña" },
  { icon: Bath, label: "Entran al jacuzzi" },
  { icon: PowerOff, label: "Apagan el celular" },
  { icon: MessageCircle, label: "Conversan, sin prisa" },
  { icon: Sparkles, label: "Se desconectan del mundo" },
  { icon: Moon, label: "Duermen profundo" },
  { icon: Sunrise, label: "Regresan renovados" },
];

export function Transformation() {
  return (
    <section className="bg-forest-deep py-24 text-cream md:py-32">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <Reveal>
          <p className="font-serif-soft text-sm tracking-[0.3em] text-gold uppercase">
            La transformación
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl lg:text-6xl text-balance">
            No vienes a dormir.
            <br />
            <em className="text-gold">Vienes a sentir algo diferente.</em>
          </h2>
        </Reveal>
      </div>

      <ol className="mx-auto mt-20 grid max-w-5xl grid-cols-1 gap-x-10 gap-y-12 px-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <Reveal as="li" key={s.label} delay={i * 90} className="group relative text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-cream/5 transition-colors duration-500 group-hover:bg-gold/15">
                <Icon className="h-7 w-7 text-gold" strokeWidth={1.3} />
              </div>
              <p className="font-sans text-xs tracking-[0.25em] text-cream/60 uppercase">
                Paso {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-3 font-serif-soft text-xl italic text-cream/95 text-balance">
                {s.label}
              </p>
            </Reveal>
          );
        })}
      </ol>
    </section>
  );
}
