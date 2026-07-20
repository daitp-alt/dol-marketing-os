const crypto = require("crypto");

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const ALLOWED_MODES = new Set(["keywords", "outline", "writer", "review", "audit"]);

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function clean(value, max = 12000) {
  return String(value ?? "").trim().slice(0, max);
}

function list(value, maxItems = 20) {
  return Array.isArray(value) ? value.slice(0, maxItems).map((item) => clean(item, 500)).filter(Boolean) : [];
}

function buildPrompt(body) {
  const mode = body.mode;
  if (mode === "keywords") {
    return {
      system: "Bạn là SEO Strategist cấp senior của DOL English. Nghiên cứu keyword bằng suy luận chuyên môn; không bịa search volume hoặc số liệu từ công cụ mà bạn chưa được cung cấp. Viết tiếng Việt rõ ràng.",
      user: `Nghiên cứu keyword cho project: ${clean(body.project)}\nThị trường: ${clean(body.market)}\nSeed keyword: ${clean(body.seed)}\nĐối tượng: ${clean(body.audience)}\nSố keyword mong muốn: ${clean(body.count, 4)}\nYêu cầu thêm: ${clean(body.instruction)}\n\nTrả về bảng Markdown gồm: Cluster | Keyword | Intent | Funnel | Content angle | Priority. Sau bảng, đề xuất 5 content pillar và giải thích ngắn. Không tự tạo search volume.`
    };
  }

  if (mode === "outline") {
    return {
      system: "Bạn là Content Strategist của DOL English, giỏi xây outline SEO theo search intent và information gain. Chỉ xuất HTML semantic sạch, không dùng Markdown, không thêm CSS, script hoặc toàn bộ thẻ html/body.",
      user: `Tạo outline cho keyword: ${clean(body.keyword)}\nKeywords phụ/entities: ${clean(body.entities)}\nSearch intent: ${clean(body.intent)}\nĐộ sâu: ${clean(body.depth)}\nĐịnh hướng: ${clean(body.angle)}\n\nDùng <h1>, <h2>, <h3>, <ul>, <li>. Với mỗi heading, thêm một dòng mô tả mục tiêu nội dung và entities cần bao phủ. Cuối outline có FAQ và gợi ý CTA.`
    };
  }

  if (mode === "review") {
    const content = clean(body.content, 50000);
    if (!content) throw new Error("Nội dung review đang trống.");
    return {
      system: "Bạn là Senior Editor và Academic Reviewer của DOL English. Phản biện cụ thể, công bằng, không tự tạo lỗi. Trả báo cáo bằng tiếng Việt dạng plain text có cấu trúc.",
      user: `Review theo các chiều: ${list(body.dimensions).join(", ")}\n\nNỘI DUNG:\n${content}\n\nDòng đầu bắt buộc: SCORE: [0-100]. Sau đó gồm: Tóm tắt; Điểm tốt; Vấn đề Critical/Major/Minor (trích đoạn ngắn để định vị); Đề xuất sửa cụ thể; Kết luận Ready/Needs revision.`
    };
  }

  if (mode === "audit") {
    const content = clean(body.content, 50000);
    if (!content) throw new Error("Nội dung audit đang trống.");
    return {
      system: "Bạn là On-page SEO Auditor của DOL English. Chỉ đánh giá từ nội dung được cung cấp, không tuyên bố đã crawl URL và không bịa dữ liệu. Trả báo cáo tiếng Việt dạng plain text.",
      user: `URL tham chiếu (không crawl): ${clean(body.url)}\nKeyword mục tiêu: ${clean(body.keyword)}\nTiêu chuẩn: ${list(body.seoRules).join("; ")}\n\nNỘI DUNG:\n${content}\n\nDòng đầu bắt buộc: SCORE: [0-100]. Tiếp theo chấm riêng Keyword, Structure, Readability, Entities; liệt kê lỗi theo Critical/Warning/Opportunity; đưa checklist hành động ưu tiên và meta title/meta description đề xuất.`
    };
  }

  const rules = list(body.seoRules).map((rule, index) => `${index + 1}. ${rule}`).join("\n");
  return {
    system: clean(body.systemPrompt, 10000) || "Bạn là Senior Content Specialist của DOL English.",
    user: `Hãy viết một ${clean(body.contentType)} hoàn chỉnh cho ${clean(body.project)}.\n\nBRIEF\n- Tiêu đề: ${clean(body.title)}\n- Keyword chính: ${clean(body.keyword)}\n- Đối tượng: ${clean(body.audience)}\n- Brand voice: ${clean(body.brandVoice)}\n- Phong cách: ${clean(body.style)}\n- Độ dài mục tiêu: ${clean(body.targetLength)}\n- CTA: ${clean(body.cta)}\n- Yêu cầu riêng: ${clean(body.instruction)}\n\nOUTLINE\n${clean(body.outline, 20000)}\n\nON-PAGE RULES\n${rules}\n\nOUTPUT CONTRACT\n- Chỉ xuất phần nội dung HTML semantic sạch; không Markdown, không code fence, không CSS, không script, không thẻ html/head/body.\n- Mở đầu bằng một comment HTML chứa meta title và meta description, sau đó dùng h1, h2, h3, p, ul/ol, table khi phù hợp.\n- Tự kiểm tra toàn bộ on-page rules trước khi trả lời. Không nói về quá trình tự kiểm tra trong bài viết.`
  };
}

