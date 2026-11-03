import fs from "node:fs";
import { defineConfig, type Plugin } from "vite";

type SiteConfig = {
  whatsappNumber: string;
  whatsappMessage: string;
  instagram: string;
  email: string;
  appUrl: string;
  siteUrl: string;
};

// Fills the page from site.config.json and inlines the brand SVGs, so every link
// and logo is in the HTML itself (works before any script runs).
function site(): Plugin {
  return {
    name: "mezana-site",
    transformIndexHtml(html) {
      const c: SiteConfig = JSON.parse(fs.readFileSync("site.config.json", "utf8"));
      const wa = c.whatsappNumber.replace(/\D/g, "");
      if (!wa) console.warn("\n⚠  site.config.json: whatsappNumber is empty, so demo buttons point to #start\n");
      const tokens: Record<string, string> = {
        WA_LINK: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(c.whatsappMessage)}` : "#start",
        INSTAGRAM: c.instagram.replace(/^@/, ""),
        EMAIL: c.email,
        APP_URL: c.appUrl,
        SITE_URL: c.siteUrl,
        YEAR: String(new Date().getFullYear()),
      };
      return html
        // Drop contact lines whose value isn't filled in yet.
        .replace(/<li data-need="(\w+)">[\s\S]*?<\/li>/g, (m, key: keyof SiteConfig) => (c[key] ? m : ""))
        .replace(/<!-- include (\S+) -->/g, (_, f: string) => fs.readFileSync(`src/brand/${f}`, "utf8"))
        .replace(/\{\{(\w+)\}\}/g, (_, k: string) => tokens[k] ?? "");
    },
  };
}

export default defineConfig({
  plugins: [site()],
  build: { target: "es2020", assetsInlineLimit: 0 },
});
