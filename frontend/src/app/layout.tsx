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
            <Sidebar />
            <main className="app-main">
              {children}
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
