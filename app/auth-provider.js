"use client";

import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "./theme-provider";
import { SocketProvider } from "./socket-provider";

export default function Providers({ children }) {
  const pathname = usePathname();
  const needsRealtime = pathname === "/dashboard/applications";

  return (
    <ThemeProvider>
      <SessionProvider>
        {needsRealtime ? <SocketProvider>{children}</SocketProvider> : children}
      </SessionProvider>
    </ThemeProvider>
  );
}