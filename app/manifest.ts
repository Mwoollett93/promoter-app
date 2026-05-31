import type { MetadataRoute } from "next";

import { PWA_BACKGROUND, PWA_THEME_COLOR, pwaDescription } from "@/lib/pwa/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "PromoSync",
    short_name: "PromoSync",
    description: pwaDescription,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: PWA_BACKGROUND,
    theme_color: PWA_THEME_COLOR,
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/512?maskable=1",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
