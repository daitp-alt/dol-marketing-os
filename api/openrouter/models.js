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

function providerGroup(provider) {
  if (provider === "openai") return { order: 0, label: "OpenAI · tiết kiệm & phổ biến" };
  if (provider === "google") return { order: 1, label: "Google Gemini" };
  if (provider === "anthropic") return { order: 2, label: "Anthropic Claude" };
  return { order: 3, label: "Model khác" };
}

function priceBucket(totalPrice) {
  if (totalPrice <= 1) return 0;
  if (totalPrice <= 5) return 1;
  if (totalPrice <= 20) return 2;
  return 3;
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

    const candidates = (payload.data || [])
      .filter((model) => model.id && model.name && model.architecture?.output_modalities?.includes("text"))
      .slice(0, 180)
      .map((model, popularity) => {
        const provider = model.id.split("/")[0];
        const group = providerGroup(provider);
        const promptPrice = Number(model.pricing?.prompt || 0) * 1_000_000;
        const completionPrice = Number(model.pricing?.completion || 0) * 1_000_000;
        const totalPrice = promptPrice + completionPrice;
        return { model, provider, group, popularity, totalPrice };
      })
      .filter((item) => !(item.provider === "openai" && item.model.id.includes("gpt-oss")));

    const limited = [];
    for (const groupOrder of [0, 1, 2, 3]) {
      const max = groupOrder < 3 ? 24 : 18;
      limited.push(...candidates.filter((item) => item.group.order === groupOrder).sort((a, b) => priceBucket(a.totalPrice) - priceBucket(b.totalPrice) || a.popularity - b.popularity).slice(0, max));
    }
    const firstOpenAI = limited.find((item) => item.provider === "openai");
    const models = limited.map(({ model, provider, group, totalPrice }) => ({
      id: model.id,
      name: model.name,
      provider,
      group: group.label,
      context: Number(model.context_length || 0),
      prompt_price: perMillion(model.pricing?.prompt),
      completion_price: perMillion(model.pricing?.completion),
      economy: totalPrice <= 5,
      recommended: model.id === firstOpenAI?.model.id,
    }));

    return response.status(200).json({ models, synced_at: new Date().toISOString() });
  } catch (error) {
    return response.status(502).json({ error: error.message || "Không thể tải danh sách model OpenRouter." });
  }
};
