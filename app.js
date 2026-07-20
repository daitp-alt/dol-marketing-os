const BASE_PATH = "/seo";

const projects = [
  "DOL English", "dolenglish.vn", "tuhoc.dolenglish.vn", "tudien.dolenglish.vn",
  "grammar.dolenglish.vn", "dolthpt.vn", "superlms.dolenglish.vn",
  "superkidlms.dolenglish.vn", "superkids.dolenglish.vn"
];

const projectMenu = document.querySelector("#projectMenu");
const projectSwitcher = document.querySelector("#projectSwitcher");
const projectName = document.querySelector("#projectName");
const sidebar = document.querySelector("#sidebar");
const modal = document.querySelector("#modalBackdrop");

projects.forEach((project) => {
  const button = document.createElement("button");
  button.className = "project-option";
  button.textContent = project;
  button.addEventListener("click", () => {
    projectName.textContent = project;
    projectMenu.classList.remove("open");
    projectSwitcher.setAttribute("aria-expanded", "false");
    showToast("Đã chuyển workspace", project);
  });
  projectMenu.appendChild(button);
});

projectSwitcher.addEventListener("click", () => {
  const open = projectMenu.classList.toggle("open");
  projectSwitcher.setAttribute("aria-expanded", String(open));
});

function navigate(view, route = view) {
  const target = document.querySelector(`#view-${view}`) || document.querySelector("#view-overview");
  document.querySelectorAll(".view").forEach((item) => item.classList.remove("active"));
  target.classList.add("active");
  document.querySelectorAll(".nav-item[data-view]").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === view);
  });
  document.querySelector("#contentNavToggle")?.classList.toggle("active", view === "content");
  if (view === "content") document.querySelector("#contentNavGroup")?.classList.add("open");
  history.replaceState(null, "", `#${route}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
  sidebar.classList.remove("open");
}

document.querySelectorAll("[data-view]").forEach((item) => item.addEventListener("click", (event) => {
  event.preventDefault();
  navigate(item.dataset.view);
}));
document.querySelectorAll("[data-view-jump]").forEach((item) => item.addEventListener("click", () => item.dataset.viewJump === "content" ? navigateContent("writer") : navigate(item.dataset.viewJump)));

document.querySelector("#contentNavToggle")?.addEventListener("click", () => {
  const group = document.querySelector("#contentNavGroup");
  const open = group.classList.toggle("open");
  document.querySelector("#contentNavToggle").setAttribute("aria-expanded", String(open));
});

document.querySelectorAll("[data-content-route]").forEach((item) => item.addEventListener("click", (event) => {
  event.preventDefault();
  navigateContent(item.dataset.contentRoute);
}));

document.querySelector("#menuToggle").addEventListener("click", () => sidebar.classList.add("open"));
document.querySelector("#sidebarClose").addEventListener("click", () => sidebar.classList.remove("open"));

document.querySelectorAll('[data-action="create"]').forEach((button) => button.addEventListener("click", () => {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}));
document.querySelector('[data-action="new-content"]').addEventListener("click", () => showToast("Content job mới", "Chọn template để bắt đầu."));
document.querySelector("#modalClose").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
document.querySelectorAll("[data-modal-jump]").forEach((item) => item.addEventListener("click", () => { closeModal(); item.dataset.modalJump === "content" ? navigateContent("writer") : navigate(item.dataset.modalJump); }));

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function showToast(title, message) {
  const toast = document.querySelector("#toast");
  toast.querySelector("strong").textContent = title;
  toast.querySelector("small").textContent = message;
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

// Content Studio
const defaultSystemPrompt = "Bạn là Senior Content Specialist của DOL English. Hãy viết chính xác, hữu ích, có chiều sâu học thuật nhưng dễ hiểu. Tuân thủ DOL Brand Voice và phương pháp Linearthinking: chia nhỏ vấn đề, giải thích logic, đưa ví dụ đối chiếu và không bịa dữ kiện. Nội dung phải nguyên bản, tự nhiên, không dùng các câu sáo rỗng của AI.";
let contentSessionToken = "";
const contentRoutes = {
  keywords: { eyebrow: "SEO DISCOVERY", title: "Keywords Research", description: "Khám phá, phân nhóm và ưu tiên keyword cho từng dự án DOL." },
  outline: { eyebrow: "CONTENT STRATEGY", title: "Outline Content", description: "Xây cấu trúc bài theo search intent, entities và topical coverage." },
  writer: { eyebrow: "AI WRITING WORKSPACE", title: "Writer Content", description: "Viết content bằng system prompt, brand voice và tiêu chuẩn on-page của DOL." },
  review: { eyebrow: "EDITORIAL QUALITY", title: "Review Content", description: "Kiểm duyệt brand voice, logic, học thuật và độ tự nhiên trước khi xuất bản." },
  audit: { eyebrow: "ON-PAGE QUALITY", title: "Audit Content", description: "Đánh giá SEO, cấu trúc, readability và cơ hội cải thiện nội dung." },
};

function switchContentTab(tab) {
  const route = contentRoutes[tab] ? tab : "writer";
  document.querySelectorAll("[data-content-route]").forEach((item) => item.classList.toggle("active", item.dataset.contentRoute === route));
  document.querySelectorAll(".content-workflow").forEach((panel) => {
    const active = panel.id === `content-${route}`;
    panel.hidden = !active;
    panel.classList.toggle("active", active);
  });
  const meta = contentRoutes[route];
  document.querySelector("#contentEyebrow").textContent = meta.eyebrow;
  document.querySelector("#contentPageTitle").textContent = meta.title;
  document.querySelector("#contentPageDescription").textContent = meta.description;
  if ((route === "review" || route === "audit") && document.querySelector("#writerOutput")?.innerText.trim()) {
    const target = document.querySelector(route === "review" ? "#reviewInput" : "#auditInput");
    if (target && !target.value.trim()) target.value = document.querySelector("#writerOutput").innerText.trim();
  }
}

function navigateContent(route = "writer") {
  const safeRoute = contentRoutes[route] ? route : "writer";
  switchContentTab(safeRoute);
  navigate("content", `content/${safeRoute}`);
}

async function connectContentGateway() {
  const input = document.querySelector("#contentAdminToken");
  const button = document.querySelector("#contentConnect");
  const dot = document.querySelector("#contentGatewayDot");
  const copy = document.querySelector("#contentGatewayText");
  contentSessionToken = input.value.trim();
  if (!contentSessionToken) return showToast("Thiếu access token", "Nhập AI Gateway access token để kết nối.");
  button.disabled = true;
  button.textContent = "Đang kiểm tra...";
  try {
    const response = await fetch(`${BASE_PATH}/api/openrouter/usage`, { headers: { "X-Admin-Token": contentSessionToken } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Không thể kết nối AI Gateway.");
    dot.classList.add("connected");
    copy.textContent = "Đã xác thực · Content key được bảo vệ trên server.";
    input.value = "";
    showToast("AI Gateway đã kết nối", "Content Agent sẵn sàng sử dụng OpenRouter.");
  } catch (error) {
    contentSessionToken = "";
    dot.classList.remove("connected");
    copy.textContent = error.message;
    showToast("Kết nối thất bại", error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Kết nối";
  }
}

document.querySelector("#contentConnect")?.addEventListener("click", connectContentGateway);
document.querySelector("#contentAdminToken")?.addEventListener("keydown", (event) => { if (event.key === "Enter") connectContentGateway(); });

async function loadContentModels() {
  const select = document.querySelector("#writerModel");
  const meta = document.querySelector("#modelMeta");
  if (!select) return;
  try {
    const response = await fetch(`${BASE_PATH}/api/openrouter/models`, { headers: { Accept: "application/json" } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Không tải được model.");
    select.innerHTML = payload.models.map((model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.name)} · ${escapeHtml(model.provider)}</option>`).join("");
    const recommended = payload.models.find((model) => model.recommended);
    if (recommended) select.value = recommended.id;
    const updateMeta = () => {
      const model = payload.models.find((item) => item.id === select.value);
      if (model) meta.textContent = `${model.context.toLocaleString("vi-VN")} context · input $${model.prompt_price}/1M · output $${model.completion_price}/1M`;
    };
    select.addEventListener("change", updateMeta);
    updateMeta();
  } catch (error) {
    select.innerHTML = '<option value="openai/gpt-4.1">openai/gpt-4.1 · fallback</option>';
    meta.textContent = error.message;
  }
}

