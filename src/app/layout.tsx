import type { Metadata } from "next";
import { Emilys_Candy, Geist, Geist_Mono, Nanum_Pen_Script } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nanumPenScript = Nanum_Pen_Script({
  variable: "--font-nanum-pen",
  weight: "400",
  subsets: ["latin"],
});

const emilysCandy = Emilys_Candy({
	variable: "--font-emilys-candy",
	weight: "400",
	subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Decyzjomat",
    template: "%s | Decyzjomat",
  },
  description:
    "Decyzjomat to szybka, lekka gra w decyzje: karty, głosowanie i tryby w stylu randki w ciemno oraz quiz „Gusta”.",
  applicationName: "Decyzjomat",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: "/",
    siteName: "Decyzjomat",
    title: "Decyzjomat",
    description:
      "Szybka, lekka gra w decyzje: karty, głosowanie i quiz „Gusta”. Idealne na wieczór ze znajomymi.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Decyzjomat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Decyzjomat",
    description:
      "Szybka, lekka gra w decyzje: karty, głosowanie i quiz „Gusta”.",
    images: ["/twitter-image"],
  },
  icons: {
    icon: [
      { url: "/icons/16", sizes: "16x16", type: "image/png" },
      { url: "/icons/32", sizes: "32x32", type: "image/png" },
      { url: "/icons/48", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
	<html lang="pl">
      <body
  		className={`${geistSans.variable} ${geistMono.variable} ${nanumPenScript.variable} ${emilysCandy.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
			<Analytics />
      </body>
    </html>
  );
}
