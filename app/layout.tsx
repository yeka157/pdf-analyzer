import type { Metadata } from "next";
import { Geist_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/navbar";
import ThemeProvider from "@/components/theme/theme-provider";
import { clerkAppearance, clerkLocalization } from "@/lib/clerk-appearance";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  description:
    "Upload a document and read a summary you can finish in a minute.",
  title: "Digest",
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
