"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function StreetLightDetails() {
    const [streetLights, setStreetLights] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Function to fetch infrastructure data
        const fetchStreetLights = async () => {
            try {
                const response = await fetch("/api/infrastructure");
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                // 1. Filter the data to show only 'Street Light' entries
                const filteredLights = data
                    .filter(item => item.type === "Street Light")
                    .map(item => ({
                        // Map database fields to the structure used for display
                        id: item._id,
                        location: item.location?.address || item.title,
                        date: item.installationDate ? new Date(item.installationDate).toLocaleDateString() : 'N/A',
                        cost: item.cost ? `₹${item.cost.toLocaleString('en-IN')}` : 'N/A',
                        // The 'image' field holds the Base64 data from the Admin panel
                        image: item.image || '/default-light.png', // Use a default image if none is set
                        type: item.type,
                        remarks: item.description || item.status,
                    }));
                
                setStreetLights(filteredLights);
            } catch (e) {
                console.error("Failed to fetch street light data:", e);
                setError("Failed to load infrastructure data. Check API route.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchStreetLights();
    }, []);

    if (isLoading) {
        return (
            <div className="pt-36 max-w-6xl mx-auto px-4 text-center">
                <p className="text-xl text-gray-500">Loading street light details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pt-36 max-w-6xl mx-auto px-4 text-center">
                <p className="text-xl text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="pt-36 max-w-6xl mx-auto px-4">
            <h1 className="text-2xl font-bold text-green-700 mb-4">Street Light Installations</h1>
            <p className="text-gray-700 mb-6">
                Detailed overview of street lights installed across the village, fetched from the database.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {streetLights.length === 0 ? (
                    <p className="col-span-3 text-lg text-gray-500">No street light infrastructure items found in the database.</p>
                ) : (
                    streetLights.map((light) => (
                        <div key={light.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
                            {/* IMPORTANT: When using Base64 data for 'src', Next.js <Image> needs the 'unoptimized' prop 
                                or the Base64 URI must be configured in next.config.js.
                                Using a regular <img> tag is simpler for Base64 data.
                            */}
                            {light.image && light.image.startsWith('data:image') ? (
                                <img
                                    src={light.image}
                                    alt={`Street light at ${light.location}`}
                                    className="rounded mb-3 object-cover w-full h-40"
                                />
                            ) : (
                                <Image
                                    src={light.image}
                                    alt={`Street light at ${light.location}`}
                                    width={400}
                                    height={250}
                                    className="rounded mb-3 object-cover w-full h-40"
                                />
                            )}
                            
                            <h2 className="text-lg font-semibold text-green-600">{light.location}</h2>
                            <p className="text-sm text-gray-700">📅 Installed on: {light.date}</p>
                            <p className="text-sm text-gray-700">💰 Cost: {light.cost}</p>
                            <p className="text-sm text-gray-700">💡 Type: {light.type}</p>
                            <p className="text-sm text-gray-700">🛠️ Remarks: {light.remarks}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}