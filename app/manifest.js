export default function manifest() {
  return {
    name: "Gram Panchayat Chiutahara",
    short_name: "Chiutahara Portal",
    description: "Public services and information for Gram Panchayat Chiutahara.",
    start_url: "/",
    display: "standalone",
    background_color: "#f0fdf4",
    theme_color: "#059669",
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