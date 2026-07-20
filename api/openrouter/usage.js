const CATEGORIES = {
  content: { label: "Content Automation", env: "OPENROUTER_CONTENT_KEY", icon: "✦" },
  seo: { label: "SEO Research", env: "OPENROUTER_SEO_KEY", icon: "⌕" },
  seeding: { label: "Seeding", env: "OPENROUTER_SEEDING_KEY", icon: "◎" },
  ads: { label: "Paid Ads", env: "OPENROUTER_ADS_KEY", icon: "↗" },
  chatbot: { label: "Internal Chatbot", env: "OPENROUTER_CHATBOT_KEY", icon: "⌁" },
  research: { label: "Research & Insights", env: "OPENROUTER_RESEARCH_KEY", icon: "◇" },
};

const crypto = require("node:crypto");

function authorized(request) {
  const expected = process.env.AI_GATEWAY_ADMIN_TOKEN;
  const supplied = String(request.headers["x-admin-token"] || "");
  if (!expected || !supplied) return false;
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && crypto.timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function sanitize(data, category, source = "category") {
  return {
    category,
    category_label: CATEGORIES[category]?.label || data.name || "OpenRouter Key",
    icon: CATEGORIES[category]?.icon || "◆",
    label: data.label || data.name || "OpenRouter Key",
    disabled: Boolean(data.disabled),
    is_free_tier: Boolean(data.is_free_tier),
    is_management_key: Boolean(data.is_management_key),
    limit: typeof data.limit === "number" ? data.limit : null,
    limit_remaining: typeof data.limit_remaining === "number" ? data.limit_remaining : null,
    limit_reset: data.limit_reset || null,
    usage: Number(data.usage || 0),
    usage_daily: Number(data.usage_daily || 0),
    usage_weekly: Number(data.usage_weekly || 0),
    usage_monthly: Number(data.usage_monthly || 0),
    expires_at: data.expires_at || null,
    source,
  };
}

async function openRouter(path, key) {
  const response = await fetch(`https://openrouter.ai${path}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || `OpenRouter returned ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload.data;
}

function inferCategory(name = "") {
  const normalized = name.toLowerCase();
  return Object.keys(CATEGORIES).find((key) => normalized.includes(key)) || "other";
}

module.exports = async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, max-age=0");

  if (!process.env.AI_GATEWAY_ADMIN_TOKEN) {
    return response.status(503).json({ error: "AI Gateway chưa được cấu hình admin token trên server." });
  }
  if (!authorized(request)) {
    return response.status(401).json({ error: "Bạn cần admin access token hợp lệ để xem hoặc kiểm tra API key." });
  }

  if (request.method === "POST") {
    const apiKey = String(request.body?.apiKey || "").trim();
    const category = String(request.body?.category || "content");
    if (!apiKey.startsWith("sk-or-") || apiKey.length < 20) {
      return response.status(400).json({ error: "API key OpenRouter không hợp lệ." });
    }
    if (!CATEGORIES[category]) {
      return response.status(400).json({ error: "Hạng mục không hợp lệ." });
    }
    try {
      const data = await openRouter("/api/v1/key", apiKey);
      return response.status(200).json({ key: sanitize(data, category, "validated") });
    } catch (error) {
      return response.status(error.status || 502).json({ error: error.message || "Không thể kiểm tra OpenRouter." });
    }
  }

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET, POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const keys = [];
  const errors = [];
  const managementKey = process.env.OPENROUTER_MANAGEMENT_KEY;
  let account = null;

  if (managementKey) {
    try {
      const [managedKeys, credits] = await Promise.all([
        openRouter("/api/v1/keys?include_disabled=true", managementKey),
        openRouter("/api/v1/credits", managementKey).catch(() => null),
      ]);
      for (const item of managedKeys || []) {
        const category = inferCategory(item.name || item.label);
        keys.push(sanitize(item, category, "management"));
      }
      if (credits) account = { total_credits: Number(credits.total_credits || 0), total_usage: Number(credits.total_usage || 0) };
    } catch (error) {
      errors.push({ source: "management", message: error.message });
    }
  }

  if (!managementKey) {
    await Promise.all(Object.entries(CATEGORIES).map(async ([category, config]) => {
      const apiKey = process.env[config.env];
      if (!apiKey) return;
      try {
        const data = await openRouter("/api/v1/key", apiKey);
        keys.push(sanitize(data, category));
      } catch (error) {
        errors.push({ source: category, message: error.message });
      }
    }));
  }

  return response.status(200).json({
    configured: Boolean(managementKey || Object.values(CATEGORIES).some((item) => process.env[item.env])),
    management_key_configured: Boolean(managementKey),
    keys,
    account,
    errors,
    categories: Object.entries(CATEGORIES).map(([id, item]) => ({ id, label: item.label, env: item.env, icon: item.icon })),
  });
};
