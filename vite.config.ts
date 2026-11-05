import fs from "node:fs";
import { defineConfig, type Plugin } from "vite";
import { blog, readPages, readPosts } from "./blog";

type SiteConfig = {
  whatsappNumber: string;
  whatsappMessage: string;
  instagram: string;
  email: string;
  appUrl: string;
  siteUrl: string;
  clarityProjectId: string;
  googleAdsId: string;
  googleAdsSendTo: string;
};

const readConfig = (): SiteConfig => JSON.parse(fs.readFileSync("site.config.json", "utf8"));
const waLink = (c: SiteConfig) => { const wa = c.whatsappNumber.replace(/\D/g, ""); return wa ? `https://wa.me/${wa}?text=${encodeURIComponent(c.whatsappMessage)}` : "/#start"; };
const brandSvg = (f: string) => fs.readFileSync(`src/brand/${f}`, "utf8");
const siteInfo = () => { const c = readConfig(); return { siteUrl: c.siteUrl, waLink: waLink(c), waNumber: c.whatsappNumber.replace(/\D/g, "") }; };
const text = (html: string) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

// What search engines read about Mezana: the company, the product, and the FAQ exactly as shown on the page.
function structuredData(html: string, c: SiteConfig, wa: string) {
  const faq = [...html.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<div>([\s\S]*?)<\/div>/g)].map(([, q, a]) => ({
    "@type": "Question",
    name: text(q),
    acceptedAnswer: { "@type": "Answer", text: text(a) },
  }));
  const org = {
    "@type": "Organization",
    "@id": `${c.siteUrl}/#org`,
    name: "Mezana",
    url: `${c.siteUrl}/`,
    logo: `${c.siteUrl}/brand/icon-512.png`,
    ...(wa && { contactPoint: { "@type": "ContactPoint", telephone: `+${wa}`, contactType: "sales", areaServed: "IN" } }),
    ...(c.instagram && { sameAs: [`https://instagram.com/${c.instagram.replace(/^@/, "")}`] }),
  };
  const graph = [
    org,
    { "@type": "WebSite", "@id": `${c.siteUrl}/#site`, url: `${c.siteUrl}/`, name: "Mezana", publisher: { "@id": org["@id"] }, inLanguage: "en-IN" },
    {
      "@type": "SoftwareApplication",
      name: "Mezana",
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Restaurant POS",
      operatingSystem: "Web browser (Android, iOS, Windows, macOS)",
      description: "Dine-in POS software for cafés and restaurants in India: QR table ordering, kitchen screen, GST billing, UPI, cash and card payments, and offline billing.",
      url: `${c.siteUrl}/`,
      image: `${c.siteUrl}/brand/og.jpg`,
      publisher: { "@id": org["@id"] },
      offers: { "@type": "Offer", price: "2000", priceCurrency: "INR", url: `${c.siteUrl}/founding-cafes/`, priceSpecification: { "@type": "UnitPriceSpecification", price: "2000", priceCurrency: "INR", unitText: "MONTH" } },
    },
    { "@type": "FAQPage", mainEntity: faq },
  ];
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

// Fills the page from site.config.json and inlines the brand SVGs, so every link
// and logo is in the HTML itself (works before any script runs).
function site(): Plugin {
  return {
    name: "mezana-site",
    transformIndexHtml(html) {
      const c = readConfig();
      const wa = c.whatsappNumber.replace(/\D/g, "");
      if (!wa) console.warn("\n⚠  site.config.json: whatsappNumber is empty, so demo buttons point to #start\n");
      const tokens: Record<string, string> = {
        WA_LINK: wa ? waLink(c) : "#start",
        INSTAGRAM: c.instagram.replace(/^@/, ""),
        EMAIL: c.email,
        APP_URL: c.appUrl,
        SITE_URL: c.siteUrl,
        YEAR: String(new Date().getFullYear()),
      };
      const page = html
        // Drop contact lines whose value isn't filled in yet.
        .replace(/<li data-need="(\w+)">[\s\S]*?<\/li>/g, (m, key: keyof SiteConfig) => (c[key] ? m : ""))
        .replace(/<!-- include (\S+) -->/g, (_, f: string) => fs.readFileSync(`src/brand/${f}`, "utf8"))
        .replace(/\{\{(\w+)\}\}/g, (_, k: string) => tokens[k] ?? "");
      return page.replace("</head>", `    ${structuredData(page, c, wa)}\n  </head>`);
    },
    // robots.txt and sitemap.xml (home, blog and every post), pointing at the address in site.config.json.
    generateBundle() {
      const { siteUrl } = readConfig();
      const today = new Date().toISOString().slice(0, 10), posts = readPosts();
      const pages = readPages(siteInfo());
      const urls = [[`${siteUrl}/`, today], ...pages.map((p) => [`${siteUrl}/${p.slug}/`, p.updated]), [`${siteUrl}/blog/`, posts[0]?.updated ?? today], ...posts.map((p) => [`${siteUrl}/blog/${p.slug}/`, p.updated])];
      this.emitFile({ type: "asset", fileName: "robots.txt", source: `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n` });
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, d]) => `  <url><loc>${u}</loc><lastmod>${d}</lastmod></url>`).join("\n")}\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig({
  plugins: [site(), blog(siteInfo, () => ({ emblem: brandSvg("emblem.svg"), word: brandSvg("wordmark.svg") }))],
  define: {
    __CLARITY_ID__: JSON.stringify(readConfig().clarityProjectId.trim()),
    __GADS_ID__: JSON.stringify((readConfig().googleAdsId ?? "").trim()),
    __GADS_SEND_TO__: JSON.stringify((readConfig().googleAdsSendTo ?? "").trim()),
  },
  build: { target: "es2020", assetsInlineLimit: 0 },
});
