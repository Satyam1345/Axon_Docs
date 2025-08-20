// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/app/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adobe Hackathon 2025",
  description: "Adobe Hackathon 2025 App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-red-700">
        <Script src="/runtime-env.js" strategy="beforeInteractive" />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
