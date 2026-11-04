import dbConnect from "@/lib/dbConnect";
import HomeSettings from "@/models/HomeSettings";

export const dynamic = "force-dynamic";

export default function manifest() {
  return getManifest();
}

async function getManifest() {
  let villageName = "Chiutahara";
  try {
    await dbConnect();
    const settings = await HomeSettings.findOne({ name: "default" }).select("villageName").lean();
    villageName = settings?.villageName || villageName;
  } catch (error) {
    console.error("Failed to load village name for web manifest:", error);
  }

  return {
    name: `Gram Panchayat ${villageName}`,
    short_name: `${villageName} Portal`,
    description: `Public services and information for Gram Panchayat ${villageName}.`,
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