import Link from "next/link";

export default function WeatherBadge() {
  return (
    <Link
      href="/weather"
      className="flex items-center gap-2 rounded-md bg-white/90 px-3 py-2 shadow-sm transition hover:scale-105 dark:bg-gray-800"
      title="Open weather forecast"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 text-green-700 dark:text-green-200"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 15a4 4 0 104 4h9a3 3 0 100-6 4 4 0 00-1-7 5 5 0 00-4 9H7a4 4 0 00-4 4z"
        />
      </svg>
      <span className="text-sm font-semibold text-green-800 dark:text-green-200">Weather</span>
    </Link>
  );
}
