import { Bath, Trees, Flame, Sun, Coffee, Wine, Moon, Sparkles, Mountain } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Reveal } from "./Reveal";
import { useEffect, useState } from "react";

type Chalet = {
  id: string;
  name: string;
  description: string;
  image: string;
  features: { icon: typeof Bath; label: string }[];
};

const chalets: Chalet[] = [
  {
    id: "Suculento",
    name: "Suculento",
    description:
      "El primer refugio. Madera, vapor y silencio: el lugar donde todo comenzó.",
    image:
      "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=1400&q=80&auto=format&fit=crop",
    features: [
      { icon: Bath, label: "Jacuzzi privado" },
      { icon: Trees, label: "Vista al bosque" },
      { icon: Coffee, label: "Desayuno incluido" },
    ],
  },
  {
    id: "Del Bosque",
    name: "Del Bosque",
    description:
      "Entre helechos y niebla, un escondite donde el tiempo se vuelve lento.",
    image:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1400&q=80&auto=format&fit=crop",
    features: [
      { icon: Flame, label: "Chimenea" },
      { icon: Trees, label: "Inmerso en naturaleza" },
      { icon: Bath, label: "Jacuzzi privado" },
    ],
  },
  {
    id: "Cattleya",
    name: "Cattleya",
    description:
      "Inspirado en la orquídea de Colombia: íntimo, florido, perfecto para celebrar el amor.",
    image:
      "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=1400&q=80&auto=format&fit=crop",
    features: [
      { icon: Bath, label: "Jacuzzi exterior" },
      { icon: Sparkles, label: "Decoración romántica" },
      { icon: Wine, label: "Botella de bienvenida" },
    ],
  },
  {
    id: "Ukiyo",
    name: "Ukiyo",
    description:
      "Una terraza suspendida sobre la montaña. Velas, viento tibio y cielo abierto.",
    image:
      "https://images.unsplash.com/photo-1455587734955-081b22074882?w=1400&q=80&auto=format&fit=crop",
    features: [
      { icon: Sun, label: "Terraza privada" },
      { icon: Mountain, label: "Vista panorámica" },
      { icon: Flame, label: "Fogata exterior" },
    ],
  },
  {
    id: "Satori",
    name: "Satori",
    description:
      "Despertar. Así se llama lo que ocurre dentro: madera cálida, luz dorada, calma total.",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1400&q=80&auto=format&fit=crop",
    features: [
      { icon: Moon, label: "Ambiente nocturno" },
      { icon: Bath, label: "Jacuzzi privado" },
      { icon: Coffee, label: "Desayuno gourmet" },
    ],
  },
];

function selectChalet(name: string) {
  window.dispatchEvent(new CustomEvent("suculento:select-chalet", { detail: name }));
  const el = document.getElementById("reservas");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function ChaletsCarousel() {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [selected, setSelected] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setSelected(api.selectedScrollSnap());
    const onSel = () => setSelected(api.selectedScrollSnap());
    api.on("select", onSel);
    api.on("reInit", onSel);
    return () => {
      api.off("select", onSel);
    };
  }, [api]);

  return (
    <section id="chalets" className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <p className="text-center font-sans text-xs tracking-[0.3em] text-gold uppercase">
            Nuestros chalets
          </p>
          <h2 className="mt-3 text-center font-display text-4xl font-medium text-foreground md:text-5xl lg:text-6xl">
            Cinco refugios.{" "}
            <span className="italic text-forest-deep">Una sola experiencia.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-center font-serif-soft text-lg italic text-muted-foreground md:text-xl">
            Cada chalet tiene su propia alma. El mismo silencio, la misma intimidad,
            cinco maneras distintas de sentirlo.
          </p>
        </Reveal>

        <div className="mt-14">
          <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: true }}
            className="relative"
          >
            <div className="mb-8 flex items-center justify-center gap-4">
              <CarouselPrevious className="relative left-0 top-0 h-10 w-10 translate-y-0 border-gold/40 bg-background text-foreground hover:bg-gold hover:text-foreground" />
              <div className="flex items-center gap-2">
                {Array.from({ length: count }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => api?.scrollTo(i)}
                    aria-label={`Ir al chalet ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      i === selected ? "w-8 bg-gold" : "w-2 bg-foreground/20"
                    }`}
                  />
                ))}
              </div>
              <CarouselNext className="relative right-0 top-0 h-10 w-10 translate-y-0 border-gold/40 bg-background text-foreground hover:bg-gold hover:text-foreground" />
            </div>

            <CarouselContent className="-ml-4">
              {chalets.map((c) => (
                <CarouselItem
                  key={c.id}
                  className="pl-4 basis-full md:basis-1/2 lg:basis-[55%]"
                >
                  <article className="group overflow-hidden rounded-3xl border border-border bg-card shadow-warm transition hover:-translate-y-1">
                    <div className="relative aspect-[4/3] overflow-hidden md:aspect-[5/4]">
                      <img
                        src={c.image}
                        alt={`Chalet ${c.name} — Santa Elena`}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-[1500ms] group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                    </div>
                    <div className="p-7 md:p-9">
                      <p className="font-sans text-[11px] tracking-[0.25em] text-gold uppercase">
                        Chalet
                      </p>
                      <h3 className="mt-1 font-display text-3xl font-medium text-foreground md:text-4xl">
                        {c.name}
                      </h3>
                      <p className="mt-3 font-serif-soft text-lg italic leading-relaxed text-muted-foreground">
                        {c.description}
                      </p>

                      <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                        {c.features.map(({ icon: Icon, label }) => (
                          <li
                            key={label}
                            className="flex items-center gap-2 text-sm text-foreground/80"
                          >
                            <Icon className="h-4 w-4 text-gold" strokeWidth={1.6} />
                            <span>{label}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => selectChalet(c.id)}
                        className="mt-7 inline-flex items-center justify-center rounded-full bg-gold px-7 py-3 text-xs font-medium tracking-[0.2em] uppercase text-foreground transition hover:bg-wood hover:text-cream"
                      >
                        Ver disponibilidad
                      </button>
                    </div>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </section>
  );
}
