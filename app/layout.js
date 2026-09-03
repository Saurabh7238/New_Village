import "./globals.css";
import Header from "../components/Header";
import Providers from "./auth-provider";
import ScrollToTopButton from "../components/ScrollToTopButton";
import WelcomeToast from "../components/WelcomeToast";
import ChatWidget from "../components/ChatWidget";
import { LanguageProvider } from "./language-provider";

export const metadata = {
  title: "Gram Panchayat Chiutahara",
  description: "Manage Gram Panchayat information for Chiutahra",
  referrer: "no-referrer-when-downgrade",
  other: {
    "ea9456cfebe0b9f15eb7": "7332b2c0c97e285c3aca",
  },
  icons: {
    icon: "/favicon .ico",
    shortcut: "/favicon .ico",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gram Panchayat",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#059669",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Gram Panchayat Chiutahara",
              url: "https://www.grampanchayatchiutahara.online",
              logo: "https://www.grampanchayatchiutahara.online/favicon .ico",
              sameAs: [],
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = theme ? theme === 'dark' : prefersDark;
                if (isDark) document.documentElement.classList.add('dark');
                if (localStorage.getItem('text-size-large') === 'true') document.documentElement.classList.add('text-size-large');
                if (localStorage.getItem('high-contrast') === 'true') document.documentElement.classList.add('high-contrast');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 text-gray-900 font-sans relative dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950 dark:text-gray-100 transition-colors">
        <Providers>
          <LanguageProvider>
            <noscript>
              <div className="bg-red-100 text-red-700 text-center p-2 text-sm">
                This site works best with JavaScript enabled.
              </div>
            </noscript>
            <Header />
            <main className="mx-auto max-w-6xl px-4 pt-[6.75rem] sm:pt-[7.5rem]">
              <WelcomeToast />
              {children}
            </main>
            <ScrollToTopButton />
            <ChatWidget />
            <footer className="bg-gradient-to-r from-green-700 via-green-600 to-green-500 dark:from-green-900 dark:via-green-800 dark:to-green-700 text-white">
                <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm">
                © {new Date().getFullYear()} Gram Panchayat Chiutahara
              </div>
            </footer>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
