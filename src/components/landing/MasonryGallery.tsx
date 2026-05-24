import { Reveal } from "./Reveal";
import g1 from "@/assets/gallery-01.jpg";
import g2 from "@/assets/gallery-02.jpg";
import g3 from "@/assets/gallery-03.jpg";
import g4 from "@/assets/gallery-04.jpg";
import g5 from "@/assets/gallery-05.jpg";
import g6 from "@/assets/gallery-06.jpg";
import g7 from "@/assets/gallery-07.jpg";
import g8 from "@/assets/gallery-08.jpg";
import g9 from "@/assets/gallery-09.jpg";
import heroImg from "@/assets/hero-jacuzzi-sunset.jpg";
import finalImg from "@/assets/final-night.jpg";
import sensoryForest from "@/assets/sensory-forest.jpg";

const images = [
  { src: g1, alt: "Jacuzzi encendido de noche" },
  { src: g5, alt: "Desayuno en la cama" },
  { src: g3, alt: "Vista aérea del chalet entre el bosque" },
  { src: g2, alt: "Habitación con luces cálidas" },
  { src: g6, alt: "Copas de vino al atardecer" },
  { src: g9, alt: "Pareja caminando entre la niebla" },
  { src: g4, alt: "Fogata en la noche" },
  { src: heroImg, alt: "Atardecer en el jacuzzi" },
  { src: g8, alt: "Detalles románticos con velas" },
  { src: g7, alt: "Bosque con neblina típica de Santa Elena" },
  { src: sensoryForest, alt: "Sol entre los pinos al amanecer" },
  { src: finalImg, alt: "Cabaña con luces cálidas en la noche" },
];

export function MasonryGallery() {
  return (
    <section className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <Reveal>
          <p className="font-serif-soft text-sm tracking-[0.3em] text-gold uppercase">
            Galería
          </p>
          <h2 className="mt-4 font-display text-4xl text-forest-deep md:text-5xl text-balance">
            Momentos reales en el chalet.
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-serif-soft text-lg italic text-foreground/70">
            Lo que vives aquí, se queda.
          </p>
        </Reveal>
      </div>

      <div className="mx-auto mt-14 max-w-7xl px-4 md:px-8">
        <div className="columns-2 gap-4 md:columns-3 md:gap-6 lg:columns-4">
          {images.map((img, i) => (
            <Reveal key={i} delay={(i % 4) * 70} className="mb-4 md:mb-6 break-inside-avoid">
              <figure className="group relative overflow-hidden rounded-2xl shadow-soft">
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-[1800ms] ease-out group-hover:scale-[1.06]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-deep/40 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
