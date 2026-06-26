import cabinAsset from "@/assets/emotional-cabin.jpg.asset.json";
import { Reveal } from "./Reveal";

const cabinImg = cabinAsset.url;

export function EmotionalSplit() {
  return (
    <section className="bg-background pt-16 pb-10 md:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-2 md:gap-20">
        <Reveal className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-warm md:aspect-[3/4]">
          <img
            src={cabinImg}
            alt="Café humeante entre los árboles de Santa Elena"
            loading="lazy"
            width={1280}
            height={1280}
            className="h-full w-full object-cover transition-transform duration-[2200ms] hover:scale-105"
          />
        </Reveal>

        <Reveal delay={120} className="max-w-xl">
          <p className="font-serif-soft text-sm tracking-[0.3em] text-gold uppercase">
            Cerca · pero lejos del mundo
          </p>
          <h2 className="mt-6 font-display text-4xl leading-[1.1] text-forest-deep md:text-5xl lg:text-6xl text-balance">
            No necesitas viajar horas para sentir que <em className="text-wood">saliste del mundo</em>.
          </h2>
          <p className="mt-8 font-serif-soft text-xl leading-relaxed text-foreground/80 md:text-2xl">
            Imagina despertar con el sonido de los pájaros, respirar aire puro,
            entrar al jacuzzi mientras cae el frío de Santa Elena y olvidar por
            unas horas el celular, el estrés y las carreras.
          </p>
          <div className="mt-10 h-px w-24 bg-gold/60" />
          <p className="mt-6 font-sans text-sm tracking-widest text-foreground/60 uppercase">
            45 min desde Medellín
          </p>
        </Reveal>
      </div>
    </section>
  );
}
