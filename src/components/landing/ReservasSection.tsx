import { useEffect, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import ReservasSuculento from "./ReservasSuculento";
import { Reveal } from "./Reveal";

const CHALETS = ["Suculento", "Del Bosque", "Cattleya", "Ukiyo", "Satori"];

export function ReservasSection() {
  const [chalet, setChalet] = useState<string>("Suculento");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onSelect(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      if (detail && CHALETS.includes(detail)) {
        setChalet(detail);
        setOpen(false);
      }
    }
    window.addEventListener("suculento:select-chalet", onSelect);
    return () => window.removeEventListener("suculento:select-chalet", onSelect);
  }, []);

  return (
    <section id="reservas" className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-2xl px-6">
        <Reveal>
          <p className="text-center font-sans text-xs tracking-[0.3em] text-gold uppercase">
            Reservas
          </p>
          <h2 className="mt-3 text-center font-display text-4xl font-medium text-foreground md:text-5xl">
            Elige tu chalet{" "}
            <span className="italic text-forest-deep">y reserva tu fecha.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-center font-serif-soft text-lg italic text-muted-foreground">
            Tu escapada empieza aquí. Selecciona el refugio y la fecha que más te enamoren.
          </p>
        </Reveal>

        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-gold/30 bg-cream/40 px-5 py-4">
          <p className="font-sans text-[10px] tracking-[0.25em] text-gold uppercase">
            Tarifas por noche · por pareja
          </p>
          <ul className="mt-2 space-y-1 text-sm text-foreground/85">
            <li className="flex justify-between gap-3">
              <span>🗓️ Domingo a Jueves</span>
              <span className="font-medium">$350.000</span>
            </li>
            <li className="flex justify-between gap-3">
              <span>🗓️ Viernes</span>
              <span className="font-medium">$420.000</span>
            </li>
            <li className="flex justify-between gap-3">
              <span>🗓️ Sábado &amp; Previa Festivo</span>
              <span className="font-medium">$495.000</span>
            </li>
          </ul>
        </div>

        {/* Dropdown */}
        <div className="mx-auto mt-8 max-w-md">
          <label className="block font-sans text-[11px] tracking-[0.25em] text-muted-foreground uppercase">
            Chalet
          </label>

          <div className="relative mt-2">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded-2xl border border-gold/40 bg-card px-6 py-4 text-left font-display text-xl text-foreground shadow-soft transition hover:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40"
            >
              <span className="italic">{chalet}</span>
              <ChevronDown
                className={`h-5 w-5 text-gold transition-transform ${open ? "rotate-180" : ""}`}
                strokeWidth={1.5}
              />
            </button>

            {open && (
              <ul
                role="listbox"
                className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-gold/30 bg-card shadow-warm"
              >
                {CHALETS.map((c) => {
                  const active = c === chalet;
                  return (
                    <li key={c}>
                      <button
                        type="button"
                        onClick={() => {
                          setChalet(c);
                          setOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-6 py-3.5 text-left font-display text-lg transition ${
                          active
                            ? "bg-gold/15 text-foreground"
                            : "text-foreground/80 hover:bg-cream"
                        }`}
                      >
                        <span className={active ? "italic text-foreground" : ""}>{c}</span>
                        {active && <Check className="h-4 w-4 text-gold" strokeWidth={2} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-10">
          <ReservasSuculento chaletName={chalet} />
        </div>
      </div>
    </section>
  );
}
