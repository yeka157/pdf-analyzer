import type { Metadata } from "next";
import { Instrument_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance, clerkLocalization } from "@/lib/clerkAppearance";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Digest",
  description:
    "Upload a document and read a summary you can finish in a minute.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // next-themes writes the theme class on <html> before paint, which React
    // cannot know about during hydration.
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${instrumentSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ClerkProvider
            appearance={clerkAppearance}
            localization={clerkLocalization}
          >
            <Navbar />
            {children}
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
