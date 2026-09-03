"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    fatherName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    ward: "",
    aadhaarNumber: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.fatherName.trim()) {
      setError("Father's name is required");
      return;
    }
    if (!formData.email || !formData.email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    if (!formData.phone || formData.phone.replace(/\D/g, "").length < 10) {
      setError("Valid 10-digit mobile number is required");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!formData.ward) {
      setError("Ward number is required");
      return;
    }
    if (formData.aadhaarNumber.replace(/\D/g, "").length !== 12) {
      setError("Enter a valid 12-digit Aadhaar number");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          fatherName: formData.fatherName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          ward: formData.ward,
          aadhaarNumber: formData.aadhaarNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      setSuccess("Registration successful. Please login to continue.");
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50 py-12 px-4">
      <div className="w-full max-w-sm rounded-xl border border-green-200 bg-white p-8 shadow-xl shadow-green-100">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-green-800">Register</h1>
          <p className="mt-2 text-sm text-green-700/80">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Father&apos;s Name</label>
            <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200" placeholder="Enter father&apos;s name" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Ward Number</label>
            <input type="number" min="1" max="50" name="ward" value={formData.ward} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mobile Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
              placeholder="10-digit mobile number"
              maxLength={10}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Aadhaar Number</label>
            <input type="password" inputMode="numeric" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value.replace(/\D/g, "").slice(0, 12) })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200" placeholder="12-digit Aadhaar number" maxLength={12} required />
            <p className="mt-1 text-xs text-gray-500">Stored securely; it will never be displayed in full.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
              placeholder="Enter password (min 6 characters)"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
              placeholder="Confirm your password"
              required
            />
          </div>

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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md border border-transparent bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <div className="text-center mt-4 text-sm">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-green-700 hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
