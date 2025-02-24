import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AskMy - Virtual Medical Assistant",
  description: "AI-powered virtual medical assistant to help with your health inquiries. Get reliable medical information and guidance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans bg-gray-50`}>
        <main className="min-h-screen max-w-4xl mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
