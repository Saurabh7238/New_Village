import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">Page not found</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">That page does not exist</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">The link may be outdated or the page may have moved.</p>
        <Link href="/" className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
          <Home className="h-4 w-4" aria-hidden="true" />
          Go to homepage
        </Link>
      </section>
    </main>
  );
}
