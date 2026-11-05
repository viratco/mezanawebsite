import "@fontsource/cormorant-garamond/600.css";
import "@fontsource-variable/inter-tight/wght.css";
import "./blog.css";

import { inject } from "@vercel/analytics";
import Clarity from "@microsoft/clarity";

declare const __CLARITY_ID__: string;

// Blog pages: same analytics as the homepage, none of its animation code.
inject();
if (__CLARITY_ID__) {
  Clarity.init(__CLARITY_ID__);
  Clarity.setTag("page-type", "blog");
  document.addEventListener("click", (e) => {
    const a = (e.target as Element).closest?.("a");
    if (a?.href.includes("wa.me")) Clarity.event("demo-whatsapp-click");
  });
}
