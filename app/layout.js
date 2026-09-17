import "./globals.css";
import Header from "../components/Header";
import Providers from "./auth-provider";
import ScrollToTopButton from "../components/ScrollToTopButton";
import WelcomeToast from "../components/WelcomeToast";
import ChatWidget from "../components/ChatWidget";
import PwaRegistration from "../components/PwaRegistration";
import { LanguageProvider } from "./language-provider";

export const metadata = {
  metadataBase: new URL("https://www.grampanchayatchiutahara.online"),
  title: {
    default: "Gram Panchayat Chiutahara",
    template: "%s | Gram Panchayat Chiutahara",
  },
  description: "Access citizen services, certificates, notices, development updates, and local governance information for Gram Panchayat Chiutahara.",
  applicationName: "Gram Panchayat Chiutahara Portal",
  keywords: ["Gram Panchayat", "Chiutahara", "citizen services", "local governance"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Gram Panchayat Chiutahara",
    title: "Gram Panchayat Chiutahara",
    description: "Digital access to Gram Panchayat Chiutahara services and information.",
    url: "https://www.grampanchayatchiutahara.online",
    images: [{ url: "/favicon.png", width: 512, height: 512, alt: "Gram Panchayat Chiutahara" }],
  },
  twitter: {
    card: "summary",
    title: "Gram Panchayat Chiutahara",
    description: "Digital access to Gram Panchayat Chiutahara services and information.",
    images: ["/favicon.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  referrer: "no-referrer-when-downgrade",
  other: {
    "ea9456cfebe0b9f15eb7": "7332b2c0c97e285c3aca",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
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
  themeColor: "#0f766e",
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
              logo: "https://www.grampanchayatchiutahara.online/favicon.png",
              sameAs: [],
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const isDark = theme === 'dark';
                if (isDark) document.documentElement.classList.add('dark');
                if (localStorage.getItem('text-size-large') === 'true') document.documentElement.classList.add('text-size-large');
                if (localStorage.getItem('high-contrast') === 'true') document.documentElement.classList.add('high-contrast');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans relative dark:bg-slate-950 dark:text-slate-100 transition-colors">
        <Providers>
          <LanguageProvider>
            <noscript>
              <div className="bg-red-100 text-red-700 text-center p-2 text-sm">
                This site works best with JavaScript enabled.
              </div>
            </noscript>
            <Header />
            <PwaRegistration />
            <main className="mx-auto min-h-[calc(100vh-10rem)] max-w-6xl px-4 pb-8 pt-[7.25rem] sm:pt-[7.5rem]">
              <WelcomeToast />
              {children}
            </main>
            <ScrollToTopButton />
            <ChatWidget />
            <footer className="border-t border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <div className="mx-auto max-w-6xl px-4 py-5 text-center text-sm">
                © {new Date().getFullYear()} Gram Panchayat Chiutahara
              </div>
            </footer>
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
