"use client";

export default function BirthPage() {
  return (
    <div className="pt-36 max-w-5xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-green-700 mb-6">
        Birth Certificates
      </h1>
      <p className="text-gray-700 mb-6">
        Apply for new birth certificates or view issued certificates.
      </p>

      <div className="bg-white rounded-lg shadow p-6">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Child Name
            </label>
            <input type="text" className="mt-1 w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Date of Birth
            </label>
            <input type="date" className="mt-1 w-full border rounded p-2" />
          </div>
          <button
            type="submit"
            className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}