import type { Metadata, Viewport } from "next";
import { Montserrat, Marcellus } from "next/font/google";
import CartDrawer from "@/components/cart/CartDrawer";
import MetaPixel from "@/components/analytics/MetaPixel";
import TikTokPixel from "@/components/analytics/TikTokPixel";
import JsonLd from "@/components/seo/JsonLd";
import { getWebSiteSchema, getStoreSchema } from "@/lib/seo-schemas";
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
    default: "Halisi Gifts Shop - Original Luxury Watches, Perfumes & Gifts in Kenya",
    template: "%s | Halisi Gifts Shop",
  },
  description:
    "Halisi Gifts Shop is Kenya's premier store for 100% original luxury watches, authentic Arabian & designer perfumes, executive gift sets, and custom watch engraving. Shop genuine timepieces and original fragrances with customized wrappings and secure fast delivery across Kenya and shop pickup in Nairobi CBD.",
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
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
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
        url: `${siteUrl}/hero-bg.jpg`,
        width: 1200,
        height: 630,
        alt: "Halisi Gifts Shop - Original Luxury Watches and Authentic Perfumes in Kenya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Halisi Gifts Shop - Original Luxury Watches, Authentic Perfumes & Gifts in Kenya",
    description:
      "Shop 100% original luxury watches, authentic Arabian perfumes, custom engraving, customized wrappings, and executive gifts with secure and fast delivery in Kenya.",
    images: [`${siteUrl}/hero-bg.jpg`],
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
  const websiteSchema = getWebSiteSchema();
  const storeSchema = getStoreSchema();
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";
  const metaDomainVerification = process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION?.trim() || "";

  return (
    <html lang="en" className="light">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {metaDomainVerification && (
          <meta name="facebook-domain-verification" content={metaDomainVerification} />
        )}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap"
        />
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
