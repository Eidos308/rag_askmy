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
  title: "AskMy",
  description: "Virtual Medical Assistant",
  icons: {
    icon: [
      { url: '/askmy-logo.jpeg', type: 'image/jpeg' },
    ],
    shortcut: ['/askmy-logo.jpeg'],
    apple: [
      { url: '/askmy-logo.jpeg' },
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/askmy-logo.jpeg',
      },
    ],
  },
  manifest: '/manifest.json'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/askmy-logo.jpeg" />
        <link rel="apple-touch-icon" href="/askmy-logo.jpeg" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans bg-gray-50`}>
        <main className="min-h-screen max-w-4xl mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
