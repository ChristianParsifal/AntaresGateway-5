import type { MetadataRoute } from "next";
import { APP_CONFIG } from "@/shared/constants/appConfig";
import { PWA_THEME_COLORS } from "@/shared/constants/pwaThemeColors";
import { withBasePath } from "@/shared/utils/basePath";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_CONFIG.name,
    short_name: APP_CONFIG.name,
    description: APP_CONFIG.description,
    start_url: withBasePath("/dashboard"),
    scope: withBasePath("/"),
    display: "standalone",
    orientation: "any",
    background_color: PWA_THEME_COLORS.light,
    theme_color: PWA_THEME_COLORS.light,
    categories: ["developer-tools", "productivity", "utilities"],
    lang: "en",
    dir: "ltr",
    prefer_related_applications: false,
    icons: [
      {
        src: withBasePath("/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
