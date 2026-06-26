import { Bath, Trees, Flame, Sun, Coffee, Wine, Moon, Sparkles, Mountain, Images, Wifi, Tv, Utensils, Bed, Dices, ShowerHead, Clock, Car, PawPrint, AlertTriangle, Hammer } from "lucide-react";
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
import chaletSuculentoAsset from "@/assets/chalet-suculento.jpg.asset.json";
import chaletDelBosqueAsset from "@/assets/chalet-del-bosque.jpg.asset.json";
import chaletCattleyaAsset from "@/assets/chalet-cattleya.jpg.asset.json";
import chaletUkiyoAsset from "@/assets/chalet-ukiyo.jpg.asset.json";
import chaletSatoriAsset from "@/assets/chalet-satori.jpg.asset.json";
import suculento6 from "@/assets/suculento-Foto-6.jpg.asset.json";
import suculento9 from "@/assets/suculento-Foto-9-2.jpg.asset.json";
import suculento10 from "@/assets/suculento-Foto-10.jpg.asset.json";
import suculento15 from "@/assets/suculento-Foto-15-2.jpg.asset.json";
import suculento23 from "@/assets/suculento-Foto-23.jpg.asset.json";
import suculento26 from "@/assets/suculento-Foto-26.jpg.asset.json";
import suculento29 from "@/assets/suculento-Foto-29.jpg.asset.json";
import suculento32 from "@/assets/suculento-Foto-32.jpg.asset.json";
import ukiyo2a from "@/assets/ukiyo-Foto-2-1.jpg.asset.json";
import ukiyo2b from "@/assets/ukiyo-Foto-2-3.jpg.asset.json";
import ukiyo3 from "@/assets/ukiyo-Foto-3-1.jpg.asset.json";
import ukiyo4 from "@/assets/ukiyo-Foto-4.jpg.asset.json";
import ukiyo5a from "@/assets/ukiyo-Foto-5-1.jpg.asset.json";
import ukiyo5b from "@/assets/ukiyo-Foto-5-2.jpg.asset.json";
import ukiyo6 from "@/assets/ukiyo-Foto-6-1.jpg.asset.json";
import satori2 from "@/assets/satori-Foto-2.jpg.asset.json";
import satori6 from "@/assets/satori-Foto-6.jpg.asset.json";
import satori8 from "@/assets/satori-Foto-8.jpg.asset.json";
import satori9 from "@/assets/satori-Foto-9.jpg.asset.json";
import satori16 from "@/assets/satori-Foto-16.jpg.asset.json";
import satori24 from "@/assets/satori-Foto-24.jpg.asset.json";
import satori33 from "@/assets/satori-Foto-33.jpg.asset.json";
import cattleya5 from "@/assets/cattleya-Foto-5.jpg.asset.json";
import cattleya7 from "@/assets/cattleya-Foto-7.jpg.asset.json";
import cattleya16 from "@/assets/cattleya-Foto-16.jpg.asset.json";
import cattleya18 from "@/assets/cattleya-Foto-18.jpg.asset.json";
import cattleya19 from "@/assets/cattleya-Foto-19.jpg.asset.json";
import cattleya20 from "@/assets/cattleya-Foto-20.jpg.asset.json";
import cattleya23 from "@/assets/cattleya-Foto-23.jpg.asset.json";
import cattleya27 from "@/assets/cattleya-Foto-27.jpg.asset.json";
import cattleya30 from "@/assets/cattleya-Foto-30.jpg.asset.json";
import bosque8 from "@/assets/bosque-Foto-8.jpg.asset.json";
import bosque9 from "@/assets/bosque-Foto-9.jpg.asset.json";
import bosque18 from "@/assets/bosque-Foto-18.jpg.asset.json";
import bosque23 from "@/assets/bosque-Foto-23.jpg.asset.json";
import bosque25 from "@/assets/bosque-Foto-25.jpg.asset.json";
import bosque30 from "@/assets/bosque-Foto-30.jpg.asset.json";
import bosque32 from "@/assets/bosque-Foto-32.jpg.asset.json";
import bosque34 from "@/assets/bosque-Foto-34.jpg.asset.json";
import { ChaletLightbox, type LightboxImage } from "./ChaletLightbox";

