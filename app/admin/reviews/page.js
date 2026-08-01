"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function AdminReviewsPage() {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState([]);
  const [reviewName, setReviewName] = useState("");
  const [reviewWard, setReviewWard] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    fetch("/api/reviews").then((res) => res.json()).then((data) => setReviews(Array.isArray(data) ? data : []));
  }, []);

  const addReview = async (e) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewMessage.trim()) {
      alert("Name and message are required.");
      return;
    }

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: reviewName, ward: reviewWard, message: reviewMessage }),
      });
      const newItem = await res.json();
      if (res.ok) {
        setReviews((prev) => [newItem, ...prev]);
        setReviewName("");
        setReviewWard("");
        setReviewMessage("");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const deleteReview = async (id) => {
    if (!confirm("Delete permanently?")) return;
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (status === "loading") return <div className="p-8 text-center">Loading...</div>;
  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-purple-700 dark:text-yellow-400">Manage Reviews</h1>
          <button onClick={() => signOut({ callbackUrl: "/?logout=true" })} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Sign Out</button>
        </div>

        <form onSubmit={addReview} className="mb-8 space-y-4 p-4 border rounded-lg bg-white dark:bg-gray-800">
          <h3 className="text-xl font-semibold text-purple-700 dark:text-yellow-400">Add Review</h3>
          <input className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Name" value={reviewName} onChange={(e) => setReviewName(e.target.value)} required />
          <input className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Ward (optional)" value={reviewWard} onChange={(e) => setReviewWard(e.target.value)} />
          <textarea className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Review message" value={reviewMessage} onChange={(e) => setReviewMessage(e.target.value)} required rows="4" />
          <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">Add Review</button>
        </form>

        <h2 className="text-2xl font-bold mb-4">Reviews ({reviews.length})</h2>
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border rounded p-4 flex justify-between items-start gap-4 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div>
                <p className="italic text-gray-800 dark:text-gray-200">&quot;{r.message}&quot;</p>
                <p className="text-sm font-semibold text-purple-700 dark:text-yellow-400 mt-2">— {r.name}{r.ward ? `, ${r.ward}` : ""}</p>
              </div>
              <button onClick={() => deleteReview(r.id)} className="text-red-500 hover:text-red-700 text-sm shrink-0">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
