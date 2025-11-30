"use client";

export default function AadharPage() {
  return (
    <div className="pt-36 max-w-5xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-green-700 mb-6">
        Aadhar Create / Update
      </h1>
      <p className="text-gray-700 mb-6">
        Apply for new Aadhar card or update existing details.
      </p>

      <div className="bg-white rounded-lg shadow p-6">
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>New Aadhar Registration</li>
          <li>Address / Mobile Update</li>
          <li>Biometric Update</li>
        </ul>
      </div>
    </div>
  );
}