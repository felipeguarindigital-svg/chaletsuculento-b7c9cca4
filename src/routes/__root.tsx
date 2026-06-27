import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lovable App" },
      { name: "description", content: "Premium landing page for a romantic glamping experience in Santa Elena, Medellín." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Lovable App" },
      { property: "og:description", content: "Premium landing page for a romantic glamping experience in Santa Elena, Medellín." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Lovable App" },
      { name: "twitter:description", content: "Premium landing page for a romantic glamping experience in Santa Elena, Medellín." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cf1e30f8-af7f-45c6-a51a-b7ce01bf0c5b/id-preview-2cd36706--19127113-79ab-4fc4-b690-bf6b4aed46fa.lovable.app-1779637862279.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cf1e30f8-af7f-45c6-a51a-b7ce01bf0c5b/id-preview-2cd36706--19127113-79ab-4fc4-b690-bf6b4aed46fa.lovable.app-1779637862279.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Catch global fallback: si Supabase redirige al Site URL (`/`) tras una
  // invitación o recuperación, reenviar a /admin/invite con el hash intacto.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    const safeHref = `${window.location.origin}${window.location.pathname}${window.location.search}${hash ? "#[auth-hash]" : ""}`;
    const debugPayload = {
      source: "root-guard",
      href: safeHref,
      pathname: window.location.pathname,
      hasHash: Boolean(hash),
      hashKeys: hash
        ? Array.from(new URLSearchParams(hash.slice(1)).keys())
        : [],
    };
    console.log("[InviteDebug] Root guard ejecutado", debugPayload);
    if (window.location.pathname === "/admin/invite") {
      console.log("[InviteDebug] Root guard: ya estás en /admin/invite, no redirige");
      return;
    }
    if (hash && /[#&](type=(invite|recovery)|access_token=)/.test(hash)) {
      console.log("[InviteDebug] Root guard: token detectado, redirigiendo a /admin/invite");
      window.location.replace(`/admin/invite${hash}`);
    } else {
      console.log("[InviteDebug] Root guard: no detectó token de invitación/recuperación");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
