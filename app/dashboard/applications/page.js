"use client";

import { Suspense } from 'react';
import EnhancedCitizenDashboard from '@/components/EnhancedCitizenDashboard';

function ApplicationsContent() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-bold text-green-700 dark:text-yellow-400">
          My Service Applications Dashboard
        </h1>
        <EnhancedCitizenDashboard />
      </div>
    </main>
  );
}

export default function MyApplicationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading dashboard...</div>}>
      <ApplicationsContent />
    </Suspense>
  );
}
