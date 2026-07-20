const UPSTREAM_ORIGIN = "https://dol-marketing-os.vercel.app";

export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    if (incoming.pathname !== "/seo" && !incoming.pathname.startsWith("/seo/")) {
      return new Response("Not found", { status: 404 });
    }

    const upstream = new URL(incoming.pathname + incoming.search, UPSTREAM_ORIGIN);
    const headers = new Headers(request.headers);
    headers.set("X-Forwarded-Host", incoming.host);
    headers.set("X-Forwarded-Proto", incoming.protocol.replace(":", ""));

    return fetch(new Request(upstream, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      redirect: "manual",
    }));
  },
};
