import fs from "node:fs";
import type { Plugin } from "vite";
import { marked } from "marked";

// The blog: one Markdown file per post in content/blog, rendered to plain static pages at /blog/ and
// /blog/<slug>/. They load a small stylesheet and the analytics, not the homepage's animation code.

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated: string;
  tag: string;
  order: number;
  minutes: number;
  html: string;
  toc: { id: string; text: string }[];
  faq: { q: string; a: string }[];
};

type Site = { siteUrl: string; waLink: string; waNumber: string };

export type Page = { slug: string; title: string; description: string; updated: string; waLink: string; body: string; faq: { q: string; a: string }[] };

const DIR = "content/blog", PAGES = "content/pages";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const plain = (html: string) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const slugify = (s: string) => plain(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const longDate = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function frontMatter(file: string, src: string) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing front matter`);
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) { const i = line.indexOf(":"); if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  for (const k of ["title", "description"]) if (!meta[k]) throw new Error(`${file}: front matter needs "${k}"`);
  return { meta, body: m[2] };
}

// Standalone pages (like /founding-cafes/): an HTML body in content/pages, wrapped in the same header and footer.
// Questions written as <details><summary>…</summary><div>…</div></details> also go into FAQ structured data.
export function readPages(site: Site): Page[] {
  if (!fs.existsSync(PAGES)) return [];
  return fs.readdirSync(PAGES).filter((f) => f.endsWith(".html")).map((f) => {
    const { meta, body } = frontMatter(f, fs.readFileSync(`${PAGES}/${f}`, "utf8"));
    const wa = meta.whatsapp && site.waNumber ? `https://wa.me/${site.waNumber}?text=${encodeURIComponent(meta.whatsapp.replace(/\\n/g, "\n"))}` : site.waLink;
    const html = body.replace(/\{\{WA_LINK\}\}/g, wa).replace(/\{\{SITE_URL\}\}/g, site.siteUrl);
    const faq = [...html.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<div>([\s\S]*?)<\/div>/g)].map(([, q, a]) => ({ q: plain(q), a: plain(a) }));
    return { slug: f.replace(/\.html$/, ""), title: meta.title, description: meta.description, updated: meta.updated || new Date().toISOString().slice(0, 10), waLink: wa, body: html, faq };
  });
}

