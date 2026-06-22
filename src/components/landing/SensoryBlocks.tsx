import { Reveal } from "./Reveal";
import jacuzziAsset from "@/assets/sensory-jacuzzi-terrace.jpg.asset.json";
import bedAsset from "@/assets/sensory-satori-interior.jpg.asset.json";
import forestAsset from "@/assets/sensory-chalet-bosque.jpg.asset.json";
import privateAsset from "@/assets/sensory-jacuzzi-nocturno.jpg.asset.json";

const jacuzzi = jacuzziAsset.url;
const bed = bedAsset.url;
const forest = forestAsset.url;

const blocks = [
  {
    img: jacuzzi,
    alt: "Terraza privada con jacuzzi iluminada por luces cálidas de noche",
    eyebrow: "01 · Calor",
    title: "Agua caliente mientras afuera se siente el frío de la montaña.",
  },
  {
    img: bed,
    alt: "Interior acogedor de chalet con cama, madera natural y decoración artesanal",
    eyebrow: "02 · Descanso",
    title: "Dormir profundamente rodeado de tranquilidad.",
  },
  {
    img: forest,
    alt: "Chalet con techo verde rodeado de árboles en Santa Elena",
    eyebrow: "03 · Naturaleza",
    title: "Despertar entre árboles y aire puro.",
  },
  {
    img: privateAsset.url,
    alt: "Pareja en jacuzzi privado del chalet rodeado de bosque en la noche",
    eyebrow: "04 · Intimidad",
    title: "Sin ruido. Sin multitudes. Solo ustedes.",
  },
];

export function SensoryBlocks() {
  return (
    <section id="experiencia" className="bg-cream py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <Reveal>
          <p className="font-serif-soft text-sm tracking-[0.3em] text-gold uppercase">
            La experiencia
          </p>
          <h2 className="mt-4 font-display text-4xl text-forest-deep md:text-5xl text-balance">
            Cuatro momentos que <em>no se olvidan</em>.
          </h2>
        </Reveal>
      </div>

      <div className="mx-auto mt-20 flex max-w-6xl flex-col gap-24 px-6 md:gap-36">
        {blocks.map((b, i) => (
          <Reveal
            key={b.eyebrow}
            className={`grid items-center gap-10 md:grid-cols-12 md:gap-16 ${
              i % 2 === 1 ? "md:[&>figure]:order-2" : ""
            }`}
          >
            <figure className="md:col-span-7 relative overflow-hidden rounded-3xl shadow-warm">
              <img
                src={b.img}
                alt={b.alt}
                loading="lazy"
                width={1280}
                height={1280}
                className="aspect-[4/3] w-full object-cover transition-transform duration-[2400ms] hover:scale-[1.04]"
              />
            </figure>
            <div className="md:col-span-5">
              <p className="font-sans text-xs tracking-[0.3em] text-gold uppercase">
                {b.eyebrow}
              </p>
              <h3 className="mt-5 font-display text-3xl leading-tight text-forest-deep md:text-4xl lg:text-[2.75rem] text-balance">
                {b.title}
              </h3>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
