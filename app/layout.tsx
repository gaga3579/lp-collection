import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
// Dynamic-subset Pretendard: ~100 unicode-range slices so Korean glyphs load
// on demand instead of one multi-megabyte file. Latin stays Instrument Sans.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Vinyl Archive",
  description: "A personal collection of LP vinyl records.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${instrumentSans.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
