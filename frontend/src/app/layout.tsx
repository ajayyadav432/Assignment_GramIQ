import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "Krishi Clinic — Crop Disease Advisory",
  description:
    "AI-powered crop disease diagnosis dashboard. Upload crop images, get instant predictions, and track agricultural health analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppProvider>
          <div className="app-shell">
            {/* Persistent sidebar (desktop) */}
            <Sidebar />
            {/* Main content area */}
            <main className="app-main" style={{ paddingTop: "0" }}>
              {/* On mobile the topbar is fixed — push content below it */}
              <div className="mobile-topbar-spacer" style={{ height: 0 }} />
              {children}
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
