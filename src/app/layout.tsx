import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Move — Tampa",
  description: "Stop searching. Know the move. See what's worth doing in Tampa, ranked for you.",
  openGraph: {
    title: "The Move — Tampa",
    description: "Stop searching. Know the move. See what's worth doing in Tampa, ranked for you.",
    type: "website",
  },
  metadataBase: undefined,
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950">{children}</body>
    </html>
  );
}