function selectedSeoRules() {
  return [...document.querySelectorAll(".seo-check-grid input:checked")].map((input) => input.value);
}

function updateSeoCheckCount() {
  const all = document.querySelectorAll(".seo-check-grid input");
  const checked = document.querySelectorAll(".seo-check-grid input:checked");
  const count = document.querySelector("#seoCheckCount");
  if (count) count.textContent = `${checked.length}/${all.length} bật`;
}

document.querySelectorAll(".seo-check-grid input").forEach((input) => input.addEventListener("change", updateSeoCheckCount));

function writerPayload() {
  return {
    mode: "writer",
    model: document.querySelector("#writerModel").value,
    temperature: Number(document.querySelector("#writerTemperature").value),
    systemPrompt: document.querySelector("#writerSystemPrompt").value,
    project: document.querySelector("#writerProject").value,
    contentType: document.querySelector("#writerType").value,
    brandVoice: document.querySelector("#writerVoice").value,
    style: document.querySelector("#writerStyle").value,
    title: document.querySelector("#writerTitle").value,
    keyword: document.querySelector("#writerKeyword").value,
    outline: document.querySelector("#writerOutline").value,
    audience: document.querySelector("#writerAudience").value,
    cta: document.querySelector("#writerCta").value,
    instruction: document.querySelector("#writerInstruction").value,
    targetLength: document.querySelector("#writerLength").value,
    seoRules: selectedSeoRules(),
  };
}

