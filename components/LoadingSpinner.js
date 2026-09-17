export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex min-h-[18rem] items-center justify-center px-4 py-10">
      <div className="text-center" role="status" aria-live="polite">
        <div className="mb-4 flex justify-center">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-teal-700 dark:border-t-teal-400"></div>
          </div>
        </div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          {message}
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Please wait while we fetch your information...
        </p>
      </div>
    </div>
  );
}
