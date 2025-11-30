"use client";

export default function DevelopmentPage() {
  return (
    <div className="pt-36 max-w-5xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-green-700 mb-6">
        Development Projects
      </h1>

      <p className="text-gray-700 mb-6">
        View and manage ongoing & completed development projects under Gram Panchayat.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
          <h2 className="text-xl font-semibold text-green-600">New Road Construction</h2>
          <p className="text-sm text-gray-600">
            Status: In Progress  
            Budget: ₹5,00,000  
            Completion Date: March 2025
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
          <h2 className="text-xl font-semibold text-green-600">Irrigation Canal Repair</h2>
          <p className="text-sm text-gray-600">
            Status: Completed  
            Budget: ₹2,00,000  
            Completed on: August 2024
          </p>
        </div>
      </div>
    </div>
  );
}