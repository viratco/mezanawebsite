// Builds the site's images from the product screenshots and the logo.
// Run once (npm run assets); the results in public/ and src/brand/ are committed.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SHOTS = process.env.SHOTS; // folder with the demo-café screenshots
const LOGO = path.resolve("../marketing/logo/mezana-option-B-palace-arch.svg");
const OUT = path.resolve("public/shots");

// ---- logo → animatable emblem + wordmark ----
const svg = fs.readFileSync(LOGO, "utf8");
const paths = [...svg.matchAll(/<path d="([^"]+)"([^>]*)\/>/g)].map((m) => ({ d: m[1], attrs: m[2] }));
const petals = [...svg.matchAll(/<g transform="rotate\((-?\d+)\)"><path d="([^"]+)"/g)].map((m) => ({ r: m[1], d: m[2] }));
const [finial, outer, inner, cusp1, cusp2, mGlyph] = paths;
const wordmark = paths.find((p) => p.d.startsWith("M-258.80"));
const tagline = paths[paths.length - 1];

const emblem = `<svg class="emblem" viewBox="-272 -510 544 666" aria-hidden="true">
<g transform="translate(0 -125) scale(.95)">
<path class="em-finial" d="${finial.d}"/>
<path class="em-outer" d="${outer.d}"/>
<path class="em-inner" d="${inner.d}"/>
<path class="em-cusp em-cusp1" d="${cusp1.d}"/>
<path class="em-cusp em-cusp2" d="${cusp2.d}"/>
<path class="em-m" d="${mGlyph.d}"/>
<g class="em-lotus" transform="translate(0 172) scale(1.25)">${petals
  .map((p) => `<g transform="rotate(${p.r})"><path class="em-petal" d="${p.d}"/></g>`)
  .join("")}</g>
<rect class="em-base em-base1" x="-250" y="262" width="500" height="11"/>
<rect class="em-base em-base2" x="-272" y="281" width="544" height="5"/>
</g></svg>`;
const word = `<svg class="wordmark" viewBox="-316 214 632 92" role="img" aria-label="Mezana"><path d="${wordmark.d}"/></svg>`;
fs.mkdirSync("src/brand", { recursive: true });
fs.writeFileSync("src/brand/emblem.svg", emblem);
fs.writeFileSync("src/brand/wordmark.svg", word);
fs.writeFileSync("src/brand/tagline.d.txt", tagline.d);

// Favicon / app icon: emblem on maroon-black, and the full logo for social cards.
const iconSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-345 -520 690 690" width="${size}" height="${size}">
<rect x="-345" y="-520" width="690" height="690" rx="${size > 64 ? 140 : 0}" fill="#1B070B"/>
${emblem.replace(/<svg[^>]*>/, "").replace("</svg>", "")
  .replaceAll('class="em-finial"', 'fill="#BE9445"')
  .replaceAll('class="em-outer"', 'fill="#F7EEDD" stroke="#BE9445" stroke-width="7"')
  .replaceAll('class="em-inner"', 'fill="#5E1420"')
  .replaceAll('class="em-cusp em-cusp1"', 'fill="none" stroke="#BE9445" stroke-width="5"')
  .replaceAll('class="em-cusp em-cusp2"', 'fill="none" stroke="#BE9445" stroke-width="1.8"')
  .replaceAll('class="em-m"', 'fill="#BE9445"')
  .replaceAll('class="em-petal"', 'fill="#BE9445" stroke="#5E1420" stroke-width="3"')
  .replaceAll(/class="em-base[^"]*"/g, 'fill="#BE9445"')
  .replace('class="em-lotus" ', "")}
</svg>`;
fs.writeFileSync("public/brand/icon.svg", iconSvg(64));
await sharp(Buffer.from(iconSvg(512))).png().toFile("public/brand/icon-512.png");
await sharp(Buffer.from(iconSvg(180))).png().toFile("public/brand/apple-touch-icon.png");
await sharp(Buffer.from(iconSvg(32))).png().toFile("public/brand/favicon-32.png");

// Social card: the full logo on cream, centred, 1200×630.
const logoPng = await sharp(LOGO, { density: 120 }).resize({ height: 600 }).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: "#F7EEDD" } })
  .composite([{ input: logoPng, gravity: "center" }])
  .jpeg({ quality: 88 })
  .toFile("public/brand/og.jpg");

// ---- screenshots → webp ----
if (!SHOTS) {
  console.log("SHOTS not set, skipped screenshots");
  process.exit(0);
}
const jobs = [
  // name, file, crop (source px) or null, output width
  ["guest-home", "guest-home.png", null, 780],
  ["guest-list", "guest-list.png", null, 780],
  ["guest-cart", "guest-cart.png", null, 780],
  ["counter", "staff-neworder.png", { left: 0, top: 0, width: 1720, height: 2293 }, 1376],
  ["floor", "staff-floor.png", { left: 0, top: 0, width: 1720, height: 2293 }, 1376],
  ["kitchen", "kitchen.png", { left: 0, top: 0, width: 1720, height: 2293 }, 1376],
  ["analytics", "analytics.png", { left: 0, top: 0, width: 1720, height: 2293 }, 1376],
  ["customers", "customers.png", { left: 0, top: 0, width: 1720, height: 2293 }, 1376],
  ["offline", "staff-offline.png", { left: 0, top: 0, width: 1720, height: 2293 }, 1376],
  ["order-card", "staff-neworder.png", { left: 90, top: 622, width: 760, height: 536 }, 760],
  ["ready-popup", "staff-popup.png", { left: 408, top: 845, width: 907, height: 710 }, 907],
  ["pay-split", "pay-hybrid-ready.png", { left: 412, top: 474, width: 896, height: 1452 }, 896],
  ["pay-options", "pay-options.png", { left: 0, top: 0, width: 1720, height: 2293 }, 1376],
  ["receipt", "live-receipt.png", { left: 588, top: 170, width: 544, height: 1095 }, 544],
  ["insights", "analytics.png", { left: 48, top: 726, width: 1625, height: 302 }, 1300],
  ["profit", "analytics.png", { left: 48, top: 1684, width: 1625, height: 716 }, 1300],
  ["offline-banner", "staff-offline.png", { left: 48, top: 170, width: 1625, height: 312 }, 1300],
];
fs.mkdirSync(OUT, { recursive: true });
for (const [name, file, crop, w] of jobs) {
  let img = sharp(path.join(SHOTS, file));
  if (crop) img = img.extract(crop);
  const info = await img.resize({ width: w }).webp({ quality: 82 }).toFile(path.join(OUT, `${name}.webp`));
  console.log(name, info.width + "x" + info.height, Math.round(info.size / 1024) + "KB");
}
