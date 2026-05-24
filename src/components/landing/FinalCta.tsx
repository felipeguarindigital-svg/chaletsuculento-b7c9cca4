import finalImg from "@/assets/final-night.jpg";
import { Reveal } from "./Reveal";

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden text-cream">
      <div className="absolute inset-0 -z-10">
        <img
          src={finalImg}
          alt="Pareja observando luces cálidas y bosque de noche"
          loading="lazy"
          width={1920}
          height={1280}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/85" />
      </div>

      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-32 text-center md:py-44">
        <Reveal>
          <p className="font-serif-soft text-sm tracking-[0.3em] text-gold uppercase">
            No esperes más
          </p>
          <h2 className="mt-6 font-display text-5xl leading-[1.05] md:text-7xl lg:text-[5rem] text-balance">
            Tu próxima escapada
            <br />
            <em className="text-gold">no necesita esperar.</em>
          </h2>
          <p className="mx-auto mt-8 max-w-2xl font-serif-soft text-xl leading-relaxed text-cream/90 md:text-2xl">
            Las mejores experiencias no se recuerdan por las cosas. Se recuerdan
            por cómo te hicieron sentir.
          </p>
        </Reveal>

        <Reveal delay={150} className="mt-12">
          <a
            href="https://wa.me/573013060013?text=Hola%2C%20quiero%20reservar%20mi%20experiencia%20en%20Chalet%20Suculento"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center justify-center rounded-full bg-gold px-12 py-5 text-sm font-semibold tracking-[0.2em] uppercase text-forest-deep shadow-warm transition hover:scale-[1.04] hover:bg-cream"
          >
            Reservar mi experiencia
          </a>
          <p className="mt-6 font-serif-soft text-base italic text-cream/75">
            Los fines de semana suelen agotarse rápidamente.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
