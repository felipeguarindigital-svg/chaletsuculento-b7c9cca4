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
        q: "¿Qué desayuno está incluido en mi reserva?",
        a: (
          <div className="space-y-3">
            <p>Tu reserva incluye un <strong>Kit de Desayuno básico</strong> sin costo adicional:</p>
            <p>
              🥚 Huevos frescos · 🫓 Arepas · 🍪 Galletas · 🧈 Aceite · ☕ Café ·
              🌿 Aromáticas · 🥛 Crema · 🧂 Sal y azúcar
            </p>
            <p>El chalet cuenta con cocina totalmente equipada para que lo prepares tú mismo.</p>
            <p className="text-sm text-foreground/60">(No incluye shampoo, acondicionador ni jabón corporal)</p>
            <div className="rounded-lg border border-gold/30 bg-background/60 p-4">
              <p>
                ¿Quieres algo más completo? Agrega el <strong>Complemento Desayuno Ranchero</strong> por{" "}
                <Price>$37.000</Price>: tostadas, quesito, leche, salchicha ranchera y chocolate Milo.
              </p>
              <p className="mt-2 text-sm text-foreground/70">(Pide con mínimo 1 día de anticipación)</p>
            </div>
          </div>
        ),
      },
      {
        q: "¿Ofrecen cenas servidas en el chalet?",
        a: (
          <div className="space-y-3">
            <p>Sí. Preparamos cena completa directamente en tu chalet. Elige tu plato principal (precio por pareja):</p>

            {/* Tabla desktop */}
            <div className="hidden md:block overflow-hidden rounded-lg border border-gold/30">
              <table className="w-full text-left text-sm">
                <thead className="bg-forest-deep text-cream">
                  <tr>
                    <th className="px-4 py-2 font-display font-normal">Opción</th>
                    <th className="px-4 py-2 font-display font-normal">Precio (pareja)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/20 bg-background/60">
                  <tr><td className="px-4 py-2">🍗 Pollo a la plancha</td><td className="px-4 py-2"><Price>$75.000</Price></td></tr>
                  <tr><td className="px-4 py-2">🐖 Cerdo en salsa de champiñones</td><td className="px-4 py-2"><Price>$75.000</Price></td></tr>
                  <tr><td className="px-4 py-2">🥩 Res BBQ</td><td className="px-4 py-2"><Price>$82.000</Price></td></tr>
                  <tr><td className="px-4 py-2">🐟 Salmón a la parrilla</td><td className="px-4 py-2"><Price>$95.000</Price></td></tr>
                </tbody>
              </table>
            </div>

            {/* Tarjetas móvil */}
            <ul className="md:hidden space-y-2">
              {[
                { n: "🍗 Pollo a la plancha", p: "$75.000" },
                { n: "🐖 Cerdo en salsa de champiñones", p: "$75.000" },
                { n: "🥩 Res BBQ", p: "$82.000" },
                { n: "🐟 Salmón a la parrilla", p: "$95.000" },
              ].map((it) => (
                <li key={it.n} className="flex items-center justify-between gap-3 rounded-lg border border-gold/30 bg-background/60 px-4 py-3">
                  <span>{it.n}</span>
                  <Price>{it.p}</Price>
                </li>
              ))}
            </ul>

            <p>Todas incluyen: ensalada fresca, acompañamiento gourmet y postre casero.</p>
            <p>🌹 <strong>Ambientación romántica</strong> (velas, pétalos): <Price>+$20.000</Price></p>
            <p className="text-sm text-foreground/70">(Pide con mínimo 1 día de anticipación)</p>
          </div>
        ),
      },
      {
        q: "¿Tienen experiencias o decoraciones especiales para celebraciones?",
        a: (
          <div className="space-y-3">
            <p>Sí, tenemos varias opciones diseñadas para hacer momentos únicos:</p>

            {/* Tabla desktop */}
            <div className="hidden md:block overflow-hidden rounded-lg border border-gold/30">
              <table className="w-full text-left text-sm">
                <thead className="bg-forest-deep text-cream">
                  <tr>
                    <th className="px-4 py-2 font-display font-normal">Experiencia</th>
                    <th className="px-4 py-2 font-display font-normal">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/20 bg-background/60">
                  <tr><td className="px-4 py-2">💛 Latido · Ritual de Conexión en Pareja</td><td className="px-4 py-2"><Price>$245.000</Price></td></tr>
                  <tr><td className="px-4 py-2">🌹 Decoración Romántica Premium (pétalos, neón, vino, foto)</td><td className="px-4 py-2"><Price>$165.000</Price></td></tr>
                  <tr><td className="px-4 py-2">💐 Ramo de Flores artesanal</td><td className="px-4 py-2"><Price>$135.000</Price></td></tr>
                  <tr><td className="px-4 py-2">🎂 Decoración Cumpleaños (neón, globos, ponqué, foto)</td><td className="px-4 py-2"><Price>$120.000</Price></td></tr>
                  <tr><td className="px-4 py-2">🎨 Record-arte · Experiencia Creativa en Pareja</td><td className="px-4 py-2"><Price>$100.000</Price></td></tr>
                  <tr><td className="px-4 py-2">🌸 Decoración Romántica Esencial (pétalos, letrero, mesa)</td><td className="px-4 py-2"><Price>$95.000</Price></td></tr>
                  <tr><td className="px-4 py-2">💡 Decoración Luz y Mensaje (neón + velas LED)</td><td className="px-4 py-2"><Price>$70.000</Price></td></tr>
                  <tr><td className="px-4 py-2">📸 Sesión de Fotos Profesional (5 fotos + drone)</td><td className="px-4 py-2"><Price>$60.000</Price></td></tr>
                  <tr><td className="px-4 py-2">🔐 Manilla en Clave Morse · Par</td><td className="px-4 py-2"><Price>$69.000</Price></td></tr>
                  <tr><td className="px-4 py-2">🔐 Manilla en Clave Morse · Individual</td><td className="px-4 py-2"><Price>$39.000</Price></td></tr>
                </tbody>
              </table>
            </div>

            {/* Tarjetas móvil */}
            <ul className="md:hidden space-y-2">
              {[
                { n: "💛 Latido · Ritual de Conexión en Pareja", p: "$245.000" },
                { n: "🌹 Decoración Romántica Premium (pétalos, neón, vino, foto)", p: "$165.000" },
                { n: "💐 Ramo de Flores artesanal", p: "$135.000" },
                { n: "🎂 Decoración Cumpleaños (neón, globos, ponqué, foto)", p: "$120.000" },
                { n: "🎨 Record-arte · Experiencia Creativa en Pareja", p: "$100.000" },
                { n: "🌸 Decoración Romántica Esencial (pétalos, letrero, mesa)", p: "$95.000" },
                { n: "💡 Decoración Luz y Mensaje (neón + velas LED)", p: "$70.000" },
                { n: "📸 Sesión de Fotos Profesional (5 fotos + drone)", p: "$60.000" },
                { n: "🔐 Manilla en Clave Morse · Par", p: "$69.000" },
                { n: "🔐 Manilla en Clave Morse · Individual", p: "$39.000" },
              ].map((it) => (
                <li key={it.n} className="flex items-start justify-between gap-3 rounded-lg border border-gold/30 bg-background/60 px-4 py-3">
                  <span className="flex-1">{it.n}</span>
                  <Price>{it.p}</Price>
                </li>
              ))}
            </ul>

            <p className="text-sm text-foreground/70">
              Cada experiencia incluye detalles únicos — consúltanos para más información y personalización.
              (Algunas requieren reserva con 2 días de anticipación)
            </p>
          </div>
        ),
      },
      {
        q: "¿Qué opciones de alimentación adicional puedo agregar?",
        a: (
          <div className="space-y-3">
            <p>Además del desayuno incluido y las cenas, puedes agregar:</p>

            {/* Tabla desktop */}
            <div className="hidden md:block overflow-hidden rounded-lg border border-gold/30">
              <table className="w-full text-left text-sm">
                <thead className="bg-forest-deep text-cream">
                  <tr>
                    <th className="px-4 py-2 font-display font-normal">Opción</th>
                    <th className="px-4 py-2 font-display font-normal">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/20 bg-background/60">
                  <tr><td className="px-4 py-2">🧀 Tabla de Quesos Artesanal (frutas, embutidos, quesos, tostadas)</td><td className="px-4 py-2"><Price>$95.000</Price></td></tr>
                  <tr><td className="px-4 py-2">🍷 Sangría Artesanal · Jarra 1.2L para 2</td><td className="px-4 py-2"><Price>$65.000</Price></td></tr>
                  <tr><td className="px-4 py-2">🔥 Kit Asado de Res (carne, arepas, chorizo, BBQ)</td><td className="px-4 py-2"><Price>$58.000</Price></td></tr>
                  <tr><td className="px-4 py-2">🔥 Kit Asado de Cerdo (carne, arepas, chorizo, condimentos)</td><td className="px-4 py-2"><Price>$50.000</Price></td></tr>
                  <tr><td className="px-4 py-2">🍷 Botella de Vino Artesanal</td><td className="px-4 py-2"><Price>$40.000</Price></td></tr>
                </tbody>
              </table>
            </div>

            {/* Tarjetas móvil */}
            <ul className="md:hidden space-y-2">
              {[
                { n: "🧀 Tabla de Quesos Artesanal (frutas, embutidos, quesos, tostadas)", p: "$95.000" },
                { n: "🍷 Sangría Artesanal · Jarra 1.2L para 2", p: "$65.000" },
                { n: "🔥 Kit Asado de Res (carne, arepas, chorizo, BBQ)", p: "$58.000" },
                { n: "🔥 Kit Asado de Cerdo (carne, arepas, chorizo, condimentos)", p: "$50.000" },
                { n: "🍷 Botella de Vino Artesanal", p: "$40.000" },
              ].map((it) => (
                <li key={it.n} className="flex items-start justify-between gap-3 rounded-lg border border-gold/30 bg-background/60 px-4 py-3">
                  <span className="flex-1">{it.n}</span>
                  <Price>{it.p}</Price>
                </li>
              ))}
            </ul>

            <p className="text-sm text-foreground/70">(Kits de asado y Tabla de Quesos: pide con mínimo 2 días de anticipación)</p>
          </div>
        ),
      },
      {
        q: "¿Puedo cocinar o pedir domicilios?",
        a: (
          <p>
            Totalmente. Cada chalet tiene cocina completamente equipada: estufa, nevera, utensilios y
            vajilla. Puedes traer tus propios alimentos o pedir domicilios de restaurantes cercanos —
            nosotros te ayudamos a coordinar si lo necesitas.
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
