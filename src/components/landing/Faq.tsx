import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "./Reveal";

const faqs = [
  {
    q: "¿Tiene jacuzzi privado?",
    a: "Sí. Cada chalet cuenta con su propio jacuzzi privado, listo para usar en cualquier momento de la estadía, con agua caliente y total intimidad.",
  },
  {
    q: "¿Es fácil llegar?",
    a: "Estamos a menos de 45 minutos del centro de Medellín, en una vía pavimentada y de fácil acceso en cualquier tipo de vehículo.",
  },
  {
    q: "¿Hay parqueadero?",
    a: "Sí, ofrecemos parqueadero privado dentro del chalet, sin costo adicional, en zona segura.",
  },
  {
    q: "¿Es ideal para aniversarios y cumpleaños?",
    a: "Totalmente. Es uno de los planes favoritos para celebrar fechas especiales en pareja. Si nos avisas con tiempo, podemos ayudarte a coordinar detalles románticos.",
  },
  {
    q: "¿Qué incluye la experiencia?",
    a: "Incluye el uso completo del chalet, jacuzzi privado, zona de bosque, parqueadero y atención personalizada durante toda la estadía.",
  },
  {
    q: "¿Es completamente privado?",
    a: "Sí. Cada chalet es independiente, sin huéspedes compartiendo espacios. Vienes a desconectarte del mundo, no a estar con extraños.",
  },
];

export function Faq() {
  return (
    <section className="bg-cream py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <Reveal>
            <p className="font-serif-soft text-sm tracking-[0.3em] text-gold uppercase">
              Preguntas frecuentes
            </p>
            <h2 className="mt-4 font-display text-4xl text-forest-deep md:text-5xl text-balance">
              Todo lo que quieres saber.
            </h2>
          </Reveal>
        </div>

        <Reveal className="mt-14">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-b border-gold/30"
              >
                <AccordionTrigger className="py-6 text-left font-display text-xl text-forest-deep hover:no-underline md:text-2xl">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="font-serif-soft text-lg leading-relaxed text-foreground/80">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
