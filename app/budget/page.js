"use client";

export default function BudgetPage() {
  return (
    <div className="pt-36 max-w-5xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-green-700 mb-6">
        Gram Panchayat Budget
      </h1>

      <p className="text-gray-700 mb-6">
        Here you can view and manage the Gram Panchayat’s annual budget allocations,
        expenses, and upcoming financial plans.
      </p>

      {/* Example Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow p-4">
        <table className="table-auto w-full text-left">
          <thead>
            <tr className="bg-green-100">
              <th className="px-4 py-2">Year</th>
              <th className="px-4 py-2">Allocated Budget</th>
              <th className="px-4 py-2">Spent</th>
              <th className="px-4 py-2">Remaining</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-green-50">
              <td className="px-4 py-2">2024-25</td>
              <td className="px-4 py-2">₹10,00,000</td>
              <td className="px-4 py-2">₹7,00,000</td>
              <td className="px-4 py-2">₹3,00,000</td>
            </tr>
            <tr className="border-b hover:bg-green-50">
              <td className="px-4 py-2">2023-24</td>
              <td className="px-4 py-2">₹8,50,000</td>
              <td className="px-4 py-2">₹8,00,000</td>
              <td className="px-4 py-2">₹50,000</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}