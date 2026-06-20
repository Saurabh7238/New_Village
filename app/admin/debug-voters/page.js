"use client";

import { useEffect, useState } from "react";

export default function DebugVotersPage() {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching from /api/voter-data?type=gram-panchayat");
        const response = await fetch("/api/voter-data?type=gram-panchayat");
        console.log("Response status:", response.status);

        const data = await response.json();
        console.log("Response data:", data);

        setApiData({
          status: response.status,
          data: data,
          count: Array.isArray(data) ? data.length : 0,
          isArray: Array.isArray(data),
          firstVoter: Array.isArray(data) && data.length > 0 ? data[0] : null,
        });
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">Debug Voters API</h1>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded mb-8">
          <h2 className="font-bold mb-2">❌ Error:</h2>
          <p>{error}</p>
        </div>
      )}

      {apiData && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">API Response Status</h2>
            <div className="space-y-2">
              <p><span className="font-semibold">Status Code:</span> {apiData.status}</p>
              <p><span className="font-semibold">Is Array:</span> {String(apiData.isArray)}</p>
              <p><span className="font-semibold">Total Count:</span> <span className="text-2xl font-bold text-green-600">{apiData.count}</span></p>
            </div>
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">First Voter Sample</h2>
            {apiData.firstVoter ? (
              <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto max-h-96 text-sm">
                {JSON.stringify(apiData.firstVoter, null, 2)}
              </pre>
            ) : (
              <p className="text-red-600">No voter data found</p>
            )}
          </div>

          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Raw API Response</h2>
            <details>
              <summary className="cursor-pointer font-semibold text-blue-600">Click to expand raw data</summary>
              <pre className="bg-gray-900 text-green-400 p-4 rounded mt-4 overflow-auto max-h-96 text-xs">
                {JSON.stringify(apiData.data, null, 2)}
              </pre>
            </details>
          </div>

          <div className="bg-blue-100 text-blue-800 p-4 rounded">
            <h2 className="font-bold mb-2">✅ Success!</h2>
            {apiData.count > 0 ? (
              <p>API is returning {apiData.count} voters. The database connection is working.</p>
            ) : (
              <p>API is working but returning 0 voters. Check if data was imported correctly.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
