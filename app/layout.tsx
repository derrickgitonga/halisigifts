import type { Metadata, Viewport } from "next";
import { Montserrat, Marcellus } from "next/font/google";
import CartDrawer from "@/components/cart/CartDrawer";
import MetaPixel from "@/components/analytics/MetaPixel";
import TikTokPixel from "@/components/analytics/TikTokPixel";
import JsonLd from "@/components/seo/JsonLd";
import { getOrganizationSchema, getWebSiteSchema, getStoreSchema } from "@/lib/seo-schemas";
import "./globals.css";

const bodyFont = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const headingFont = Marcellus({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: "400",
  display: "swap",
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisigifts.com").replace(/\/+$/, "");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Halisi Gifts | Original Watches & Gifts in Nairobi, Kenya",
    template: "%s | Halisi Gifts",
  },
  description:
    "Shop 100% authentic watches, Arabian perfumes, and curated gift sets in Kenya. Free gift wrapping, M-Pesa accepted, and same-day Nairobi delivery.",
  applicationName: "Halisi Gifts Shop",
  authors: [{ name: "Halisi Gifts Shop", url: siteUrl }],
  creator: "Halisi Gifts Shop",
  publisher: "Time Crew Ventures",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/icon.png?v=2", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: "/apple-icon.png?v=2",
  },
  keywords: [
    "Halisi Gifts Shop",
    "Original Luxury Watches Kenya",
    "Original Arabian Perfumes Kenya",
    "Authentic Perfumes Nairobi",
    "Original Lattafa Mousuf Asad Kenya",
    "Authentic Watches Nairobi",
    "Original Mens Luxury Watches",
    "Original Ladies Luxury Watches",
    "Luxury Watches Nairobi Kenya",
    "Customized Gift Wrappings Kenya",
    "Secure and Fast Delivery Across Kenya",
    "Custom Watch Engraving Nairobi",
    "Original Casio Naviforce Curren Poedagar Kenya",
    "Executive Gift Sets Kenya",
    "Accra Road Watch Shop Nairobi",
    "Lipa na Mpesa Watch Store",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Halisi Gifts Shop - Original Luxury Watches, Authentic Perfumes & Executive Gifts in Kenya",
    description:
      "Shop 100% original luxury watches, authentic Arabian perfumes, personalized custom engraving, executive gifts, and customized wrappings with secure and fast delivery across Kenya.",
    url: siteUrl,
    siteName: "Halisi Gifts Shop",
    locale: "en_KE",
    type: "website",
    images: [
      {
        url: `${siteUrl}/videos/hero-poster.jpg`,
        width: 1200,
        height: 630,
        alt: "Halisi Gifts - Authentic Wristwatches and Curated Gift Sets in Nairobi, Kenya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Halisi Gifts | Original Watches & Gifts in Nairobi, Kenya",
    description:
      "Shop 100% authentic watches, Arabian perfumes, and curated gift sets in Kenya. Free gift wrapping, M-Pesa accepted, and same-day Nairobi delivery.",
    images: [`${siteUrl}/videos/hero-poster.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = getOrganizationSchema();
  const websiteSchema = getWebSiteSchema();
  const storeSchema = getStoreSchema();
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";
  const metaDomainVerification = process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION?.trim() || "";

  return (
    <html lang="en" className="light">
      <head>
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        {metaDomainVerification && (
          <meta name="facebook-domain-verification" content={metaDomainVerification} />
        )}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap"
        />
        <JsonLd schema={organizationSchema} />
        <JsonLd schema={websiteSchema} />
        <JsonLd schema={storeSchema} />
      </head>
      <body
        className={`${bodyFont.variable} ${headingFont.variable} font-body antialiased selection:bg-secondary-fixed-dim selection:text-black`}
      >
        <MetaPixel pixelId={metaPixelId} />
        <TikTokPixel />
        {children}
        <CartDrawer />
      </body>
    </html>
  );
}
