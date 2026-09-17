"use client";

import { useEffect } from "react";
import Button from "@/components/Button";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm dark:border-red-900 dark:bg-slate-900">
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">This page could not load</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Please try again. Your saved information and account data have not been changed.</p>
        <Button type="button" onClick={() => reset()} className="mt-5">Try again</Button>
      </section>
    </main>
  );
}
