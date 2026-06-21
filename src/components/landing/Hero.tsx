import { Bath, Trees, Lock, Car, MapPin, Heart, Star, ChevronDown } from "lucide-react";
import heroImg from "@/assets/hero-couple-night.png.asset.json";


const amenities = [
  { icon: Bath, label: "Jacuzzi privado" },
  { icon: Trees, label: "Naturaleza" },
  { icon: Lock, label: "Privacidad total" },
  { icon: Car, label: "Parqueadero" },
  { icon: MapPin, label: "Fácil acceso" },
  { icon: Heart, label: "Atención personalizada" },
];

export function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden text-cream">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Pareja abrazada en jacuzzi privado al atardecer rodeada por el bosque de Santa Elena"
          width={1920}
          height={1280}
          className="h-full w-full object-cover animate-ken-burns"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/80" />
      </div>

      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="font-display text-xl md:text-2xl tracking-wide text-cream">
          Suculento <span className="text-gold">·</span> Santa Elena
        </div>
        <a
          href="https://wa.me/573013060013"
          target="_blank"
          rel="noopener"
          className="hidden md:inline-flex items-center rounded-full border border-cream/40 px-5 py-2 text-sm tracking-wide text-cream backdrop-blur-sm transition hover:bg-cream hover:text-forest-deep"
        >
          Reservar
        </a>
      </header>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-100px)] max-w-5xl flex-col items-center justify-center px-6 pb-24 pt-8 text-center">
        <p className="mb-6 font-serif-soft text-base italic tracking-widest text-gold">
          Chalet Suculento · Santa Elena, Medellín
        </p>

        <h1 className="font-display text-balance text-5xl font-medium leading-[1.05] md:text-7xl lg:text-[5.5rem]">
          Escápense del ruido.
          <br />
          <span className="italic text-gold">Reconéctense</span> entre el bosque.
        </h1>

        <p className="mt-8 max-w-2xl font-serif-soft text-xl leading-relaxed text-cream/90 md:text-2xl">
          Una experiencia privada en Santa Elena diseñada para descansar,
          celebrar y crear recuerdos inolvidables.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="https://wa.me/573013060013?text=Hola%2C%20quiero%20reservar%20en%20Chalet%20Suculento"
            target="_blank"
            rel="noopener"
            className="group inline-flex items-center justify-center rounded-full bg-forest-deep px-9 py-4 text-sm font-medium tracking-widest text-cream uppercase shadow-warm transition hover:scale-[1.03] hover:bg-forest-pine"
          >
            Reservar ahora
          </a>
          <a
            href="#experiencia"
            className="inline-flex items-center justify-center rounded-full border border-cream/50 bg-cream/5 px-9 py-4 text-sm font-medium tracking-widest text-cream uppercase backdrop-blur-sm transition hover:bg-cream/15"
          >
            Ver experiencia
          </a>
        </div>

        <div className="mt-12 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1 text-gold">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-gold" strokeWidth={0} />
            ))}
          </div>
          <p className="font-sans text-xs tracking-[0.2em] text-cream/80 uppercase">
            5.0 · +180 experiencias memorables
          </p>
          <p className="mt-1 font-serif-soft text-base italic text-cream/70">
            A menos de 45 minutos de Medellín
          </p>
        </div>

        {/* Amenities */}
        <ul className="mt-14 grid w-full max-w-4xl grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-3 lg:grid-cols-6">
          {amenities.map(({ icon: Icon, label }) => (
            <li key={label} className="flex flex-col items-center gap-2 text-cream/85">
              <Icon className="h-5 w-5 text-gold" strokeWidth={1.5} />
              <span className="text-xs tracking-wide">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-cream/70 animate-float-soft">
        <ChevronDown className="h-6 w-6" strokeWidth={1.2} />
      </div>
    </section>
  );
}
