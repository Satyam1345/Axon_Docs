import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Axon Docs",
  description: "Intelligent Document Analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white">{children}</body>
    </html>
  );
}