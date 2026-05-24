# Landing Page — Suculento Chalet Santa Elena

Una landing de una sola página, cinematográfica y emocional, construida para que parejas de Medellín reserven una escapada romántica. No se siente como hotel: se siente como una experiencia.

## Identidad visual

**Paleta** (tokens semánticos en `src/styles.css`, formato oklch):
- `--background` #F8F5EF (crema base)
- `--forest-deep` #2E4B39 (verde bosque, CTAs principales)
- `--forest-pine` #44604B (verde pino, acentos)
- `--wood-warm` #836953 (madera cálida)
- `--cream-warm` #EFE8DE (superficies suaves)
- `--gold-soft` #C5A46D (detalles dorados, estrellas, líneas)
- `--foreground` #333333 (texto)

**Tipografías** (Google Fonts en `__root.tsx` head):
- Playfair Display — H1/H2
- Cormorant Garamond — subtítulos y citas
- Montserrat — cuerpo y UI

**Sistema visual:** bordes redondeados generosos, sombras suaves cálidas, mucho aire blanco, animaciones lentas (fade-in al scroll, parallax suave en hero y sección final, ken-burns en imágenes hero, hover scale 1.02 en cards de galería).

## Estructura técnica

- Una ruta: `src/routes/index.tsx` (reemplaza placeholder).
- Componentes en `src/components/landing/`: `Hero`, `EmotionalSplit`, `SensoryBlocks`, `MasonryGallery`, `Transformation`, `Testimonials`, `LocationMap`, `Faq`, `FinalCta`, `Footer`, `FloatingActions`.
- Animaciones: utilidades CSS existentes (`animate-fade-in`, `hover-scale`) + IntersectionObserver hook nuevo `useInView` para revelar al scroll.
- SEO en `head()`: title "Suculento Chalet Santa Elena — Glamping romántico con jacuzzi privado", description, og:image (hero), JSON-LD `LodgingBusiness` con rating 5.0 / 184 reviews, dirección Cl. 51A Santa Elena, teléfono +57 301 3060013.

## Secciones (1 a 9 + footer)

1. **Hero full-screen** — imagen IA (pareja en jacuzzi al atardecer entre bosque de Santa Elena), overlay oscuro 35%, parallax suave. H1 "Escápense del ruido. Reconéctense entre el bosque." Subtexto, dos CTAs (Reservar ahora / Ver experiencia), 5★ + 184 experiencias, microtexto distancia, fila de 6 íconos amenities (lucide-react: Bath, Trees, Lock, Car, MapPin, Heart).

2. **Deseo emocional 50/50** — imagen IA de café humeante entre árboles, copy "No necesitas viajar horas…", reveal en scroll.

3. **Experiencia sensorial** — 4 bloques grandes alternados (zigzag): jacuzzi con vapor, cama acogedora, bosque, espacio privado. Imagen ocupa 60%, texto mínimo en Cormorant.

4. **Galería masonry** — grid CSS columns (2/3/4 según breakpoint), 11 imágenes IA, hover zoom + overlay dorado tenue, lightbox simple al click.

5. **La transformación** — fondo verde bosque profundo, timeline vertical de 8 pasos con íconos lineales minimalistas dorados, línea conectora vertical animada al scroll.

6. **Testimonios** — 4 tarjetas crema con borde dorado fino, 5★, cita en Cormorant italic, nombre + avatar IA de pareja. Reseñas adaptadas del Google Maps real (Sara, Mileidys, Paula + una cuarta).

7. **Ubicación** — título a dos columnas, mapa Google embebido (iframe estándar, sin API key) centrado en las coordenadas de Cl. 51A Santa Elena, 3 chips (Parqueadero / Fácil acceso / Zona segura).

8. **FAQ** — `Accordion` de shadcn con 6 preguntas, fondo crema, tipografía Playfair en triggers.

9. **Último golpe emocional** — imagen IA nocturna con luces cálidas, overlay oscuro 50%, H2 gigante Playfair, CTA grande verde bosque "Reservar mi experiencia", microtexto urgencia.

**Footer** — logo en Playfair, handle Instagram (`@chalets_suculento`) grande, dirección, teléfono, créditos.

**Acciones flotantes persistentes** (mobile + desktop):
- WhatsApp burbuja verde inferior-derecha (link `https://wa.me/573013060013`).
- Botón "Reservar" sticky inferior en mobile, header transparente que se vuelve sólido al scroll en desktop.

## Imágenes

Generadas con `imagegen` (modelo standard para hero y sección 9, fast para el resto), guardadas en `src/assets/`, importadas como ES6:
- `hero-jacuzzi-sunset.jpg`, `coffee-forest.jpg`
- `sensory-jacuzzi.jpg`, `sensory-bed.jpg`, `sensory-forest.jpg`, `sensory-private.jpg`
- 11 imágenes galería (`gallery-01..11.jpg`)
- 4 avatares testimonios
- `final-night.jpg`

Prompts orientados a fotografía cinematográfica cálida: luces ámbar, madera, vapor, neblina de Santa Elena, parejas reales, sin estética de stock.

## Detalles técnicos

- Tokens nuevos registrados en `@theme inline` para que `bg-forest-deep`, `text-gold-soft`, etc. funcionen.
- Componentes usan exclusivamente tokens semánticos, nunca colores hardcoded en JSX.
- Imágenes con `loading="lazy"` (excepto hero), `alt` descriptivos.
- Smooth scroll para los anchors internos (Reservar → WhatsApp, Ver experiencia → sección 3).
- Mobile-first: hero 100vh con safe-area, masonry colapsa a 2 columnas, timeline pasa a stack.

## Lo que NO incluye este plan
- Backend / sistema de reservas real (los CTAs abren WhatsApp).
- CMS para imágenes (las imágenes se generan; si luego quieres usar las reales del Instagram, se reemplazan los assets en una iteración posterior).
- i18n (todo en español).
