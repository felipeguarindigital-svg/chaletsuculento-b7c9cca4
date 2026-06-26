import { Button } from "@/components/ui/button";

const TARIFAS = [
  { dia: "Domingo a jueves", precio: "$350.000" },
  { dia: "Viernes", precio: "$420.000" },
  { dia: "Sábado", precio: "$495.000" },
  { dia: "Previa a festivo", precio: "$495.000" },
];

export function Tarifas() {
  const scrollToReservas = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("reservas")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="tarifas" className="pt-10 pb-16 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <p className="font-serif italic text-primary/70 text-sm md:text-base tracking-wide mb-3">
            Tarifas
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground mb-4 leading-tight">
            Una tarifa, cinco refugios
          </h2>
          <p className="text-muted-foreground text-base md:text-lg font-light">
            El mismo precio sin importar cuál escojas. Lo único que cambia es la experiencia.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {TARIFAS.map((t) => (
            <div
              key={t.dia}
              className="group relative rounded-2xl border border-primary/20 bg-card p-6 md:p-7 text-center shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-300"
            >
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <p className="font-serif text-base md:text-lg text-muted-foreground mb-4 min-h-[3rem] flex items-center justify-center">
                {t.dia}
              </p>
              <p className="font-serif text-3xl md:text-4xl text-primary font-medium tracking-tight">
                {t.precio}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2 uppercase tracking-wider">
                por noche
              </p>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground/70 mt-8 italic">
          Tarifa por pareja, por noche. Aplica para los 5 chalets.
        </p>

        <div className="flex justify-center mt-10">
          <Button
            asChild
            size="lg"
            className="rounded-full px-10 py-6 text-base tracking-wide"
          >
            <a href="#reservas" onClick={scrollToReservas}>
              Reservar ahora
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