const chaletGalleries: Record<string, LightboxImage[]> = {
  Suculento: [
    { src: chaletSuculentoAsset.url, alt: "Chalet Suculento — vista exterior nocturna" },
    { src: suculento6.url, alt: "Suculento — terraza con asador y luces cálidas" },
    { src: suculento9.url, alt: "Suculento — fachada A-frame iluminada entre el bosque" },
    { src: suculento10.url, alt: "Suculento — zona de fogata con hamaca y columpio" },
    { src: suculento15.url, alt: "Suculento — terraza privada con jacuzzi" },
    { src: suculento23.url, alt: "Suculento — cocina equipada en madera" },
    { src: suculento26.url, alt: "Suculento — baño con lavamanos en piedra natural" },
    { src: suculento29.url, alt: "Suculento — habitación cálida con vista al bosque" },
    { src: suculento32.url, alt: "Suculento — sala interior con chimenea y altillo" },
  ],
  Ukiyo: [
    { src: chaletUkiyoAsset.url, alt: "Chalet Ukiyo — fachada iluminada con jacuzzi exterior" },
    { src: ukiyo2a.url, alt: "Ukiyo — interior cálido con cama, chimenea y sala" },
    { src: ukiyo2b.url, alt: "Ukiyo — vista exterior nocturna entre el bosque" },
    { src: ukiyo3.url, alt: "Ukiyo — cocina integrada con vista al bosque" },
    { src: ukiyo4.url, alt: "Ukiyo — jacuzzi privado en terraza iluminada" },
    { src: ukiyo5a.url, alt: "Ukiyo — interior panorámico de la cabaña" },
    { src: ukiyo5b.url, alt: "Ukiyo — detalle de terraza con jacuzzi y asador" },
    { src: ukiyo6.url, alt: "Ukiyo — exterior completo con terraza y jardín" },
  ],
  Satori: [
    { src: chaletSatoriAsset.url, alt: "Chalet Satori — fachada iluminada de noche" },
    { src: satori2.url, alt: "Satori — exterior A-frame con luces cálidas y fogata" },
    { src: satori6.url, alt: "Satori — sala interior con chimenea y sofá" },
    { src: satori8.url, alt: "Satori — terraza con asador y vista al bosque" },
    { src: satori9.url, alt: "Satori — habitación con macramé y cama acogedora" },
    { src: satori16.url, alt: "Satori — baño con ventana al bosque" },
    { src: satori24.url, alt: "Satori — jacuzzi privado en terraza con vista" },
    { src: satori33.url, alt: "Satori — cocina equipada en madera" },
  ],
  Cattleya: [
    { src: chaletCattleyaAsset.url, alt: "Chalet Cattleya — vista aérea entre el bosque" },
    { src: cattleya5.url, alt: "Cattleya — fachada A-frame iluminada entre la vegetación" },
    { src: cattleya7.url, alt: "Cattleya — jardín zen con buda, fogata y luces cálidas" },
    { src: cattleya16.url, alt: "Cattleya — jacuzzi privado interior con luces cálidas" },
    { src: cattleya18.url, alt: "Cattleya — cocina equipada con TV y atrapasueños" },
    { src: cattleya19.url, alt: "Cattleya — habitación acogedora con cama king" },
    { src: cattleya20.url, alt: "Cattleya — cocina completa en madera con TV" },
    { src: cattleya23.url, alt: "Cattleya — terraza con asador y vista a la montaña" },
    { src: cattleya27.url, alt: "Cattleya — baño con detalles en bambú y espejo redondo" },
    { src: cattleya30.url, alt: "Cattleya — vista interior A-frame hacia la hamaca y montaña" },
  ],
  "Del Bosque": [
    { src: bosque8.url, alt: "Del Bosque — fachada A-frame iluminada de noche con jacuzzi" },
    { src: bosque9.url, alt: "Del Bosque — zona de asador bajo pérgola con luces" },
    { src: bosque18.url, alt: "Del Bosque — escaleras, columpio y fogata entre el bosque" },
    { src: bosque23.url, alt: "Del Bosque — baño en madera con espejo redondo iluminado" },
    { src: bosque25.url, alt: "Del Bosque — sala interior con chimenea y vista a la terraza" },
    { src: bosque30.url, alt: "Del Bosque — habitación A-frame con cama y bar" },
    { src: bosque32.url, alt: "Del Bosque — cocina equipada con vista al bosque" },
    { src: bosque34.url, alt: "Del Bosque — interior A-frame con sofá y luz natural" },
  ],
};

