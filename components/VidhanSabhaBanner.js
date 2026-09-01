import Image from "next/image";

export default function VidhanSabhaBanner() {
  return (
    <div className="w-full bg-green-50 border border-green-200 rounded-lg shadow-md overflow-hidden mb-8">
      <Image
        src="/vidhansabha.png"
        alt="Vidhan Sabha Cartoon Banner"
        width={1200}
        height={256}
        className="w-full h-64 object-cover"
      />
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold text-green-700">विधानसभा पोर्टल</h2>
        <p className="text-sm text-gray-600 mt-1">
          लोकतंत्र का उत्सव – मतदाता सूची और जानकारी
        </p>
      </div>
    </div>
  );
}