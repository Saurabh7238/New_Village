import Image from "next/image";
import { useLanguage } from "@/app/language-provider";

export default function VidhanSabhaBanner() {
  const { language } = useLanguage();
  const isHindi = language === "hi";

  return (
    <div className="w-full bg-green-50 border border-green-200 rounded-lg shadow-md overflow-hidden mb-8">
      <Image
        src="/vidhansabha.png"
        alt={isHindi ? "विधानसभा चित्र बैनर" : "Vidhan Sabha illustration banner"}
        width={1200}
        height={256}
        className="w-full h-64 object-cover"
      />
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold text-green-700">{isHindi ? "विधानसभा पोर्टल" : "Legislative Assembly Portal"}</h2>
        <p className="text-sm text-gray-600 mt-1">
          {isHindi ? "लोकतंत्र का उत्सव – मतदाता सूची और जानकारी" : "Celebrating democracy – voter lists and information"}
        </p>
      </div>
    </div>
  );
}