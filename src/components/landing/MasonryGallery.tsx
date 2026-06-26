import { Reveal } from "./Reveal";
import g31 from "@/assets/gallery-Foto-31.jpg.asset.json";
import g47 from "@/assets/gallery-Foto-47.jpg.asset.json";
import g50 from "@/assets/gallery-Foto-50.jpg.asset.json";
import g56 from "@/assets/gallery-Foto-56.jpg.asset.json";
import g60 from "@/assets/gallery-Foto-60.jpg.asset.json";
import g66 from "@/assets/gallery-Foto-66.jpg.asset.json";
import g72 from "@/assets/gallery-Foto-72.jpg.asset.json";

const images = [
  { src: g31.url, alt: "Pareja en columpio de madera con luces cálidas en la noche" },
  
  { src: g47.url, alt: "Pareja descansando en la cama del chalet" },
  { src: g50.url, alt: "Vista frontal del chalet entre la vegetación" },
  { src: g56.url, alt: "Pareja jugando dominó frente a la chimenea" },
  { src: g60.url, alt: "Pareja en el sofá disfrutando de la chimenea y TV" },
  { src: g66.url, alt: "Pareja jugando cartas en el jardín con Buda" },
  { src: g72.url, alt: "Pareja en el jacuzzi nocturno con la habitación iluminada" },
];

export function MasonryGallery() {
  return (
    <section id="galeria" className="bg-background pt-2 pb-16 md:py-32">
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
