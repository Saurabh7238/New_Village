import DottedSpinner from "@/components/DottedSpinner";

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex min-h-[18rem] items-center justify-center px-4 py-10">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <DottedSpinner label={message} />
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
