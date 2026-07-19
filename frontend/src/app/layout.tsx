import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "Krishi Clinic Lite — Crop Disease Advisory",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppProvider>
          <Navbar />
          <main>{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