function standalonePage(p: Page, site: Site, assets: { css: string[]; js: string }, brand: { emblem: string; word: string }) {
  const url = `${site.siteUrl}/${p.slug}/`;
  const ld: object[] = [org(site), { "@type": "WebPage", url, name: p.title, description: p.description, inLanguage: "en-IN", publisher: { "@id": `${site.siteUrl}/#org` } }];
  if (p.faq.length) ld.push({ "@type": "FAQPage", mainEntity: p.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
  return shell({ title: p.title, description: p.description, url, site: { ...site, waLink: p.waLink }, ...assets, brand, ld, type: "website", body: p.body });
}

export function readPosts(): Post[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { meta, body } = frontMatter(f, fs.readFileSync(`${DIR}/${f}`, "utf8"));
      if (!meta.date) throw new Error(`${f}: front matter needs "date"`);
      // Questions under "## Frequently asked questions" also go into FAQ structured data.
      const faq: Post["faq"] = [];
      const faqPart = body.split(/^## Frequently asked questions\s*$/m)[1];
      if (faqPart) for (const [, q, a] of faqPart.split(/^## /m)[0].matchAll(/^### (.+)\n+([\s\S]*?)(?=^### |$(?![\s\S]))/gm)) faq.push({ q: q.trim(), a: plain(marked.parse(a.trim()) as string) });
      const toc: Post["toc"] = [];
      const html = (marked.parse(body) as string)
        .replace(/<h2>(.*?)<\/h2>/g, (_, t: string) => { const id = slugify(t); toc.push({ id, text: plain(t) }); return `<h2 id="${id}">${t}</h2>`; })
        .replace(/<table>/g, '<div class="table"><table>').replace(/<\/table>/g, "</table></div>")
        .replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" target="_blank" rel="noopener"');
      return {
        slug: f.replace(/\.md$/, ""),
        title: meta.title,
        description: meta.description,
        date: meta.date,
        updated: meta.updated || meta.date,
        tag: meta.tag || "Guide",
        order: Number(meta.order) || 99,
        minutes: Math.max(2, Math.round(body.split(/\s+/).length / 200)),
        html,
        toc,
        faq,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.order - b.order);
}

function shell(o: { title: string; description: string; url: string; site: Site; css: string[]; js: string; brand: { emblem: string; word: string }; ld: object[]; type: string; body: string; dates?: [string, string] }) {
  const { site, brand } = o;
  return `<!doctype html>
<html lang="en-IN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${esc(o.title)}</title>
    <meta name="description" content="${esc(o.description)}" />
    <meta name="theme-color" content="#170609" />
    <link rel="canonical" href="${o.url}" />
    <link rel="icon" href="/brand/icon.svg" type="image/svg+xml" />
    <link rel="icon" href="/brand/favicon-32.png" sizes="32x32" type="image/png" />
    <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
    <link rel="alternate" type="application/rss+xml" title="Mezana blog" href="${site.siteUrl}/blog/rss.xml" />
    <meta property="og:type" content="${o.type}" />
    <meta property="og:site_name" content="Mezana" />
    <meta property="og:title" content="${esc(o.title)}" />
    <meta property="og:description" content="${esc(o.description)}" />
    <meta property="og:url" content="${o.url}" />
    <meta property="og:image" content="${site.siteUrl}/brand/og.jpg" />
    <meta property="og:locale" content="en_IN" />
    <meta name="twitter:card" content="summary_large_image" />${o.dates ? `
    <meta property="article:published_time" content="${o.dates[0]}" />
    <meta property="article:modified_time" content="${o.dates[1]}" />` : ""}
${o.css.map((h) => `    <link rel="stylesheet" href="${h}" />`).join("\n")}
    <script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": o.ld }).replace(/</g, "\\u003c")}</script>
  </head>
  <body>
    <header class="bnav">
      <a class="bnav-brand" href="/" aria-label="Mezana home"><span class="bnav-emblem">${brand.emblem}</span><span class="bnav-word">${brand.word}</span></a>
      <nav class="bnav-links" aria-label="Site"><a href="/">Home</a><a href="/blog/">Blog</a></nav>
      <a class="bbtn bbtn-gold bbtn-sm" href="${site.waLink}" target="_blank" rel="noopener">Book a demo</a>
    </header>
${o.body}
    <footer class="bfoot">
      <div class="bwrap bfoot-in">
        <a class="bfoot-brand" href="/"><span class="bnav-emblem">${brand.emblem}</span><span class="bnav-word">${brand.word}</span></a>
        <p>Dine-in POS for Indian cafés and restaurants: QR table ordering, a kitchen screen, GST bills and offline billing.</p>
        <p class="bfoot-links"><a href="/">Home</a> · <a href="/blog/">Blog</a> · <a href="${site.waLink}" target="_blank" rel="noopener">WhatsApp us</a></p>
        <p class="bfoot-copy">© ${new Date().getFullYear()} Mezana. Made in India.</p>
      </div>
    </footer>
    <script type="module" src="${o.js}"></script>
  </body>
</html>
`;
}

const org = (s: Site) => ({ "@type": "Organization", "@id": `${s.siteUrl}/#org`, name: "Mezana", url: `${s.siteUrl}/`, logo: `${s.siteUrl}/brand/icon-512.png` });

function postPage(p: Post, all: Post[], site: Site, assets: { css: string[]; js: string }, brand: { emblem: string; word: string }) {
  const url = `${site.siteUrl}/blog/${p.slug}/`;
  const related = all.filter((q) => q.slug !== p.slug).slice(0, 3);
  const ld: object[] = [
    org(site),
    {
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      datePublished: p.date,
      dateModified: p.updated,
      inLanguage: "en-IN",
      mainEntityOfPage: url,
      url,
      image: `${site.siteUrl}/brand/og.jpg`,
      author: { "@id": `${site.siteUrl}/#org` },
      publisher: { "@id": `${site.siteUrl}/#org` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${site.siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${site.siteUrl}/blog/` },
        { "@type": "ListItem", position: 3, name: p.title, item: url },
      ],
    },
  ];
  if (p.faq.length) ld.push({ "@type": "FAQPage", mainEntity: p.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
  const body = `    <main class="bwrap bpost" id="main">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/blog/">Blog</a></nav>
      <article>
        <header class="bhead">
          <p class="btag">${esc(p.tag)}</p>
          <h1>${esc(p.title)}</h1>
          <p class="blede">${esc(p.description)}</p>
          <p class="bmeta"><span>By Team Mezana</span><span>${p.updated !== p.date ? `Updated <time datetime="${p.updated}">${longDate(p.updated)}</time>` : `<time datetime="${p.date}">${longDate(p.date)}</time>`}</span><span>${p.minutes} min read</span></p>
        </header>${p.toc.length > 2 ? `
        <details class="btoc" open><summary>In this guide</summary><ol>${p.toc.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join("")}</ol></details>` : ""}
        <div class="bbody">
${p.html}
        </div>
      </article>
      <aside class="bcta">
        <p class="bcta-k">Mezana</p>
        <h2>Run your café on one calm screen</h2>
        <p>QR table ordering, a kitchen screen, GST bills, UPI, cash and card, and billing that keeps going when the internet doesn’t. On the phones and tablets you already have.</p>
        <p class="bcta-btns"><a class="bbtn bbtn-gold" href="${site.waLink}" target="_blank" rel="noopener">Book a free 15-minute demo</a><a class="bbtn bbtn-ghost" href="/">See how it works</a></p>
      </aside>${related.length ? `
      <section class="brel" aria-label="More guides">
        <h2>More guides for café owners</h2>
        <ul class="bcards">${related.map(card).join("")}</ul>
      </section>` : ""}
    </main>`;
  return shell({ title: `${p.title} | Mezana`, description: p.description, url, site, ...assets, brand, ld, type: "article", body, dates: [p.date, p.updated] });
}

const card = (p: Post) => `<li class="bcard"><a href="/blog/${p.slug}/"><span class="btag">${esc(p.tag)}</span><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><span class="bcard-meta">${longDate(p.updated)} · ${p.minutes} min read</span></a></li>`;

function indexPage(all: Post[], site: Site, assets: { css: string[]; js: string }, brand: { emblem: string; word: string }) {
  const url = `${site.siteUrl}/blog/`;
  const ld = [
    org(site),
    { "@type": "Blog", "@id": `${url}#blog`, url, name: "Mezana blog", description: "Practical guides for café and restaurant owners in India.", publisher: { "@id": `${site.siteUrl}/#org` }, inLanguage: "en-IN", blogPost: all.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${url}${p.slug}/`, datePublished: p.date, dateModified: p.updated })) },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: `${site.siteUrl}/` }, { "@type": "ListItem", position: 2, name: "Blog", item: url }] },
  ];
  const body = `    <main class="bwrap bindex" id="main">
      <header class="bhead">
        <p class="btag">Mezana blog</p>
        <h1>Guides for café and restaurant owners</h1>
        <p class="blede">Billing, GST, QR ordering, the kitchen and getting guests to come back. Straight answers for small cafés and restaurants in India.</p>
      </header>
      <ul class="bcards">${all.map(card).join("")}</ul>
    </main>`;
  return shell({ title: "Café & Restaurant Guides: POS, GST, QR Ordering | Mezana Blog", description: "Practical guides for café and restaurant owners in India: choosing POS and billing software, GST on restaurant bills, QR table ordering, KOTs, offline billing and repeat customers.", url, site, ...assets, brand, ld, type: "website", body });
}

function rss(all: Post[], site: Site) {
  const items = all.map((p) => `<item><title>${esc(p.title)}</title><link>${site.siteUrl}/blog/${p.slug}/</link><guid>${site.siteUrl}/blog/${p.slug}/</guid><pubDate>${new Date(p.date + "T00:00:00Z").toUTCString()}</pubDate><description>${esc(p.description)}</description></item>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Mezana blog</title><link>${site.siteUrl}/blog/</link><description>Guides for café and restaurant owners in India.</description><language>en-in</language>${items}</channel></rss>\n`;
}

export function blog(site: () => Site, brand: () => { emblem: string; word: string }): Plugin {
  return {
    name: "mezana-blog",
    config() {
      return { build: { rollupOptions: { input: { main: "index.html", blog: "src/blog.ts" } } } };
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url || "").split("?")[0];
        if (path === "/blog/rss.xml") { res.setHeader("Content-Type", "application/rss+xml"); res.end(rss(readPosts(), site())); return; }
        const assets = { css: [] as string[], js: "/src/blog.ts" };
        const pg = readPages(site()).find((p) => path === `/${p.slug}` || path === `/${p.slug}/`);
        if (pg) { res.setHeader("Content-Type", "text/html"); res.end(await server.transformIndexHtml(path, standalonePage(pg, site(), assets, brand()))); return; }
        const m = path.match(/^\/blog\/?(?:([a-z0-9-]+)\/?)?$/);
        if (!m) return next();
        const all = readPosts();
        let html: string;
        if (!m[1]) html = indexPage(all, site(), assets, brand());
        else { const p = all.find((q) => q.slug === m[1]); if (!p) return next(); html = postPage(p, all, site(), assets, brand()); }
        res.setHeader("Content-Type", "text/html");
        res.end(await server.transformIndexHtml(path, html));
      });
    },
    generateBundle(_, bundle) {
      const entry = Object.values(bundle).find((c) => c.type === "chunk" && c.isEntry && c.name === "blog");
      if (!entry || entry.type !== "chunk") throw new Error("blog entry missing from the bundle");
      const assets = { css: [...(entry.viteMetadata?.importedCss ?? [])].map((f) => "/" + f), js: "/" + entry.fileName };
      const all = readPosts();
      this.emitFile({ type: "asset", fileName: "blog/index.html", source: indexPage(all, site(), assets, brand()) });
      for (const p of all) this.emitFile({ type: "asset", fileName: `blog/${p.slug}/index.html`, source: postPage(p, all, site(), assets, brand()) });
      this.emitFile({ type: "asset", fileName: "blog/rss.xml", source: rss(all, site()) });
      for (const p of readPages(site())) this.emitFile({ type: "asset", fileName: `${p.slug}/index.html`, source: standalonePage(p, site(), assets, brand()) });
    },
  };
}
