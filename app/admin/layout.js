"use client";

import { useSession } from "next-auth/react";

export default function AdminLayout({ children }) {
  const { data: session } = useSession();

  return (
    <>
      {session?.user?.role === "subadmin" && (
        <aside role="status" className="mx-auto max-w-6xl border-x border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          Sub-admin mode: service edits are submitted for main-admin approval and will not take effect until approved.
        </aside>
      )}
      {children}
    </>
  );
}