function workflowPayload(mode) {
  const shared = { mode, model: document.querySelector("#writerModel")?.value || "openai/gpt-4.1", temperature: 0.3 };
  if (mode === "keywords") return { ...shared, project: document.querySelector("#keywordProject").value, market: document.querySelector("#keywordMarket").value, seed: document.querySelector("#keywordSeed").value, audience: document.querySelector("#keywordAudience").value, count: document.querySelector("#keywordCount").value, instruction: document.querySelector("#keywordInstruction").value };
  if (mode === "outline") return { ...shared, keyword: document.querySelector("#outlineKeyword").value, entities: document.querySelector("#outlineEntities").value, intent: document.querySelector("#outlineIntent").value, depth: document.querySelector("#outlineDepth").value, angle: document.querySelector("#outlineAngle").value };
  if (mode === "review") return { ...shared, content: document.querySelector("#reviewInput").value, dimensions: [...document.querySelectorAll(".review-dimensions input:checked")].map((input) => input.parentElement.textContent.trim()) };
  return { ...shared, url: document.querySelector("#auditUrl").value, keyword: document.querySelector("#auditKeyword").value, content: document.querySelector("#auditInput").value, seoRules: selectedSeoRules() };
}

function stripCodeFence(content) {
  return String(content || "").trim().replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/, "");
}

function sanitizeGeneratedHtml(html) {
  const doc = new DOMParser().parseFromString(stripCodeFence(html), "text/html");
  doc.querySelectorAll("script,style,iframe,object,embed,link,meta,form,input,button,textarea,select").forEach((node) => node.remove());
  doc.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      if (attribute.name.startsWith("on") || ((attribute.name === "href" || attribute.name === "src") && /^javascript:/i.test(attribute.value))) node.removeAttribute(attribute.name);
      if (attribute.name === "style") node.removeAttribute(attribute.name);
    });
  });
  return doc.body.innerHTML;
}

