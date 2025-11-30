"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false); // New loading state
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true); // Start loading

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = "Registration failed.";

        // 💡 CRITICAL FIX: Safely attempt to parse JSON response on error
        // Read the response as text first, then parse it if content exists.
        const responseText = await response.text();
        
        try {
          if (responseText) {
            const data = JSON.parse(responseText);
            // Use the message from the backend, or fall back to a generic one
            errorMessage = data.message || errorMessage;
          } else if (response.status === 500) {
            // If empty body on 500 status, suggest a server issue
            errorMessage = "Server error occurred. Please try again later.";
          }
        } catch (parseError) {
          // This catches the 'Unexpected end of JSON input' error
          console.error("Error parsing API response:", parseError);
          // Fall back to a generic error message
          errorMessage = "An unexpected error occurred. Please check server logs.";
        }
        
        setError(errorMessage);
        return;
      }
      
      // Success case
      setSuccessMessage("Registration successful! Redirecting to sign-in...");
      // Optionally clear form fields on success
      setEmail('');
      setPassword('');

      setTimeout(() => {
        router.push("/signin");
      }, 2000);

    } catch (err) {
      console.error("Registration Network or Fetch Error:", err);
      setError("A network connection error occurred.");
    } finally {
      setLoading(false); // Stop loading regardless of success/fail
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // Added onFocus to clear messages when user interacts
              onFocus={() => { setError(null); setSuccessMessage(null); }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => { setError(null); setSuccessMessage(null); }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            />
          </div>

          {/* Messages */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}
          
          <button
            type="submit"
            disabled={loading} // Disable button when loading
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <div className="text-center mt-4 text-sm">
          Already have an account?{" "}
          <Link href="/signin" className="text-indigo-600 hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}