"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/app/language-provider";

const getFriendlyAuthError = (authError) => {
  switch (authError) {
    case "CredentialsSignin":
    case "InvalidEmailOrPassword":
      return "Incorrect mobile/email or password.";
    case "Configuration":
      return "Authentication is currently unavailable. Please try again later.";
    default:
      return "Unable to sign in. Please try again.";
  }
};

export default function LoginPage() {
  const { labels } = useLanguage();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const authError = urlParams.get("error");
    if (authError) {
      setError(getFriendlyAuthError(authError));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!identifier || !password) {
      setError("Please enter your mobile/email and password");
      return;
    }

    setLoading(true);

    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    console.log("Attempting login with mobile/email:", { identifier: trimmedIdentifier, password: "***" });

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: trimmedIdentifier,
        password: trimmedPassword,
      });

      console.log("📝 SignIn response:", result);

      if (result?.error) {
        console.error("❌ Sign-in error:", result.error);
        setError(getFriendlyAuthError(result.error));
      } else if (result?.ok) {
        console.log("✅ Login successful!");
        // Redirect immediately with a welcome flag so the app can show a login animation.
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const callbackUrl = params.get("callbackUrl") || "/";
          const redirectUrl = new URL(callbackUrl, window.location.origin);
          redirectUrl.searchParams.set("welcome", "true");
          window.location.href = redirectUrl.toString();
        } else {
          router.push("/");
        }
      } else {
        console.error("⚠️ Unexpected response:", result);
        setError("Login failed. Please try again.");
      }
    } catch (err) {
      console.error("⚠️ Exception during login:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-11rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{labels.login}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{labels.registerAccount}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{labels.mobileOrEmail}</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
              required
              disabled={loading}
              placeholder={labels.mobileOrEmail}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{labels.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
              required
              disabled={loading}
              placeholder={labels.password}
              autoComplete="current-password"
            />
          </div>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
          <div className="mb-2">
            <Link href="/forgot-password" className="font-semibold text-teal-700 hover:text-teal-800 hover:underline dark:text-teal-300">
              {labels.forgotPassword}?
            </Link>
          </div>
          {labels.registerAccount}?{" "}
          <Link href="/register" className="font-semibold text-teal-700 hover:text-teal-800 hover:underline dark:text-teal-300">
            {labels.register}
          </Link>
        </div>
      </div>
    </div>
  );
}