type Chalet = {
  id: string;
  name: string;
  description: string;
  image: string;
  features: { icon: typeof Bath; label: string }[];
  checkIn: string;
  checkOut: string;
  specifics: { icon: typeof Bath; label: string }[];
  warning: string;
};

const chalets: Chalet[] = [
  {
    id: "Suculento",
    name: "Suculento",
    description:
      "El primer refugio. Madera, vapor y silencio: el lugar donde todo comenzó.",
    image: chaletSuculentoAsset.url,
    features: [
      { icon: Bath, label: "Jacuzzi privado" },
      { icon: Trees, label: "Vista al bosque" },
      { icon: Coffee, label: "Desayuno incluido" },
    ],
    checkIn: "3:00 p.m.",
    checkOut: "12:00 m.",
    specifics: [
      { icon: Flame, label: "Zona de fogata con columpio, hamaca y leña" },
      { icon: Flame, label: "Chimenea (bioetanol incluido)" },
    ],
    warning: "Menores de edad solo con sus padres. No aceptamos mascotas en este chalet.",
  },
  {
    id: "Del Bosque",
    name: "Del Bosque",
    description:
      "Entre helechos y niebla, un escondite donde el tiempo se vuelve lento.",
    image: chaletDelBosqueAsset.url,
    features: [
      { icon: Flame, label: "Chimenea" },
      { icon: Trees, label: "Inmerso en naturaleza" },
      { icon: Bath, label: "Jacuzzi privado" },
    ],
    checkIn: "4:00 p.m.",
    checkOut: "1:00 p.m.",
    specifics: [
      { icon: Flame, label: "Zona de fogata con columpio y leña" },
      { icon: Flame, label: "Chimenea (bioetanol incluido)" },
      { icon: Trees, label: "Zona de hamacas" },
    ],
    warning: "Menores de edad solo con sus padres. No aceptamos mascotas en este chalet.",
  },
  {
    id: "Cattleya",
    name: "Cattleya",
    description:
      "Inspirado en la orquídea de Colombia: íntimo, florido, perfecto para celebrar el amor.",
    image: chaletCattleyaAsset.url,
    features: [
      { icon: Bath, label: "Jacuzzi exterior" },
      { icon: Sparkles, label: "Decoración romántica" },
      { icon: Wine, label: "Botella de bienvenida" },
    ],
    checkIn: "2:00 p.m.",
    checkOut: "11:00 a.m.",
    specifics: [
      { icon: Flame, label: "Zona de fogata con leña" },
      { icon: Car, label: "Parqueadero privado" },
      { icon: Bed, label: "Cama auxiliar disponible, capacidad hasta 4 personas" },
      { icon: PawPrint, label: "Pet friendly: aceptamos perros con costo adicional según su tamaño" },
    ],
    warning: "Menores de edad solo con sus padres. Este chalet no incluye chimenea.",
  },
  {
    id: "Ukiyo",
    name: "Ukiyo",
    description:
      "Una terraza suspendida sobre la montaña. Velas, viento tibio y cielo abierto.",
    image: chaletUkiyoAsset.url,
    features: [
      { icon: Sun, label: "Terraza privada" },
      { icon: Mountain, label: "Vista panorámica" },
      { icon: Flame, label: "Fogata exterior" },
    ],
    checkIn: "6:00 p.m.",
    checkOut: "3:00 p.m.",
    specifics: [
      { icon: Flame, label: "Zona de fogata con columpio, hamaca y leña" },
      { icon: Flame, label: "Chimenea (bioetanol incluido)" },
      { icon: Car, label: "Parqueadero privado" },
      { icon: PawPrint, label: "Pet friendly: aceptamos perros con costo adicional según su tamaño" },
    ],
    warning: "Menores de edad solo con sus padres.",
  },
  {
    id: "Satori",
    name: "Satori",
    description:
      "Despertar. Así se llama lo que ocurre dentro: madera cálida, luz dorada, calma total.",
    image: chaletSatoriAsset.url,
    features: [
      { icon: Moon, label: "Ambiente nocturno" },
      { icon: Bath, label: "Jacuzzi privado" },
      { icon: Coffee, label: "Desayuno gourmet" },
    ],
    checkIn: "5:00 p.m.",
    checkOut: "2:00 p.m.",
    specifics: [
      { icon: Flame, label: "Zona de fogata con leña" },
      { icon: Flame, label: "Chimenea (bioetanol incluido)" },
      { icon: Car, label: "Zona de parqueadero" },
    ],
    warning: "Menores solo con sus padres. No se aceptan mascotas.",
  },
];

