import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";

import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const displayFont = Space_Grotesk({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const bodyFont = IBM_Plex_Sans({
  variable: "--font-body-face",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Niche Finder",
  description: "Community opportunity brief generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-body">
        <div className="mx-auto flex min-h-full w-full flex-col px-6 py-4 sm:py-5">
          <header className="print-hidden mb-4 flex items-center justify-between">
            <div className="font-display text-lg tracking-[0.08em] text-foreground">
              Niche Finder
            </div>
            <ThemeToggle />
          </header>
          <main className="flex flex-1 flex-col">{children}</main>
        </div>
      </body>
    </html>
  );
}
