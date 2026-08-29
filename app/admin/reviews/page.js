"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

export default function AdminReviewsPage() {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch("/api/reviews").then((res) => res.json()).then((data) => setReviews(Array.isArray(data) ? data : []));
  }, []);

  const moderateReview = async (id, nextStatus) => {
    try {
      const res = await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const updated = await res.json();
      if (res.ok) {
        setReviews((prev) => prev.map((review) => review.id === id ? updated : review));
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

  const approvedReviews = reviews.filter((review) => review.status === "approved" || (!review.status && review.approved));
  const averageRating = approvedReviews.length
    ? (approvedReviews.reduce((total, review) => total + (review.rating || 0), 0) / approvedReviews.length).toFixed(1)
    : "-";
  const groupedRatings = (getKey) => Object.entries(approvedReviews.reduce((groups, review) => {
    const key = getKey(review);
    const group = groups[key] || { total: 0, count: 0 };
    group.total += review.rating || 0;
    group.count += 1;
    groups[key] = group;
    return groups;
  }, {})).map(([key, group]) => ({ key, average: (group.total / group.count).toFixed(1), count: group.count })).sort((a, b) => b.count - a.count);
  const byService = groupedRatings((review) => review.serviceType || review.relatedType || "Portal");
  const byWard = groupedRatings((review) => review.ward || "Not specified");
  const byMonth = groupedRatings((review) => new Date(review.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }));

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

        <div className="mb-8 rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-100">
          New citizen reviews remain pending until an administrator approves them. Only approved reviews appear on the home page.
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800"><p className="text-sm text-gray-500">Average satisfaction</p><p className="mt-1 text-3xl font-bold text-amber-500">{averageRating} / 5</p><p className="text-xs text-gray-500">{approvedReviews.length} approved reviews</p></div>
          {[['By service', byService], ['By ward', byWard], ['By month', byMonth]].map(([title, groups]) => <div key={title} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800"><p className="mb-2 font-semibold">{title}</p>{groups.length ? groups.slice(0, 5).map((group) => <p key={group.key} className="flex justify-between gap-2 text-sm"><span className="capitalize">{group.key.replace(/-/g, ' ')}</span><span className="font-semibold text-amber-500">{group.average} ({group.count})</span></p>) : <p className="text-sm text-gray-500">No approved data</p>}</div>)}
        </div>

        <h2 className="text-2xl font-bold mb-4">Reviews ({reviews.length})</h2>
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border rounded p-4 flex justify-between items-start gap-4 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${r.status === "approved" ? "bg-green-100 text-green-800" : r.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{r.status || (r.approved ? "approved" : "pending")}</span>
                  <span className="text-amber-500">{"★".repeat(r.rating || 0)}{"☆".repeat(5 - (r.rating || 0))}</span>
                </div>
                <p className="italic text-gray-800 dark:text-gray-200">&quot;{r.message}&quot;</p>
                {r.reasons?.length > 0 && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Reasons: {r.reasons.join(", ")}</p>}
                {r.outcome === "not-resolved" && <p className="mt-1 text-sm font-semibold text-orange-600">Citizen marked this case as not resolved.</p>}
                <p className="text-sm font-semibold text-purple-700 dark:text-yellow-400 mt-2">— {r.name}{r.ward ? `, ${r.ward}` : ""}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 text-sm">
                {r.status !== "approved" && <button onClick={() => moderateReview(r.id, "approved")} className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700">Approve</button>}
                {r.status !== "rejected" && <button onClick={() => moderateReview(r.id, "rejected")} className="rounded bg-orange-600 px-3 py-1 text-white hover:bg-orange-700">Reject</button>}
                <button onClick={() => deleteReview(r.id)} className="text-red-500 hover:text-red-700">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
