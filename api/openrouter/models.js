const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models?output_modalities=text&sort=most-popular";

function setHeaders(response) {
  response.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=86400");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("X-Content-Type-Options", "nosniff");
}

function perMillion(value) {
  const price = Number(value || 0) * 1_000_000;
  return Number.isFinite(price) ? price.toFixed(price < 1 ? 2 : 1) : "—";
}

module.exports = async function handler(request, response) {
  setHeaders(response);
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed." });

  try {
    const headers = { Accept: "application/json" };
    const key = process.env.OPENROUTER_CONTENT_KEY;
    if (key) headers.Authorization = `Bearer ${key}`;
    const upstream = await fetch(OPENROUTER_MODELS_URL, { headers, signal: AbortSignal.timeout(12000) });
    const payload = await upstream.json();
    if (!upstream.ok) throw new Error(payload?.error?.message || "OpenRouter Models API không phản hồi.");

    const models = (payload.data || [])
      .filter((model) => model.id && model.name && model.architecture?.output_modalities?.includes("text"))
      .slice(0, 80)
      .map((model, index) => ({
        id: model.id,
        name: model.name,
        provider: model.id.split("/")[0],
        context: Number(model.context_length || 0),
        prompt_price: perMillion(model.pricing?.prompt),
        completion_price: perMillion(model.pricing?.completion),
        recommended: index === 0,
      }));

    return response.status(200).json({ models, synced_at: new Date().toISOString() });
  } catch (error) {
    return response.status(502).json({ error: error.message || "Không thể tải danh sách model OpenRouter." });
  }
};
