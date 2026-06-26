import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/landing/Hero";
import { EmotionalSplit } from "@/components/landing/EmotionalSplit";
import { SensoryBlocks } from "@/components/landing/SensoryBlocks";
import { MasonryGallery } from "@/components/landing/MasonryGallery";
import { Transformation } from "@/components/landing/Transformation";
import { ChaletsCarousel } from "@/components/landing/ChaletsCarousel";
import { Tarifas } from "@/components/landing/Tarifas";
import { ReservasSection } from "@/components/landing/ReservasSection";
import { Testimonials } from "@/components/landing/Testimonials";
import { LocationMap } from "@/components/landing/LocationMap";
import { Faq } from "@/components/landing/Faq";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { FloatingActions } from "@/components/landing/FloatingActions";
import { Navbar } from "@/components/landing/Navbar";
import heroImg from "@/assets/hero-jacuzzi-sunset.jpg";

const title =
  "Suculento Chalet Santa Elena — Glamping romántico con jacuzzi privado";
const description =
  "Escápense del ruido entre el bosque de Santa Elena. Chalet privado con jacuzzi, a 45 minutos de Medellín. Ideal para aniversarios, cumpleaños y escapadas en pareja.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:image", content: heroImg },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: heroImg },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Montserrat:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LodgingBusiness",
          name: "Chalet Suculento Santa Elena",
          image: ["https://chaletsuculento.com" + heroImg],
          address: {
            "@type": "PostalAddress",
            streetAddress: "Corregimiento Cl. 51A",
            addressLocality: "Santa Elena, Medellín",
            addressRegion: "Antioquia",
            addressCountry: "CO",
          },
          telephone: "+573013060013",
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "5.0",
            reviewCount: "184",
          },
          priceRange: "$$",
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="bg-background text-foreground">
      <Navbar />
      <Hero />
      <EmotionalSplit />
      <SensoryBlocks />
      <ChaletsCarousel />
      <Tarifas />
      <MasonryGallery />
      <Transformation />
      <Testimonials />
      <LocationMap />
      <Faq />
      <ReservasSection />
      <FinalCta />
      <Footer />
      <FloatingActions />
    </main>
  );
}
