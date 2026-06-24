import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "#inicio", label: "Inicio" },
  { href: "#chalets", label: "Nuestros Chalets" },
  { href: "#galeria", label: "Galería" },
  { href: "#resenas", label: "Reseñas" },
  { href: "#preguntas", label: "Preguntas frecuentes" },
  { href: "#reservas", label: "Reservas" },
  { href: "#ubicacion", label: "Ubicación" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    setOpen(false);
    const id = href.replace("#", "");
    if (id === "inicio") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const solid = scrolled || open;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        solid
          ? "bg-background/95 backdrop-blur border-b border-gold/20 shadow-sm"
          : "bg-transparent",
      )}
    >
      {/* Top strip — desktop only */}
      <div
        className={cn(
          "hidden md:block border-b transition-colors",
          solid ? "border-gold/15" : "border-cream/15",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-2">
          <p
            className={cn(
              "font-serif-soft text-xs italic tracking-[0.2em]",
              solid ? "text-forest-deep/70" : "text-cream/85",
            )}
          >
            Chalet Suculento · Santa Elena, Medellín
          </p>
          <a
            href="#reservas"
            onClick={(e) => handleClick(e, "#reservas")}
            className={cn(
              "inline-flex items-center rounded-full border px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] transition",
              solid
                ? "border-forest-deep/30 text-forest-deep hover:bg-forest-deep hover:text-cream"
                : "border-cream/40 text-cream hover:bg-cream hover:text-forest-deep",
            )}
          >
            Reservar
          </a>
        </div>
      </div>

      {/* Main nav row */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <a
          href="#inicio"
          onClick={(e) => handleClick(e, "#inicio")}
          className={cn(
            "font-display text-lg md:text-xl tracking-wide transition-colors",
            solid ? "text-forest-deep" : "text-cream",
          )}
        >
          Suculento
        </a>

        <ul className="hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={(e) => handleClick(e, l.href)}
                className={cn(
                  "text-xs uppercase tracking-[0.18em] font-medium transition-colors hover:text-gold",
                  solid ? "text-forest-deep" : "text-cream",
                )}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 lg:hidden">
          <a
            href="#reservas"
            onClick={(e) => handleClick(e, "#reservas")}
            className={cn(
              "inline-flex items-center rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] font-medium transition",
              solid
                ? "bg-forest-deep text-cream"
                : "bg-cream/15 text-cream border border-cream/40 backdrop-blur-sm",
            )}
          >
            Reservar
          </a>
          <button
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "p-2 transition-colors",
              solid ? "text-forest-deep" : "text-cream",
            )}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="lg:hidden border-t border-gold/20 bg-background/98 backdrop-blur">
          <ul className="flex flex-col px-5 py-4">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={(e) => handleClick(e, l.href)}
                  className="block py-3 text-sm uppercase tracking-[0.18em] font-medium text-forest-deep hover:text-gold"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
