import "./globals.css";
import Header from "../components/Header";
import Providers from "./auth-provider";
import ScrollToTopButton from "../components/ScrollToTopButton";

export const metadata = {
  title: "Gram Panchayat Portal",
  description: "Manage Gram Panchayat information",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = theme ? theme === 'dark' : prefersDark;
                if (isDark) document.documentElement.classList.add('dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 text-gray-900 font-sans relative dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950 dark:text-gray-100 transition-colors">
        <Providers>
          <noscript>
            <div className="bg-red-100 text-red-700 text-center p-2 text-sm">
              This site works best with JavaScript enabled.
            </div>
          </noscript>
          <Header />
          <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-center py-2 text-sm font-medium transition-colors">
            📢 New voter list available! Check the updates in the Voter section.
          </div>
          <main className="max-w-6xl mx-auto px-4 pt-36 pb-8">{children}</main>
          <ScrollToTopButton />
          <footer className="bg-gradient-to-r from-green-700 via-green-600 to-green-500 dark:from-green-900 dark:via-green-800 dark:to-green-700 text-white mt-8">
            <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm">
              © {new Date().getFullYear()} Gram Panchayat Portal
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}