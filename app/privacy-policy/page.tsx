import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Halisi Gifts Shop Nairobi Kenya",
  description:
    "Read the Privacy Policy of Halisi Gifts Shop. Learn how we collect, use, protect, and handle your personal data in compliance with the Kenya Data Protection Act, 2019.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "August 19, 2026";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="w-full flex-grow max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-display-lg text-3xl md:text-display-lg text-black">
            Privacy Policy
          </h1>
          <p className="text-sm text-black/60">
            Last Updated: {lastUpdated}
          </p>
        </div>

        <div className="bg-white p-6 md:p-10 border border-black/10 rounded-lg space-y-8 text-sm text-black/80 leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-headline-md text-lg md:text-xl text-black">
              1. Overview and Data Controller
            </h2>
            <p>
              Halisi Gifts Shop, operated under Time Crew Ventures, is committed to safeguarding the privacy of every visitor and customer. This Privacy Policy outlines our practices concerning the collection, usage, storage, sharing, and protection of your personal information when you visit our website, purchase products, or interact with our services.
            </p>
            <p>
              By accessing our website, placing an order, or communicating with us via phone, email, or WhatsApp, you acknowledge and agree to the practices described in this policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline-md text-lg md:text-xl text-black">
              2. Applicable Law and Regulatory Compliance
            </h2>
            <p>
              We operate within the Republic of Kenya and strictly comply with the provisions of the <strong>Kenya Data Protection Act, 2019</strong>, along with regulations and guidance issued by the Office of the Data Protection Commissioner (ODPC). Where relevant for international customers, we uphold universally recognized data protection principles including transparency, purpose limitation, data minimization, and accuracy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline-md text-lg md:text-xl text-black">
              3. Information We Collect
            </h2>
            <p>
              We collect information necessary to fulfill orders, provide customer care, customize products, and improve your shopping experience. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Contact Information:</strong> Your full name, phone number, email address, physical delivery address, and Kenyan county or city.
              </li>
              <li>
                <strong>Order and Customization Details:</strong> Items purchased, quantities, gift instructions, and custom engraving text provided for watches or accessories.
              </li>
              <li>
                <strong>Payment and Transaction Information:</strong> Lipa na M-Pesa transaction reference codes, payment timestamps, and amounts paid. <em>Please note: We do not collect, process, or store your private M-Pesa PIN, credit card CVV codes, or personal banking credentials.</em>
              </li>
              <li>
                <strong>Communication Records:</strong> Queries, inquiries, and messages submitted through our contact form, direct phone calls, or our WhatsApp customer assistance channel.
              </li>
              <li>
                <strong>Technical and Usage Data:</strong> Internet Protocol (IP) address, browser type, device information, operating system, pages viewed, time spent on pages, and referral sources.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline-md text-lg md:text-xl text-black">
              4. How We Use Your Information
            </h2>
            <p>
              Your personal data is used solely for legitimate business purposes, including:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Processing and fulfilling your orders, packaging gift boxes, and performing requested engraving.</li>
              <li>Coordinating same-day rider dispatches within Nairobi and countrywide courier shipments across Kenya.</li>
              <li>Sending order status updates, delivery alerts, and customer service follow-ups.</li>
              <li>Verifying payments and preventing fraudulent transactions.</li>
              <li>Analyzing website traffic and usage patterns to optimize performance and navigation.</li>
              <li>Complying with statutory accounting, tax, and legal obligations under Kenyan law.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline-md text-lg md:text-xl text-black">
              5. Legal Grounds for Processing
            </h2>
            <p>
              In accordance with Section 30 of the Kenya Data Protection Act, 2019, our lawful bases for collecting and processing your personal data include:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Performance of a Contract:</strong> Processing necessary to fulfill your purchase order and deliver purchased goods.
              </li>
              <li>
                <strong>Consent:</strong> Explicit permission provided when you opt into marketing updates or contact us directly.
              </li>
              <li>
                <strong>Legal Obligation:</strong> Maintaining transaction histories for tax reporting and regulatory compliance.
              </li>
              <li>
                <strong>Legitimate Interests:</strong> Protecting our systems against fraud, auditing business performance, and improving service quality.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline-md text-lg md:text-xl text-black">
              6. Sharing of Personal Data
            </h2>
            <p>
              We do not sell, rent, trade, or lease your personal information to any third parties for their independent marketing purposes. We only share necessary data with trusted service providers strictly to execute our services:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Couriers and Delivery Riders:</strong> Your recipient name, phone number, and address are shared with delivery partners (such as Nairobi dispatch riders or countrywide bus and parcel couriers) solely for parcel delivery.
              </li>
              <li>
                <strong>Payment Facilitators:</strong> Safaricom M-Pesa to verify payment status and reconcile transaction references.
              </li>
              <li>
                <strong>Cloud Hosting and Infrastructure:</strong> Secure database and hosting providers that maintain our digital infrastructure with strict confidentiality agreements.
              </li>
              <li>
                <strong>Law Enforcement or Legal Authorities:</strong> Only when strictly required by a court order, statute, or authorized government regulator under Kenyan law.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline-md text-lg md:text-xl text-black">
              7. Cookies, Pixels, and Analytics
            </h2>
            <p>
              Our website uses cookies and tracking technologies to enhance user experience, remember cart selections, and measure marketing campaigns. These include:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Essential Cookies:</strong> Required for the basic operation of the website, including session management and shopping cart functionality.
              </li>
              <li>
                <strong>Marketing and Analytics Pixels:</strong> We utilize the Meta (Facebook) Pixel and TikTok Pixel to understand user engagement and measure the effectiveness of our advertisements. These pixels collect pseudonymized technical event data such as page views and purchase completions.
              </li>
            </ul>
            <p>
              You can control or disable cookies through your browser settings. Opting out of cookies may affect certain interactive features of our store.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline-md text-lg md:text-xl text-black">
              8. Data Retention and Security
            </h2>
            <p>
              We implement industry-standard physical, electronic, and procedural safeguards to secure your personal data against unauthorized access, loss, alteration, or misuse. All website transmissions are encrypted using Transport Layer Security (TLS/SSL).
            </p>
            <p>
              We retain personal data only for as long as necessary to fulfill the purposes for which it was collected, resolve disputes, satisfy warranty obligations, and comply with Kenya Revenue Authority (KRA) accounting records retention regulations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline-md text-lg md:text-xl text-black">
              9. Your Statutory Rights
            </h2>
            <p>
              Under the Kenya Data Protection Act, 2019, you hold the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Right to be Informed:</strong> To know what personal data is collected and how it is processed.
              </li>
              <li>
                <strong>Right of Access:</strong> To request a copy of the personal data we hold about you.
              </li>
              <li>
                <strong>Right to Rectification:</strong> To request immediate correction of inaccurate, outdated, or incomplete data.
              </li>
              <li>
                <strong>Right to Erasure:</strong> To request the deletion of your personal data, subject to legal and statutory record-keeping constraints.
              </li>
              <li>
                <strong>Right to Object:</strong> To object to the processing of your data for direct marketing purposes.
              </li>
              <li>
                <strong>Right to Lodge a Complaint:</strong> To lodge a formal complaint with the Office of the Data Protection Commissioner (ODPC) of Kenya if you believe your rights have been infringed.
              </li>
            </ul>
            <p>
              To exercise any of these rights, please contact us using the information provided in Section 14 below.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline-md text-lg md:text-xl text-black">
              10. Customer Responsibilities and Custom Engraving
            </h2>
            <p>
              When requesting personalized watch or accessory engraving, you are solely responsible for ensuring the accuracy, spelling, and legality of the text submitted. Halisi Gifts Shop is not liable for errors, typos, or omissions in custom text provided by the customer.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline-md text-lg md:text-xl text-black">
              11. Third-Party Links
            </h2>
            <p>
              Our website may contain links to third-party services, including Google Maps, Safaricom M-Pesa portals, WhatsApp, and social media platforms. We do not control and are not responsible for the privacy practices, content, or terms of third-party websites. We encourage you to review their respective privacy notices.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline-md text-lg md:text-xl text-black">
              12. Age Limitation
            </h2>
            <p>
              Our services are intended for individuals who are at least 18 years of age. We do not knowingly collect personal data from minors without parental or legal guardian consent. If you believe a minor has provided us with personal data, please reach out to us immediately for removal.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline-md text-lg md:text-xl text-black">
              13. Policy Updates
            </h2>
            <p>
              We may update this Privacy Policy periodically to reflect changes in our operational practices or legal requirements. Any modifications will be posted on this page with an updated revision date. Your continued use of our services following an update constitutes acceptance of the revised policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-headline-md text-lg md:text-xl text-black">
              14. Contact Information and Privacy Inquiries
            </h2>
            <p>
              If you have any questions, requests, or concerns regarding this Privacy Policy or how your personal information is handled, please contact our Data Protection representative:
            </p>
            <div className="bg-background/60 p-4 rounded-lg space-y-1 text-sm border border-black/10">
              <p><strong>Halisi Gifts Shop / Time Crew Ventures</strong></p>
              <p>Accra Road, Accra Trade Centre Building, 2nd Floor, Shop SF21</p>
              <p>Nairobi, Kenya</p>
              <p>Phone / WhatsApp: <a href="tel:+254729596165" className="text-gold font-semibold hover:underline">+254729596165</a></p>
              <p>Email: <a href="mailto:info@halisigifts.com" className="text-gold font-semibold hover:underline">info@halisigifts.com</a></p>
            </div>
          </section>

          <div className="pt-4 border-t border-black/10 flex flex-wrap gap-4 text-xs text-black/70">
            <Link href="/shipping-returns" className="text-gold hover:underline font-semibold">
              Delivery & Return Policy
            </Link>
            <span>•</span>
            <Link href="/contact" className="text-gold hover:underline font-semibold">
              Contact Customer Care
            </Link>
            <span>•</span>
            <Link href="/store-locator" className="text-gold hover:underline font-semibold">
              Visit Our Shop in Nairobi
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
