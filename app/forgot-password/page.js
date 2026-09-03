"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/language-provider";

export default function ForgotPasswordPage() {
  const { labels } = useLanguage();
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetPassword = async () => {
    setError("");
    setSuccess("");

    if (!/^\d{12}$/.test(aadhaarNumber.replace(/\s|-/g, ""))) {
      setError("Enter a valid 12-digit Aadhaar number");
      return;
    }

    if (!dateOfBirth) {
      setError("Date of birth is required");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aadhaarNumber,
          dateOfBirth,
          password: newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to reset password");
        return;
      }

      setSuccess("Password reset successfully. Redirecting to sign in...");
      setTimeout(() => {
        window.location.href = "/signin";
      }, 1600);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-green-200 bg-white p-8 shadow-xl shadow-green-100">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-green-800">{labels.forgotPassword}</h1>
          <p className="mt-2 text-sm text-green-700/80">
            Verify with Aadhaar and date of birth to reset your password
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{labels.aadhaarNumber}</label>
            <input
              type="text"
              value={aadhaarNumber}
              onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
              placeholder="12-digit Aadhaar number"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{labels.dateOfBirth}</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{labels.newPassword}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
              placeholder="Enter new password"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{labels.confirmPassword}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
              placeholder="Confirm new password"
              disabled={loading}
            />
          </div>

          <button
            type="button"
            onClick={resetPassword}
            disabled={loading}
            className="w-full rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Resetting..." : labels.resetPassword}
          </button>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          <Link href="/signin" className="font-semibold text-green-700 hover:underline">
            {labels.backToSignIn}
          </Link>
        </div>
      </div>
    </div>
  );
}
