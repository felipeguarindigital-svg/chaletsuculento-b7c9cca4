import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "./Reveal";
import {
  Car,
  PackageCheck,
  Sparkles,
  ShieldAlert,
  CalendarCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type FaqItem = { q: string; a: ReactNode };
type FaqBlock = {
  id: string;
  title: string;
  icon: LucideIcon;
  accent: string; // tailwind text color class for icon
  items: FaqItem[];
};

const Price = ({ children }: { children: ReactNode }) => (
  <span className="font-display font-semibold text-forest-deep">{children}</span>
);

const Warn = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-start gap-2 rounded-md bg-gold/10 border border-gold/40 px-3 py-2 text-sm text-foreground/80">
    <span aria-hidden>⚠️</span>
    <span>{children}</span>
  </span>
);

const blocks: FaqBlock[] = [
  {
    id: "como-llegar",
    title: "Cómo llegar",
    icon: Car,
    accent: "text-forest-deep",
    items: [
      {
        q: "¿Cuánto tiempo tarda en llegar desde Medellín?",
        a: (
          <p>
            Estamos a menos de <Price>50 minutos</Price> del centro de Medellín, en una
            vía pavimentada con un tramo corto de 1.200 metros de carretera destapada,
            de fácil acceso en cualquier vehículo.
          </p>
        ),
      },
      {
        q: "¿Cómo llego si voy en auto?",
        a: (
          <p>
            Te enviaremos la ubicación exacta por Waze y los tips de la ruta más
            estable. La mayoría de nuestros huéspedes usan GPS sin problema.
          </p>
        ),
      },
      {
        q: "¿Cómo llego en transporte público?",
        a: (
          <ul className="space-y-2">
            <li>🚌 <strong>Bus:</strong> Desde Placita de Flórez hasta Cancha de Barro Blanco + 15 min de caminata.</li>
            <li>🚡 <strong>Metrocable + chivero</strong> hasta la zona.</li>
            <li>Si lo prefieres, podemos recomendarte un conductor local.</li>
          </ul>
        ),
      },
      {
        q: "¿Hay parqueadero?",
        a: (
          <p>
            Sí. Cada chalet cuenta con parqueadero privado (o zona de parqueadero
            asignada, según el chalet). Es seguro y está dentro del complejo.
          </p>
        ),
      },
    ],
  },
  {
    id: "incluye",
    title: "Incluye en tu reserva",
    icon: PackageCheck,
    accent: "text-gold",
    items: [
      {
        q: "¿Qué viene incluido en mi estadía?",
        a: (
          <div className="space-y-3">
            <p>
              Wifi · Asador a gas · TV sin anuncios · Juegos de mesa · Baño privado con
              amenities básicos · Cocina dotada · Cama doble con plumón y calienta
              colchón · Jacuzzi con hidromasaje · Desayuno tipo kit.
            </p>
            <p className="text-sm text-foreground/60">
              Para la lista completa, revisa la descripción del chalet que escojas;
              algunos incluyen chimenea, zona de hamacas o extras especiales.
            </p>
          </div>
        ),
      },
      {
        q: "¿Qué desayuno está incluido?",
        a: (
          <div className="space-y-3">
            <p>Tu reserva incluye un <strong>Kit de Desayuno básico</strong>:</p>
            <p>
              🥚 Huevos frescos · 🫓 Arepas · 🍪 Galletas · 🧈 Aceite · ☕ Café ·
              🌿 Aromáticas · 🥛 Crema · 🧂 Sal y azúcar
            </p>
            <Warn>
              El chalet tiene cocina totalmente equipada. No incluye shampoo ni jabón
              corporal.
            </Warn>
          </div>
        ),
      },
      {
        q: "¿Puedo agregar más cosas al desayuno?",
        a: (
          <div className="space-y-2">
            <p>Claro. Ofrecemos:</p>
            <div className="rounded-lg border border-gold/30 bg-background/60 p-4 space-y-2">
              <p>🥓 <strong>Complemento Desayuno Ranchero:</strong> <Price>$37.000</Price> — más proteína y potencia.</p>
              <p>👨‍🍳 <strong>Servicio de preparación:</strong> <Price>$10.000 por persona</Price> — nosotros cocinamos.</p>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "experiencias",
    title: "Experiencias y servicios especiales",
    icon: Sparkles,
    accent: "text-gold",
    items: [
      {
        q: "¿Ofrecen cenas?",
        a: (
          <div className="space-y-3">
            <p>
              Sí. Preparamos cena servida en tu chalet: ensalada fresca, acompañamiento
              gourmet, postre y bebida.
            </p>
            <div className="overflow-hidden rounded-lg border border-gold/30">
              <table className="w-full text-left text-sm">
                <thead className="bg-forest-deep text-cream">
                  <tr>
                    <th className="px-4 py-2 font-display font-normal">Opción</th>
                    <th className="px-4 py-2 font-display font-normal">Precio (pareja)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/20 bg-background/60">
                  <tr><td className="px-4 py-2">🍗 Pollo o Pescado</td><td className="px-4 py-2"><Price>$75.000</Price></td></tr>
                  <tr><td className="px-4 py-2">🥩 Res</td><td className="px-4 py-2"><Price>$82.000</Price></td></tr>
                  <tr><td className="px-4 py-2">🐟 Salmón Especial</td><td className="px-4 py-2"><Price>$95.000</Price></td></tr>
                </tbody>
              </table>
            </div>
            <p>✨ <strong>Toque Romántico</strong> (florero, velas, pétalos): <Price>+$20.000</Price></p>
          </div>
        ),
      },
      {
        q: "¿Qué hay para aniversarios o celebraciones?",
        a: (
          <div className="space-y-3">
            <p>Tenemos varias opciones que se ven increíble en fotos:</p>
            <div className="rounded-lg border border-gold/30 bg-background/60 p-4 space-y-2">
              <p>🔥 <strong>Kit de Asado</strong> (¡favorito!) — todo listo para usar en el asador a gas.</p>
              <ul className="ml-6 space-y-1">
                <li>Cerdo: <Price>$50.000</Price></li>
                <li>Res: <Price>$58.000</Price></li>
              </ul>
            </div>
            <div className="rounded-lg border border-gold/30 bg-background/60 p-4 space-y-2">
              <p>🧀 <strong>Tabla de Quesos & Sangría</strong> — selección premium + nuestra receta especial.</p>
              <ul className="ml-6 space-y-1">
                <li>Tabla: <Price>$95.000</Price></li>
                <li>Sangría: <Price>$65.000</Price></li>
              </ul>
            </div>
            <p className="text-sm text-foreground/70">
              Además, cada chalet puede decorarse especialmente si lo solicitas con
              anticipación.
            </p>
          </div>
        ),
      },
      {
        q: "¿Puedo cocinar mis propios alimentos?",
        a: (
          <p>
            Totalmente. La cocina viene completamente equipada (estufa, nevera,
            utensilios, vajilla). También puedes pedir domicilios de restaurantes
            cercanos; nosotros te ayudamos a coordinar.
          </p>
        ),
      },
    ],
  },
  {
    id: "politicas",
    title: "Políticas y restricciones",
    icon: ShieldAlert,
    accent: "text-forest-deep",
    items: [
      {
        q: "¿Puedo llevar mascotas?",
        a: (
          <div className="space-y-2">
            <p>Depende del chalet:</p>
            <p>🐾 <strong>Pet Friendly:</strong> Ukiyo y Cattleya aceptan perros con costo adicional según tamaño.</p>
            <Warn>🚫 No mascotas: Suculento, Satori y Del Bosque.</Warn>
            <p className="text-sm text-foreground/70">
              Pregunta al reservar cuál es el chalet ideal para tu perro.
            </p>
          </div>
        ),
      },
      {
        q: "¿Puedo llevar menores de edad?",
        a: (
          <Warn>
            Sí, pero solo acompañados por sus padres o tutores mayores de edad en
            todo momento.
          </Warn>
        ),
      },
      {
        q: "¿Es completamente privado?",
        a: (
          <p>
            Completamente. Cada chalet es independiente, con entrada privada, jacuzzi
            privado y sin vecinos cerca. Es solo tú, tu pareja (o grupo), el bosque y
            la tranquilidad.
          </p>
        ),
      },
      {
        q: "¿Qué no incluye la estadía?",
        a: (
          <ul className="ml-5 list-disc space-y-1">
            <li>Shampoo, acondicionador o jabón corporal (lleva los tuyos).</li>
            <li>Comidas (salvo el desayuno kit incluido).</li>
            <li>Servicios opcionales como asados, cenas o complementos.</li>
          </ul>
        ),
      },
    ],
  },
  {
    id: "reserva",
    title: "Reserva y cambios",
    icon: CalendarCheck,
    accent: "text-gold",
    items: [
      {
        q: "¿Cuál es la política de cancelación?",
        a: (
          <p>
            Cancelación gratuita hasta 7 días antes de tu llegada. Después de ese
            plazo se retiene el 50% del valor de la reserva.
          </p>
        ),
      },
      {
        q: "¿Puedo modificar mi reserva después de reservar?",
        a: (
          <p>
            Sí. Contáctanos por WhatsApp y haremos los cambios que sea posible según
            disponibilidad.
          </p>
        ),
      },
      {
        q: "¿Qué formas de pago aceptan?",
        a: (
          <p>
            Aceptamos transferencia bancaria, Nequi, Daviplata y tarjeta de crédito.
            Para confirmar tu reserva pedimos un anticipo del 50%.
          </p>
        ),
      },
    ],
  },
];

export function Faq() {
  return (
    <section id="preguntas" className="bg-cream py-24 md:py-32">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center">
          <Reveal>
            <p className="font-serif-soft text-sm tracking-[0.3em] text-gold uppercase">
              Preguntas frecuentes
            </p>
            <h2 className="mt-4 font-display text-4xl text-forest-deep md:text-5xl text-balance">
              Todo lo que quieres saber.
            </h2>
            <p className="mt-4 font-serif-soft text-lg text-foreground/70">
              Organizado por temas para que encuentres rápido lo que buscas.
            </p>
          </Reveal>
        </div>

        <Reveal className="mt-14">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {blocks.map((block) => {
              const Icon = block.icon;
              return (
                <AccordionItem
                  key={block.id}
                  value={block.id}
                  className="overflow-hidden rounded-2xl border border-gold/30 bg-background/40 shadow-soft"
                >
                  <AccordionTrigger className="px-6 py-5 hover:no-underline md:px-8 md:py-6">
                    <span className="flex items-center gap-4 text-left">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream ${block.accent}`}>
                        <Icon size={20} />
                      </span>
                      <span className="font-display text-xl text-forest-deep md:text-2xl">
                        {block.title}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-2 md:px-8">
                    <Accordion type="single" collapsible className="w-full border-t border-gold/20">
                      {block.items.map((item, i) => (
                        <AccordionItem
                          key={i}
                          value={`${block.id}-${i}`}
                          className="border-b border-gold/20 last:border-b-0"
                        >
                          <AccordionTrigger className="py-4 text-left font-display text-base text-forest-deep hover:no-underline md:text-lg">
                            <span className="flex items-start gap-3">
                              <span className={`mt-0.5 font-serif-soft text-sm ${block.accent}`}>
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <span>{item.q}</span>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="font-serif-soft text-base leading-relaxed text-foreground/80 md:text-lg">
                            <div className="pl-9 space-y-3">{item.a}</div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