function getMessageContent(message) {
  if (typeof message?.content === "string") return message.content;
  if (Array.isArray(message?.content)) return message.content.map((part) => part?.text || "").join("");
  return "";
}

module.exports = async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });

  const adminToken = process.env.AI_GATEWAY_ADMIN_TOKEN;
  if (!adminToken) return response.status(503).json({ error: "AI Gateway chưa được cấu hình trên server." });
  if (!safeEqual(request.headers["x-admin-token"], adminToken)) return response.status(401).json({ error: "Access token không hợp lệ." });

  const apiKey = process.env.OPENROUTER_CONTENT_KEY;
  if (!apiKey) return response.status(503).json({ error: "OPENROUTER_CONTENT_KEY chưa được cấu hình trên Vercel." });

  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body) : (request.body || {});
    if (!ALLOWED_MODES.has(body.mode)) return response.status(400).json({ error: "Workflow không hợp lệ." });
    const model = clean(body.model, 160);
    if (!/^[a-zA-Z0-9._:/-]+$/.test(model)) return response.status(400).json({ error: "Model ID không hợp lệ." });
    const prompt = buildPrompt(body);
    const temperature = Math.max(0, Math.min(2, Number(body.temperature ?? 0.4)));

    const upstream = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.PUBLIC_APP_URL || "https://mkt.dolenglish.us/seo",
        "X-OpenRouter-Title": "DOL Marketing OS",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: prompt.system }, { role: "user", content: prompt.user }],
        temperature,
        max_completion_tokens: body.mode === "writer" ? 12000 : 5000,
      }),
      signal: AbortSignal.timeout(55000),
    });

    const payload = await upstream.json();
    if (!upstream.ok) return response.status(upstream.status).json({ error: payload?.error?.message || "OpenRouter từ chối yêu cầu." });
    const choice = payload.choices?.[0];
    if (choice?.error) return response.status(502).json({ error: choice.error.message || "Model dừng giữa chừng." });
    const content = getMessageContent(choice?.message);
    if (!content) return response.status(502).json({ error: "Model không trả về nội dung." });

    return response.status(200).json({ content, model: payload.model || model, usage: payload.usage || null, finish_reason: choice.finish_reason || null });
  } catch (error) {
    const timeout = error?.name === "TimeoutError" || error?.name === "AbortError";
    return response.status(timeout ? 504 : 500).json({ error: timeout ? "Model phản hồi quá lâu. Hãy thử model nhanh hơn hoặc giảm độ dài." : (error.message || "Content Agent gặp lỗi.") });
  }
};