const includedItems: { icon: typeof Bath; label: string }[] = [
  { icon: Wifi, label: "Wifi" },
  { icon: Hammer, label: "Asador a gas listo para usar" },
  { icon: Tv, label: "TV con plataformas sin anuncios" },
  { icon: Dices, label: "Juegos de mesa" },
  { icon: ShowerHead, label: "Baño privado con agua caliente, toallas, papel higiénico y jabón de manos" },
  { icon: Utensils, label: "Cocina dotada + insumos para preparar desayuno" },
  { icon: Bed, label: "Cama doble con plumón y calienta colchón" },
  { icon: Bath, label: "Jacuzzi con hidromasaje" },
];


export function ChaletsCarousel() {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [selected, setSelected] = useState(0);
  const [count, setCount] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState<string | null>(null);

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
    <section id="chalets" className="bg-background pt-16 pb-10 md:py-32">
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

        <Reveal>
          <div className="mt-14 rounded-3xl border border-gold/30 bg-cream/40 p-8 md:p-10">
            <h3 className="text-center font-display text-2xl font-medium text-foreground md:text-3xl">
              Esto incluye toda tu estadía
            </h3>
            <p className="mt-2 text-center font-serif-soft text-sm italic text-muted-foreground">
              Lo mismo en los 5 chalets — pensado para que solo traigan equipaje y ganas de desconectarse.
            </p>
            <ul className="mt-7 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              {includedItems.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-start gap-3 text-sm text-foreground/85">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                    <Icon className="h-4 w-4" strokeWidth={1.7} />
                  </span>
                  <span className="leading-snug">{label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex items-start gap-2 text-xs italic text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-wood" strokeWidth={1.8} />
              <span>
                No incluye elementos de aseo personal como shampoo, acondicionador o jabón corporal.
              </span>
            </p>
          </div>
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
                      {chaletGalleries[c.id] && (
                        <button
                          onClick={() => setGalleryOpen(c.id)}
                          aria-label={`Ver más fotos de ${c.name}`}
                          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-medium tracking-[0.15em] uppercase text-cream backdrop-blur-sm transition hover:bg-black/75"
                        >
                          <Images className="h-3.5 w-3.5" strokeWidth={1.8} />
                          Más fotos
                        </button>
                      )}
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

                      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-forest-deep px-4 py-2 text-cream shadow-sm">
                        <Clock className="h-4 w-4" strokeWidth={1.8} />
                        <span className="font-sans text-[11px] tracking-[0.2em] uppercase">
                          Ingreso {c.checkIn} · Salida {c.checkOut}
                        </span>
                      </div>

                      <div className="mt-5 rounded-2xl border border-border/70 bg-background/60 p-5">
                        <p className="font-sans text-[10px] tracking-[0.25em] text-gold uppercase">
                          Lo que tiene este chalet
                        </p>
                        <ul className="mt-3 space-y-2.5">
                          {c.specifics.map(({ icon: Icon, label }) => (
                            <li
                              key={label}
                              className="flex items-start gap-2.5 text-sm text-foreground/85"
                            >
                              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-wood" strokeWidth={1.6} />
                              <span className="leading-snug">{label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-xs text-foreground/80">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-wood" strokeWidth={1.8} />
                        <span className="leading-snug">{c.warning}</span>
                      </div>

                      <p className="mt-6 font-sans text-sm text-gold/90">
                        <span className="mr-1">💰</span>
                        <span className="font-medium">Desde $350.000</span>
                        <span className="text-muted-foreground"> / noche</span>
                      </p>





                    </div>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
      <ChaletLightbox
        open={galleryOpen !== null}
        onClose={() => setGalleryOpen(null)}
        images={galleryOpen ? chaletGalleries[galleryOpen] ?? [] : []}
        chaletName={galleryOpen ?? ""}
      />
    </section>
  );
}
