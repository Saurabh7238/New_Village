export default function manifest() {
  return {
    name: "Gram Panchayat Chiutahara",
    short_name: "Chiutahara Portal",
    description: "Public services and information for Gram Panchayat Chiutahara.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f8fb",
    theme_color: "#0f766e",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/pwa-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}