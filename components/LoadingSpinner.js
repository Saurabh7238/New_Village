export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
      <div className="text-center">
        {/* Animated spinner */}
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-green-200 dark:border-green-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-600 dark:border-t-green-400 animate-spin"></div>
          </div>
        </div>

        {/* Loading text */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {message}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please wait while we fetch your information...
        </p>

        {/* Animated dots */}
        <div className="mt-4 flex justify-center gap-1">
          <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
          <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
          <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
        </div>
      </div>
    </div>
  );
}
