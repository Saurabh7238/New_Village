"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useLanguage } from "@/app/language-provider";
import { Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpPending, setOtpPending] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const authError = urlParams.get("error");
    if (authError) {
      setError(getFriendlyAuthError(authError));
    }
  }, []);

  const redirectAfterLogin = () => {
    const params = new URLSearchParams(window.location.search);
    const callbackUrl = params.get("callbackUrl") || "/";
    const redirectUrl = new URL(callbackUrl, window.location.origin);
    redirectUrl.searchParams.set("welcome", "true");
    window.location.href = redirectUrl.toString();
  };

  const startOtpLogin = async () => {
    if (!identifier || !password) {
      setError("Please enter your mobile/email and password");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: identifier.trim(), password: password.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Unable to start sign-in. Please try again.");
        return;
      }
      setOtpEmail(data.email || "");
      setOtpPending(true);
    } catch (err) {
      console.error("Sign-in OTP request failed:", err);
      setError("Unable to start sign-in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!otpPending) {
      await startOtpLogin();
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit email code.");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: identifier.trim(),
        password: password.trim(),
        otp,
      });
      if (result?.ok) {
        redirectAfterLogin();
      } else {
        setError("The code is incorrect or expired. Try again or request a new code.");
      }
    } catch (err) {
      console.error("Sign-in verification failed:", err);
      setError("Unable to verify the code. Please try again.");
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
              disabled={loading || otpPending}
              placeholder={labels.mobileOrEmail}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{labels.password}</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-11 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
                required
                disabled={loading || otpPending}
                placeholder={labels.password}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-slate-500 hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 dark:text-slate-400 dark:hover:text-teal-300"
              >
                {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>
          </div>
          {otpPending && (
            <div className="space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Enter the 6-digit code sent to {otpEmail}.
              </p>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="loginOtp">
                Email verification code
                <input
                  id="loginOtp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm"
                  required
                  disabled={loading}
                />
              </label>
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? (otpPending ? "Verifying..." : "Sending code...") : (otpPending ? "Verify and sign in" : "Send verification code")}
          </button>
          {otpPending && (
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <button type="button" onClick={startOtpLogin} disabled={loading} className="font-semibold text-teal-700 hover:underline disabled:opacity-60 dark:text-teal-300">
                Send a new code
              </button>
              <button type="button" onClick={() => { setOtpPending(false); setOtp(""); setError(null); }} disabled={loading} className="font-semibold text-slate-600 hover:underline disabled:opacity-60 dark:text-slate-300">
                Use a different account
              </button>
            </div>
          )}
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