async function callContentAgent(payload) {
  if (!contentSessionToken) throw new Error("Hãy kết nối AI Gateway trước khi chạy workflow.");
  const response = await fetch(`${BASE_PATH}/api/content/generate`, { method: "POST", headers: { "Content-Type": "application/json", "X-Admin-Token": contentSessionToken }, body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Content Agent không thể hoàn thành yêu cầu.");
  return data;
}

async function generateWriterContent() {
  const button = document.querySelector("#generateContent");
  const strong = button.querySelector("strong");
  const small = button.querySelector("small");
  button.classList.add("loading");
  strong.textContent = "AI đang viết content...";
  small.textContent = "Đang gọi model qua OpenRouter";
  try {
    const data = await callContentAgent(writerPayload());
    const output = document.querySelector("#writerOutput");
    output.innerHTML = sanitizeGeneratedHtml(data.content);
    output.hidden = false;
    document.querySelector("#writerPlaceholder").hidden = true;
    document.querySelector("#writerOutputMeta").textContent = `${data.model} · ${data.usage?.total_tokens?.toLocaleString("vi-VN") || "—"} tokens · Revision mới`;
    showToast("Đã tạo content", "Bài viết sẵn sàng để chỉnh sửa, review hoặc audit.");
  } catch (error) {
    showToast("Không thể generate", error.message);
  } finally {
    button.classList.remove("loading");
    strong.textContent = "Generate with OpenRouter";
    small.textContent = "Tạo revision mới, không ghi đè bản trước";
  }
}

document.querySelector("#generateContent")?.addEventListener("click", generateWriterContent);

async function runSecondaryWorkflow(mode, button) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "✦ AI Agent đang xử lý...";
  try {
    const data = await callContentAgent(workflowPayload(mode));
    const target = document.querySelector(`#${mode}Result`);
    if (mode === "outline") target.innerHTML = sanitizeGeneratedHtml(data.content);
    else {
      target.classList.add("has-result", "workflow-report");
      target.textContent = stripCodeFence(data.content);
    }
    const score = String(data.content).match(/(?:SCORE|ĐIỂM)\s*[:：]\s*(\d{1,3})/i)?.[1];
    if (score && (mode === "review" || mode === "audit")) {
      const badge = document.querySelector(mode === "review" ? "#reviewScore" : "#auditScore");
      badge.textContent = score;
      badge.className = `score ${Number(score) >= 80 ? "good" : "medium"}`;
    }
    showToast("Workflow hoàn tất", `${mode} đã tạo kết quả mới.`);
  } catch (error) {
    showToast("Workflow thất bại", error.message);
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

document.querySelectorAll("[data-run-mode]").forEach((button) => button.addEventListener("click", () => runSecondaryWorkflow(button.dataset.runMode, button)));

document.querySelector("#outlineToWriter")?.addEventListener("click", () => {
  const outline = document.querySelector("#outlineResult").innerText.trim();
  if (!outline) return showToast("Outline đang trống", "Hãy tạo hoặc nhập outline trước.");
  document.querySelector("#writerOutline").value = outline;
  navigateContent("writer");
  showToast("Đã chuyển outline", "Outline đã được đưa vào Content Brief.");
});

document.querySelector("#resetSystemPrompt")?.addEventListener("click", () => { document.querySelector("#writerSystemPrompt").value = defaultSystemPrompt; });
document.querySelector("#togglePromptPreview")?.addEventListener("click", (event) => {
  const preview = document.querySelector("#writerPromptPreview");
  preview.hidden = !preview.hidden;
  preview.textContent = JSON.stringify(writerPayload(), null, 2);
  event.currentTarget.textContent = preview.hidden ? "Xem prompt" : "Ẩn prompt";
});

function downloadContent(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function exportWriter() {
  const output = document.querySelector("#writerOutput");
  if (output.hidden || !output.innerText.trim()) return showToast("Chưa có content", "Generate hoặc nhập content trước khi tải file.");
  const format = document.querySelector("#writerExportFormat").value;
  const slug = "dol-content-" + new Date().toISOString().slice(0, 10);
  if (format === "txt") return downloadContent(`${slug}.txt`, output.innerText, "text/plain;charset=utf-8");
  const documentHtml = `<!doctype html><html><head><meta charset="utf-8"><title>DOL Content</title></head><body>${output.innerHTML}</body></html>`;
  if (format === "doc") return downloadContent(`${slug}.doc`, documentHtml, "application/msword");
  downloadContent(`${slug}.html`, documentHtml, "text/html;charset=utf-8");
}

document.querySelector("#exportWriterOutput")?.addEventListener("click", exportWriter);
document.querySelector("#copyWriterOutput")?.addEventListener("click", async () => {
  const output = document.querySelector("#writerOutput");
  if (output.hidden || !output.innerText.trim()) return showToast("Chưa có content", "Không có nội dung để sao chép.");
  await navigator.clipboard.writeText(output.innerText);
  showToast("Đã sao chép", "Content đã được đưa vào clipboard.");
});
document.querySelectorAll("[data-export-target]").forEach((button) => button.addEventListener("click", () => {
  const target = document.querySelector(`#${button.dataset.exportTarget}`);
  if (!target?.innerText.trim() || !target.classList.contains("has-result")) return showToast("Chưa có dữ liệu", "Chạy workflow trước khi tải file.");
  downloadContent("dol-keyword-research.txt", target.innerText, "text/plain;charset=utf-8");
}));

document.querySelectorAll("#writerSystemPrompt,#writerTitle,#writerKeyword,#writerOutline,#writerInstruction").forEach((input) => input.addEventListener("input", () => {
  const chars = writerPayload().systemPrompt.length + writerPayload().outline.length + writerPayload().instruction.length;
  document.querySelector("#writerTokenEstimate").textContent = `~${Math.max(300, Math.round(chars / 3.5)).toLocaleString("vi-VN")} tokens`;
}));

document.querySelector("#contentPromptLibrary")?.addEventListener("click", () => showToast("Prompt Library", "Prompt mẫu sẽ được quản trị theo project và version ở giai đoạn tiếp theo."));
loadContentModels();

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.querySelector("#globalSearch").focus();
  }
  if (event.key === "Escape") closeModal();
});

const initialRoute = location.hash.replace("#", "") || "overview";
if (initialRoute === "content" || initialRoute.startsWith("content/")) navigateContent(initialRoute.split("/")[1] || "writer");
else navigate(initialRoute);

// OpenRouter AI Gateway
const openRouterCategories = [
  { id: "content", label: "Content Automation", icon: "✦" },
  { id: "seo", label: "SEO Research", icon: "⌕" },
  { id: "seeding", label: "Seeding", icon: "◎" },
  { id: "ads", label: "Paid Ads", icon: "↗" },
  { id: "chatbot", label: "Internal Chatbot", icon: "⌁" },
  { id: "research", label: "Research & Insights", icon: "◇" },
];

let openRouterKeys = [];
let gatewayAdminToken = "";

function usd(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(Number(value || 0));
}

function escapeHtml(value) {
  const node = document.createElement("div");
  node.textContent = String(value ?? "");
  return node.innerHTML;
}

function keyPercent(key) {
  if (typeof key.limit !== "number" || key.limit <= 0) return 0;
  return Math.min(100, Math.max(0, (Number(key.usage_monthly || 0) / key.limit) * 100));
}

function renderOpenRouterKeys(keys) {
  const container = document.querySelector("#openRouterKeyRows");
  if (!container) return;
  const mapped = new Map(keys.filter((key) => key.category !== "other").map((key) => [key.category, key]));
  const extra = keys.filter((key) => key.category === "other");
  const rows = openRouterCategories.map((category) => ({ category, key: mapped.get(category.id) }));
  extra.forEach((key, index) => rows.push({ category: { id: `other-${index}`, label: key.label, icon: "◆" }, key }));

  container.innerHTML = rows.map(({ category, key }) => {
    if (!key) {
      return `<div class="api-key-row"><div class="api-key-main"><span class="api-key-icon">${category.icon}</span><span><strong>${category.label}</strong><small>Chưa cấu hình API key</small></span></div><div class="api-key-spend"><strong>—</strong><small>Usage tháng này</small></div><div class="usage-bar-wrap"><div class="usage-bar-label"><span>Chưa có limit</span><span>—</span></div><div class="usage-bar"><i style="width:0%"></i></div></div><span class="status-pill pending key-state">Chờ kết nối</span></div>`;
    }
    const percent = keyPercent(key);
    const barClass = percent >= 90 ? "high" : percent >= 70 ? "medium" : "";
    const statusClass = key.disabled ? "invalid" : "success";
    const statusLabel = key.disabled ? "Đã tắt" : "Hoạt động";
    const limitLabel = typeof key.limit === "number" ? `${usd(key.usage_monthly)} / ${usd(key.limit)}` : `${usd(key.usage_monthly)} / Không giới hạn`;
    return `<div class="api-key-row"><div class="api-key-main"><span class="api-key-icon">${category.icon}</span><span><strong>${escapeHtml(category.label)}</strong><small>${escapeHtml(key.label)} · reset ${escapeHtml(key.limit_reset || "không đặt")}</small></span></div><div class="api-key-spend"><strong>${usd(key.usage_monthly)}</strong><small>${usd(key.usage_daily)} hôm nay</small></div><div class="usage-bar-wrap"><div class="usage-bar-label"><span>${limitLabel}</span><span>${typeof key.limit === "number" ? `${percent.toFixed(0)}%` : "∞"}</span></div><div class="usage-bar"><i class="${barClass}" style="width:${typeof key.limit === "number" ? percent : 0}%"></i></div></div><span class="status-pill ${statusClass} key-state">${statusLabel}</span></div>`;
  }).join("");
}

function updateOpenRouterSummary(keys, account) {
  const active = keys.filter((key) => !key.disabled);
  const monthlyUsage = active.reduce((total, key) => total + Number(key.usage_monthly || 0), 0);
  const limited = active.filter((key) => typeof key.limit === "number");
  const totalLimit = limited.reduce((total, key) => total + key.limit, 0);
  const remaining = limited.reduce((total, key) => total + Math.max(0, Number(key.limit_remaining ?? key.limit - key.usage_monthly)), 0);
  document.querySelector("#orMonthlyUsage").textContent = usd(monthlyUsage);
  document.querySelector("#orMonthlyLimit").textContent = limited.length ? usd(totalLimit) : "—";
  document.querySelector("#orRemaining").textContent = limited.length ? usd(remaining) : "—";
  document.querySelector("#orActiveKeys").textContent = String(active.length);
  document.querySelector("#orMonthlyNote").textContent = account ? `${usd(account.total_usage)} usage toàn tài khoản` : "Tổng từ các key đã kết nối";
  document.querySelector("#orRemainingNote").textContent = account ? `${usd(Math.max(0, account.total_credits - account.total_usage))} credits tài khoản` : "Các key có monthly limit";
  document.querySelector("#orKeyCountNote").textContent = `${active.length}/${openRouterCategories.length} hạng mục đã kết nối`;
}

async function loadOpenRouterUsage() {
  const refreshButton = document.querySelector("#openRouterRefresh");
  const badge = document.querySelector("#gatewayBadge");
  const statusText = document.querySelector("#gatewayStatusText");
  if (!refreshButton || !badge || !statusText) return;
  gatewayAdminToken = document.querySelector("#orAdminToken")?.value.trim() || gatewayAdminToken;
  if (!gatewayAdminToken) {
    badge.className = "connection-badge disconnected";
    badge.textContent = "Đã khóa";
    statusText.textContent = "Nhập Admin access token để mở usage và giới hạn OpenRouter.";
    renderOpenRouterKeys([]);
    updateOpenRouterSummary([], null);
    return;
  }
  refreshButton.disabled = true;
  refreshButton.textContent = "↻ Đang đồng bộ...";
  badge.className = "connection-badge checking";
  badge.textContent = "Đang kiểm tra";
  try {
    const response = await fetch(`${BASE_PATH}/api/openrouter/usage`, { headers: { Accept: "application/json", "X-Admin-Token": gatewayAdminToken } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Không thể tải OpenRouter usage.");
    openRouterKeys = payload.keys || [];
    renderOpenRouterKeys(openRouterKeys);
    updateOpenRouterSummary(openRouterKeys, payload.account);
    if (payload.configured) {
      badge.className = "connection-badge connected";
      badge.textContent = "Đã kết nối";
      statusText.textContent = payload.management_key_configured ? "Management API đã kết nối · usage tự động đồng bộ từ OpenRouter." : "Đã phát hiện API key theo hạng mục trên server.";
    } else {
      badge.className = "connection-badge disconnected";
      badge.textContent = "Chưa cấu hình";
      statusText.textContent = "Thêm Management API key hoặc key theo hạng mục vào Vercel để bật đồng bộ tự động.";
    }
  } catch (error) {
    badge.className = "connection-badge disconnected";
    badge.textContent = "Lỗi kết nối";
    statusText.textContent = error.message;
    renderOpenRouterKeys([]);
    updateOpenRouterSummary([], null);
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent = "↻ Đồng bộ usage";
  }
}

document.querySelector("#openRouterRefresh")?.addEventListener("click", loadOpenRouterUsage);
document.querySelector("#focusKeyForm")?.addEventListener("click", () => {
  document.querySelector("#orApiKey")?.focus();
  document.querySelector("#keyCheckCard")?.scrollIntoView({ behavior: "smooth", block: "center" });
});
document.querySelector("#toggleApiKey")?.addEventListener("click", () => {
  const input = document.querySelector("#orApiKey");
  input.type = input.type === "password" ? "text" : "password";
});

document.querySelector("#openRouterKeyForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = document.querySelector("#checkKeyButton");
  const result = document.querySelector("#keyCheckResult");
  const apiKeyInput = document.querySelector("#orApiKey");
  const category = document.querySelector("#orCategory").value;
  gatewayAdminToken = document.querySelector("#orAdminToken").value.trim();
  button.disabled = true;
  button.textContent = "Đang kiểm tra OpenRouter...";
  result.hidden = true;
  try {
    const response = await fetch(`${BASE_PATH}/api/openrouter/usage`, { method: "POST", headers: { "Content-Type": "application/json", "X-Admin-Token": gatewayAdminToken }, body: JSON.stringify({ apiKey: apiKeyInput.value, category }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "API key không hợp lệ.");
    const key = payload.key;
    result.className = "key-check-result success";
    result.innerHTML = `<div class="key-result-grid"><span><small>Trạng thái</small><strong>${key.disabled ? "Đã tắt" : "Hợp lệ"}</strong></span><span><small>Usage tháng</small><strong>${usd(key.usage_monthly)}</strong></span><span><small>Monthly limit</small><strong>${typeof key.limit === "number" ? usd(key.limit) : "Không giới hạn"}</strong></span><span><small>Còn lại</small><strong>${typeof key.limit_remaining === "number" ? usd(key.limit_remaining) : "—"}</strong></span></div>`;
    result.hidden = false;
    openRouterKeys = openRouterKeys.filter((item) => item.category !== category).concat(key);
    renderOpenRouterKeys(openRouterKeys);
    updateOpenRouterSummary(openRouterKeys, null);
    apiKeyInput.value = "";
    showToast("API key hợp lệ", "Key không được lưu; hãy thêm vào Vercel secret để dùng production.");
  } catch (error) {
    result.className = "key-check-result error";
    result.textContent = error.message;
    result.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = "Kiểm tra usage & limit";
  }
});

loadOpenRouterUsage();
