// E5 Enclave — A/B/C whole-site variant edge split (sovereign, CF Pages Functions)
// DAG: warroom-website-overhaul-abc-2026-0619
// Assigns alpha|beta 50/50 cookie-sticky (charlie/dark retired 2026-07-03); stamps <html data-variant> + window.__E5_VARIANT.
// Rollback: delete this file + redeploy. Variants render via /variant.css + /variant.js (data-variant driven).

const VARIANTS = ["alpha", "beta"];
const COOKIE = "e5_variant";
const MAXAGE = 60 * 60 * 24 * 30; // 30d sticky

function pick() {
  return Math.random() < 0.5 ? "alpha" : "beta";
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // never touch assets, redirects, or functions
  if (/\.(css|js|png|jpg|jpeg|svg|webp|ico|woff2?|xml|txt|json|mp4)$/i.test(url.pathname)
      || url.pathname.startsWith("/functions/")) {
    return next();
  }

  // read or assign variant
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(new RegExp(COOKIE + "=([a-z]+)"));
  let variant = m && VARIANTS.includes(m[1]) ? m[1] : null;
  const fresh = !variant;
  if (!variant) variant = pick();

  // allow forced preview: ?v=beta
  const forced = url.searchParams.get("v");
  if (forced && VARIANTS.includes(forced)) variant = forced;

  const resp = await next();
  const ct = resp.headers.get("Content-Type") || "";
  if (!ct.includes("text/html")) return resp;

  let html = await resp.text();
  // stamp the variant on <html> + expose to JS before any GA4 fires
  html = html.replace(/<html(\s|>)/i, `<html data-variant="${variant}"$1`);
  html = html.replace(/<head(\s*)>/i,
    `<head$1><script>window.__E5_VARIANT=${JSON.stringify(variant)};</script>` +
    `<link rel="stylesheet" href="/variant.css"><script defer src="/variant.js"></script>`);

  const headers = new Headers(resp.headers);
  if (fresh || forced) {
    headers.append("Set-Cookie",
      `${COOKIE}=${variant}; Path=/; Max-Age=${MAXAGE}; SameSite=Lax; Secure`);
  }
  headers.set("X-E5-Variant", variant);
  return new Response(html, { status: resp.status, headers });
}
