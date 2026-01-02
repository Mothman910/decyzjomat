import type { Metadata } from "next";
import { Emilys_Candy, Geist, Geist_Mono, Nanum_Pen_Script } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const PRODUCTION_SITE_URL = "https://decyzjomat.vercel.app";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_ENV === 'production'
    ? PRODUCTION_SITE_URL
    : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"));

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
  metadataBase: new URL(siteUrl),
  title: {
    default: "Decyzjomat - apka do inspirowania par 💘",
    template: "%s | Decyzjomat",
  },
  description:
    "Apka miała być do wspólnego wybierania filmów lecz dodałem to i owo. Zachęcam do skorzystania w leniwe wieczory Jest też tryb do porównywania zgodności gustów i krótki test, który analizuje wasze wybory. Przetestujcie z drugą połówką — feedback mile widziany. :)" ,
  applicationName: "Decyzjomat",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: new URL('/', siteUrl).toString(),
    siteName: "Decyzjomat",
    title: "Decyzjomat - apka do inspirowania par 💘",
    description:
      "Zrobiłem to narzędzie, żeby nie kłócić się o wybór filmu. Jest też tryb do porównywania zgodności gustów i krótki test, który analizuje wasze wybory. Przetestujcie z drugą połówką — feedback mile widziany. :)" ,
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Decyzjomat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Decyzjomat - apka do inspirowania par 💘",
    description:
      "Zrobiłem to narzędzie, żeby nie kłócić się o wybór filmu. Jest też tryb do porównywania zgodności gustów i krótki test analizujący wasze wybory. Feedback mile widziany. :)" ,
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
