import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EA Monitor",
    short_name: "EA Monitor",
    description: "MT5 EA Monitor — real-time account, position, and P&L tracking",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      { src: "/pwa-icons/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icons/512", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
