declare const __GADS_ID__: string, __GADS_SEND_TO__: string;

// Google Ads: off until googleAdsId is set in site.config.json. With googleAdsSendTo set too,
// every tap on a WhatsApp demo button is reported as a conversion.
export function googleAds() {
  if (!__GADS_ID__) return;
  const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void };
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${__GADS_ID__}`;
  document.head.append(s);
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () {
    // gtag expects the arguments object itself, not an array.
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  };
  w.gtag("js", new Date());
  w.gtag("config", __GADS_ID__);
  if (__GADS_SEND_TO__)
    document.addEventListener("click", (e) => {
      const a = (e.target as Element).closest?.("a");
      if (a?.href.includes("wa.me")) w.gtag("event", "conversion", { send_to: __GADS_SEND_TO__ });
    });
}
