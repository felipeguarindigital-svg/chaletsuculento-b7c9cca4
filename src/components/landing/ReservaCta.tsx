import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";

type Props = {
  eyebrow?: string;
  title: string;
  buttonLabel: string;
};

export function ReservaCta({ eyebrow, title, buttonLabel }: Props) {
  const scrollToReservas = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("reservas")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-background py-6 md:py-20">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal>
          <div className="rounded-3xl border border-gold/30 bg-cream/50 px-6 py-10 text-center shadow-soft md:px-12 md:py-14">
            {eyebrow && (
              <p className="font-serif-soft text-base italic text-muted-foreground md:text-lg">
                {eyebrow}
              </p>
            )}
            <h3 className="mt-2 font-display text-2xl font-medium text-foreground md:text-3xl">
              <span className="italic text-forest-deep">{title}</span>
            </h3>
            <div className="mt-7 flex justify-center">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-gold px-10 py-6 text-sm font-medium tracking-[0.2em] uppercase text-foreground hover:bg-wood hover:text-cream"
              >
                <a href="#reservas" onClick={scrollToReservas}>
                  {buttonLabel}
                </a>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
