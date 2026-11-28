import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedArticle {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  author: string;
  tags: string[];
  content: string;
}

const ARTICLES: SeedArticle[] = [
  {
    slug: "where-to-buy-authentic-watches-nairobi",
    title: "Where to Buy Authentic Watches in Nairobi: 2026 Buyer Guide",
    excerpt:
      "Learn how to find verified original wristwatches in Nairobi without overpaying or risking counterfeits, including typical KES price ranges and same-day delivery options.",
    coverImage: "/videos/hero-poster.jpg",
    author: "Halisi Gifts Editorial",
    tags: ["Nairobi Watches", "Authentic Watches", "Buying Guide", "Kenya"],
    content: `
<h2>Where Is the Best Place to Buy Original Watches in Nairobi?</h2>
<p>To buy authentic watches in Nairobi with clear KES pricing and verified stock, shop from an established Kenyan specialist such as <a href="/">Halisi Gifts</a>, which stocks over 550 active watches and gifts from Poedagar, Curren, Olevs, CRRJU, Casio, WWOOR, Skmei, Naviforce, and Seiko with same-day Nairobi delivery and a 7-day exchange policy.</p>

<h2>What Should You Expect to Pay for an Original Watch in Kenya?</h2>
<p>Authentic watches in Nairobi start around KES 950 for classic Casio digital models and sit mostly between KES 2,350 and KES 7,550 for original quartz dress and chronograph watches. Collector Japanese pieces from Casio Edifice and Seiko typically range from KES 5,000 to KES 25,750 depending on case finishing and movement.</p>

<table>
  <thead>
    <tr>
      <th>Watch Tier</th>
      <th>Popular Original Brands</th>
      <th>Verified Price Range (KES)</th>
      <th>Best For</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Everyday Starter</td>
      <td><a href="/collections/casio-watches-kenya">Casio</a>, Hannah Martin</td>
      <td>KES 950 to KES 2,500</td>
      <td>Students, daily wear, <a href="/gifts-under-2000-kes">gifts under KES 2,000</a></td>
    </tr>
    <tr>
      <td>Executive Value</td>
      <td><a href="/collections/poedagar-watches-kenya">Poedagar</a>, <a href="/collections/curren-watches-kenya">Curren</a>, <a href="/collections/olevs-watches-kenya">Olevs</a>, <a href="/collections/crrju-watches-kenya">CRRJU</a></td>
      <td>KES 2,350 to KES 5,350</td>
      <td>Office wear, birthdays, <a href="/gifts-under-5000-kes">gifts under KES 5,000</a></td>
    </tr>
    <tr>
      <td>Sport &amp; Dual-Time</td>
      <td><a href="/collections/skmei-watches-kenya">Skmei</a>, <a href="/collections/naviforce-watches-kenya">Naviforce</a></td>
      <td>KES 2,700 to KES 4,950</td>
      <td>Active lifestyles and travel</td>
    </tr>
    <tr>
      <td>Premium &amp; Collector</td>
      <td>Seiko, Casio Edifice, <a href="/collections/couple-watches-kenya">Couple Sets</a></td>
      <td>KES 5,000 to KES 25,750</td>
      <td>Weddings, <a href="/luxury-watch-gifts-kenya">luxury watch gifts</a></td>
    </tr>
  </tbody>
</table>

<h2>What Checklist Protects You When Ordering a Watch Online in Kenya?</h2>
<p>Before paying any Nairobi watch seller, confirm four essentials: transparent KES pricing on a live catalog, clear photos of the exact model, M-Pesa or tracked checkout confirmation, and a written exchange window. Sellers who hide prices or refuse returns frequently move unverified replicas.</p>

<ul>
  <li><strong>Check live inventory:</strong> Browse categorized collections like <a href="/collections/mens-watches-kenya">Men's Watches</a> and <a href="/collections/womens-watches-nairobi">Women's Watches</a> so you can compare straps and case sizes side by side.</li>
  <li><strong>Confirm gift packaging:</strong> Every order at Halisi Gifts arrives in a presentation box with complimentary gift wrapping.</li>
  <li><strong>Ask about engraving:</strong> Personalizing the caseback for KES 200 turns a watch into a permanent keepsake for <a href="/birthday-gifts-kenya">birthdays</a> or <a href="/anniversary-gifts-nairobi">anniversaries</a>.</li>
  <li><strong>Verify delivery timelines:</strong> Expect same-day rider dispatch inside Nairobi and 24 to 48 hour tracked courier delivery across all 47 counties for a flat KES 250.</li>
</ul>
`,
  },
  {
    slug: "original-vs-fake-watches-kenya",
    title: "How to Spot Original vs Fake Watches in Kenya (6 Simple Checks)",
    excerpt:
      "Use six practical physical and seller checks to tell an authentic wristwatch from a counterfeit in Kenya before you spend your money.",
    coverImage: "/videos/hero-poster.jpg",
    author: "Halisi Gifts Editorial",
    tags: ["Watch Authenticity", "Original Watches", "Kenya", "Buying Guide"],
    content: `
<h2>How Can You Tell if a Watch Is Original in Kenya?</h2>
<p>You can verify whether a watch is original in Kenya by inspecting six concrete details: case weight and finishing, dial typography sharpness, working chronograph sub-dials, clean caseback engraving, smooth crown operation, and realistic KES pricing from a seller offering a clear return policy.</p>

<h2>Six Physical Checks Every Kenyan Watch Buyer Should Run</h2>
<p>Counterfeit watches often look acceptable in heavily filtered social media photos, yet they fail immediately under close inspection. Run through the comparison below whenever you unbox a timepiece.</p>

<table>
  <thead>
    <tr>
      <th>Inspection Point</th>
      <th>Original Watch</th>
      <th>Common Counterfeit Sign</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Dial Printing</td>
      <td>Crisp, centered brand logo and evenly spaced hour markers</td>
      <td>Blurry ink, crooked indices, or misspelled text</td>
    </tr>
    <tr>
      <td>Chronograph Sub-Dials</td>
      <td>Buttons start, stop, and reset working sub-dial hands</td>
      <td>Glued-on decorative hands that never move</td>
    </tr>
    <tr>
      <td>Case &amp; Bracelet Weight</td>
      <td>Solid 316L stainless steel feel with smooth link edges</td>
      <td>Hollow, rattling links or sharp unfinished corners</td>
    </tr>
    <tr>
      <td>Caseback Engraving</td>
      <td>Deep, consistent model code and water resistance mark</td>
      <td>Shallow laser scratches or missing reference numbers</td>
    </tr>
    <tr>
      <td>Crown &amp; Date Click</td>
      <td>Firm, clean click when setting time or date</td>
      <td>Loose, wobbly stem or sticking date wheel</td>
    </tr>
    <tr>
      <td>Packaging &amp; Warranty</td>
      <td>Proper presentation box plus written exchange policy</td>
      <td>Loose plastic sleeve with no receipt or recourse</td>
    </tr>
  </tbody>
</table>

<h2>Why Suspiciously Cheap Luxury Claims Are a Red Flag</h2>
<p>If an unverified seller advertises a brand-new Swiss mechanical watch worth hundreds of thousands of shillings for KES 2,500, it is a replica. Instead of buying a fake badge that tarnishes in weeks, choose a genuinely well-built original watch from <a href="/collections/poedagar-watches-kenya">Poedagar</a>, <a href="/collections/curren-watches-kenya">Curren</a>, <a href="/collections/olevs-watches-kenya">Olevs</a>, <a href="/collections/crrju-watches-kenya">CRRJU</a>, or <a href="/collections/casio-watches-kenya">Casio</a>.</p>

<h2>What Does Halisi Mean at Halisi Gifts?</h2>
<p>In Swahili, "Halisi" means authentic and genuine. Every watch listed on <a href="/">halisigifts.com</a> is inspected before dispatch, shipped in a presentation box, and protected by our 7-day exchange guarantee with same-day Nairobi delivery and flat KES 250 shipping across Kenya.</p>
`,
  },
  {
    slug: "best-watch-gifts-for-men-kenya-under-10000",
    title: "Best Watch Gifts for Men in Kenya Under KES 10,000",
    excerpt:
      "Compare the top original men's watches under KES 10,000 in Kenya by strap style, brand, and occasion, with same-day Nairobi delivery and KES 200 engraving.",
    coverImage: "/videos/hero-poster.jpg",
    author: "Halisi Gifts Editorial",
    tags: ["Gifts for Him", "Men's Watches", "Under 10000 KES", "Kenya"],
    content: `
<h2>What Are the Best Men's Watch Gifts Under KES 10,000 in Kenya?</h2>
<p>The best men's watch gifts under KES 10,000 in Kenya are original Poedagar stainless steel models (KES 2,850 to KES 7,550), Curren leather chronographs (KES 2,610 to KES 5,000), Olevs executive day-date watches (KES 2,850 to KES 5,350), and Casio or Seiko classics (KES 3,500 to KES 9,250) available at Halisi Gifts.</p>

<h2>Top Men's Watch Picks Compared by Style and Budget</h2>
<p>Match the watch to how he dresses most days of the week. Men who wear suits or collared shirts prefer clean <a href="/collections/stainless-steel-watches-kenya">stainless steel watches</a>, while casual dressers love <a href="/collections/leather-strap-watches-kenya">leather strap watches</a> or rugged dual-time sport models.</p>

<table>
  <thead>
    <tr>
      <th>Style Personality</th>
      <th>Top Brand Pick</th>
      <th>Price Range (KES)</th>
      <th>Why It Makes a Great Gift</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Corporate Executive</td>
      <td><a href="/collections/poedagar-watches-kenya">Poedagar</a> / <a href="/collections/olevs-watches-kenya">Olevs</a></td>
      <td>KES 2,850 to KES 5,350</td>
      <td>Luminous day-date dial with brushed steel bracelet</td>
    </tr>
    <tr>
      <td>Smart-Casual Modern</td>
      <td><a href="/collections/curren-watches-kenya">Curren</a> / <a href="/collections/crrju-watches-kenya">CRRJU</a></td>
      <td>KES 2,610 to KES 5,000</td>
      <td>Working chronograph sub-dials and soft leather or mesh</td>
    </tr>
    <tr>
      <td>Active &amp; Outdoors</td>
      <td><a href="/collections/naviforce-watches-kenya">Naviforce</a> / <a href="/collections/skmei-watches-kenya">Skmei</a></td>
      <td>KES 2,700 to KES 4,950</td>
      <td>Dual-time display, alarm, and 30M to 50M water resistance</td>
    </tr>
    <tr>
      <td>Heritage &amp; Collector</td>
      <td><a href="/collections/casio-watches-kenya">Casio</a> / Seiko</td>
      <td>KES 4,800 to KES 9,250</td>
      <td>Iconic Japanese reliability for major milestones</td>
    </tr>
  </tbody>
</table>

<h2>How to Upgrade a Watch Gift Without Passing KES 10,000</h2>
<p>If your budget sits between KES 5,000 and KES 10,000, pair a KES 3,500 to KES 5,000 watch with an original 100ml Lattafa Arabian perfume (KES 1,350 to KES 3,400) and add custom caseback engraving for KES 200. Browse our <a href="/gifts-for-him">Gifts for Him</a> and <a href="/gifts-under-10000-kes">Gifts Under KES 10,000</a> collections to build a complete hamper with free wrapping and flat KES 250 nationwide Kenya delivery.</p>
`,
  },
  {
    slug: "watch-case-size-guide-small-wrists",
    title: "Watch Case Size Guide for Small Wrists (Men & Women in Kenya)",
    excerpt:
      "Find the ideal watch case diameter, thickness, and strap type for small wrists so your next timepiece feels balanced and comfortable all day.",
    coverImage: "/videos/hero-poster.jpg",
    author: "Halisi Gifts Editorial",
    tags: ["Watch Size Guide", "Small Wrists", "Style Guide", "Watches Kenya"],
    content: `
<h2>What Watch Case Size Is Best for a Small Wrist?</h2>
<p>For small wrists measuring under 16 cm (6.3 inches) in circumference, the most balanced watch case diameters are 26mm to 34mm for women and 36mm to 40mm for men. Choosing a slim case profile under 10mm thick with a mesh or leather strap prevents overhanging lugs and ensures all-day comfort.</p>

<h2>Quick Wrist Size to Watch Diameter Chart</h2>
<p>Measure your wrist snugly just above the wrist bone using a flexible tape or strip of paper, then match your measurement to the table below before ordering from our <a href="/collections/mens-watches-kenya">Men's Watches</a> or <a href="/collections/womens-watches-nairobi">Women's Watches</a> collections.</p>

<table>
  <thead>
    <tr>
      <th>Wrist Circumference</th>
      <th>Recommended Ladies' Case</th>
      <th>Recommended Men's Case</th>
      <th>Best Strap Choice</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>13 cm to 15 cm (Petite)</td>
      <td>26mm to 30mm</td>
      <td>36mm to 38mm</td>
      <td>Milanese mesh or slim leather</td>
    </tr>
    <tr>
      <td>15 cm to 16.5 cm (Small to Medium)</td>
      <td>30mm to 34mm</td>
      <td>38mm to 40mm</td>
      <td>Adjustable mesh, leather, or slim steel</td>
    </tr>
    <tr>
      <td>16.5 cm to 18 cm (Average)</td>
      <td>34mm to 38mm</td>
      <td>40mm to 42mm</td>
      <td>Any stainless steel or leather strap</td>
    </tr>
    <tr>
      <td>18 cm+ (Broad Wrist)</td>
      <td>36mm to 40mm</td>
      <td>42mm to 45mm</td>
      <td>Chronograph steel or wide leather</td>
    </tr>
  </tbody>
</table>

<h2>Best Brands for Smaller Wrists at Halisi Gifts</h2>
<p>If you want a refined fit without bulk, look closely at <a href="/collections/crrju-watches-kenya">CRRJU ultra-slim mesh watches</a>, <a href="/collections/wwoor-watches-kenya">WWOOR rectangular dress watches</a>, <a href="/collections/casio-watches-kenya">Casio classic digital watches</a>, and petite <a href="/collections/olevs-watches-kenya">Olevs ladies' models</a>. Mesh clasps slide smoothly to the exact millimeter, eliminating any sizing guesswork when buying a surprise gift.</p>
`,
  },
  {
    slug: "best-corporate-gift-ideas-nairobi",
    title: "Best Corporate Gift Ideas in Nairobi for Clients & Teams (KES Guide)",
    excerpt:
      "Discover practical, high-perceived-value corporate gifts in Nairobi from KES 2,000 per recipient, including engraved executive watches and luxury gift boxes.",
    coverImage: "/videos/hero-poster.jpg",
    author: "Halisi Gifts Editorial",
    tags: ["Corporate Gifts Nairobi", "Executive Gifts", "B2B Gifting", "Kenya"],
    content: `
<h2>What Are the Best Corporate Gift Ideas in Nairobi?</h2>
<p>The most memorable corporate gifts in Nairobi combine daily usefulness with lasting presentation: custom-engraved original wristwatches (KES 2,500 to KES 8,500), luxury presentation watch boxes, and original Arabian perfumes (KES 1,350 to KES 3,800). Unlike generic promotional pens or mugs, an authentic timepiece stays on a client's or employee's wrist for years.</p>

<h2>Corporate Gifting Budgets in Nairobi by Recipient Tier</h2>
<p>Plan your company gifting smoothly by grouping recipients into clear KES tiers. Explore ready-to-order options directly on our <a href="/corporate-gifts-nairobi">Corporate Gifts Nairobi</a> page.</p>

<table>
  <thead>
    <tr>
      <th>Corporate Tier</th>
      <th>Recommended Gift</th>
      <th>Budget per Person (KES)</th>
      <th>Branding Option</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Team &amp; Staff Recognition</td>
      <td>Minimalist <a href="/collections/crrju-watches-kenya">CRRJU</a> or <a href="/collections/curren-watches-kenya">Curren</a> watch</td>
      <td>KES 2,500 to KES 3,800</td>
      <td>Initials or year engraved (KES 200)</td>
    </tr>
    <tr>
      <td>Key Clients &amp; Partners</td>
      <td>Executive <a href="/collections/poedagar-watches-kenya">Poedagar</a> or <a href="/collections/olevs-watches-kenya">Olevs</a> steel watch</td>
      <td>KES 3,500 to KES 6,000</td>
      <td>Subtle caseback or box engraving</td>
    </tr>
    <tr>
      <td>Long-Service &amp; Boardroom VIP</td>
      <td><a href="/luxury-watch-gifts-kenya">Seiko, Casio Edifice, or Luxury Set</a></td>
      <td>KES 6,500 to KES 25,750</td>
      <td>Personalized dedication inscription</td>
    </tr>
  </tbody>
</table>

<h2>How to Order Bulk Corporate Gifts Smoothly in Nairobi</h2>
<p>For fast turnaround on end-of-year awards, graduations, or client milestones, finalize your recipient count, choose one versatile neutral finish such as silver steel or classic black leather, and keep engraving concise (such as initials plus the year). Halisi Gifts includes uniform luxury gift wrapping on every piece and handles same-day Nairobi dispatch or flat KES 250 countrywide courier delivery.</p>
`,
  },
];

async function main() {
  let count = 0;
  for (const article of ARTICLES) {
    await prisma.blogPost.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        excerpt: article.excerpt,
        content: article.content.trim(),
        coverImage: article.coverImage,
        author: article.author,
        tags: article.tags,
        published: true,
      },
      create: {
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt,
        content: article.content.trim(),
        coverImage: article.coverImage,
        author: article.author,
        tags: article.tags,
        published: true,
      },
    });
    count += 1;
    console.log(`Seeded blog post: ${article.slug}`);
  }
  console.log(`Done. Upserted ${count} AEO buying guides.`);
}

main()
  .catch((err) => {
    console.error("Failed to seed AEO blogs:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
