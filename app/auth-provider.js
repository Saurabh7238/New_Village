"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "./theme-provider";
import { SocketProvider } from "./socket-provider";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}