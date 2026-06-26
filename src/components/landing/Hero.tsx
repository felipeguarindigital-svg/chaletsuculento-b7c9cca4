import { Bath, Trees, Lock, Car, MapPin, Heart, Star, ChevronDown, ShieldCheck } from "lucide-react";
import heroImg from "@/assets/hero-portada.jpg.asset.json";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


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
    <section id="inicio" className="relative min-h-screen w-full overflow-hidden text-cream">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroImg.url}
          alt="Pareja brindando con copas de vino frente a un chalet iluminado por luces cálidas en Santa Elena"
          width={1920}
          height={1280}
          className="h-full w-full object-cover animate-ken-burns"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/85" />
      </div>


      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 pb-24 pt-32 md:pt-40 text-center [text-shadow:0_2px_12px_rgb(0_0_0_/_0.55)]">
        <p className="mb-6 font-serif-soft text-base italic tracking-widest text-gold drop-shadow-md">
          Chalet Suculento · Santa Elena, Medellín
        </p>

        <h1 className="font-display text-balance text-5xl font-medium leading-[1.05] md:text-7xl lg:text-[5.5rem] drop-shadow-lg">
          Escápense del ruido.
          <br />
          <span className="italic text-gold">Reconéctense</span> entre el bosque.
        </h1>

        <p className="mt-8 max-w-2xl font-serif-soft text-xl leading-relaxed text-cream md:text-2xl drop-shadow-md">
          Una experiencia privada en Santa Elena diseñada para descansar,
          celebrar y crear recuerdos inolvidables.
        </p>


        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="#reservas"
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
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-sans text-xs tracking-[0.2em] text-cream/80 uppercase">
            <span>5.0 · +180 experiencias memorables</span>
            <span className="hidden sm:inline text-cream/40">·</span>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1.5 cursor-help">
                    <ShieldCheck className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} />
                    RNT: 165821
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-center normal-case tracking-normal">
                  Registro Nacional de Turismo - Operador legalmente registrado ante el Ministerio de Comercio, Industria y Turismo de Colombia
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="hidden sm:inline text-cream/40">·</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gold" strokeWidth={1.5} />
              A menos de 45 minutos de Medellín
            </span>
          </div>
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
