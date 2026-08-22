"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const getFriendlyAuthError = (authError) => {
  switch (authError) {
    case "CredentialsSignin":
    case "InvalidEmailOrPassword":
      return "Incorrect email or password.";
    case "Configuration":
      return "Authentication is currently unavailable. Please try again later.";
    default:
      return "Unable to sign in. Please try again.";
  }
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
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
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    console.log("📧 Attempting login with:", { email: trimmedEmail, password: "***" });

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: trimmedEmail,
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
          const callbackUrl = params.get("callbackUrl") || "/dashboard";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-green-200 bg-white p-8 shadow-xl shadow-green-100">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-green-800">Login</h1>
          <p className="mt-2 text-sm text-green-700/80">Access your Chiutahara Portal account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
              required
              disabled={loading}
              placeholder="your-email@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
              required
              disabled={loading}
              placeholder="Enter your password"
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
            className="w-full rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-green-700 hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
