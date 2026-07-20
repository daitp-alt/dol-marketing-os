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

const systemPromptPresets = {
  seo: defaultSystemPrompt,
  academic: "Bạn là chuyên gia học thuật của DOL English. Viết chính xác, kiểm soát thuật ngữ, giải thích logic bằng Linearthinking, dùng ví dụ Anh–Việt và tuyệt đối không bịa nguồn hoặc dữ kiện.",
  conversion: "Bạn là Conversion Content Writer của DOL English. Viết thuyết phục nhưng trung thực, tập trung pain point, outcome và CTA rõ ràng; giữ giọng điệu thông minh, gần gũi và không phóng đại.",
  editorial: "Bạn là biên tập viên cấp cao của DOL English. Viết tự nhiên như con người, đa dạng nhịp câu, loại bỏ sáo ngữ AI, ưu tiên information gain, tính rõ ràng và trải nghiệm đọc.",
};
const voicePresets = {
  academic: "Chuyên sâu nhưng dễ hiểu; thông minh, chân thành; giải thích logic thay vì áp đặt; giữ chất học thuật của DOL.",
  friendly: "Thân thiện, trẻ trung, đồng cảm với người học; dùng ngôn ngữ đời thường nhưng vẫn chính xác.",
  performance: "Trực diện, cô đọng và định hướng hành động; nêu rõ lợi ích, bằng chứng và CTA nhưng không phóng đại.",
};
const stylePresets = {
  systematic: "Giải thích có hệ thống bằng Linearthinking, dùng ví dụ đối chiếu và câu văn tự nhiên.",
  storytelling: "Mở bằng tình huống thực tế, dẫn dắt bằng câu chuyện và rút ra bài học có thể áp dụng.",
  expert: "Tư vấn như chuyên gia, phân tích trade-off, đưa khuyến nghị cụ thể và có điều kiện áp dụng.",
  conversational: "Đối thoại gần gũi, câu ngắn vừa phải, đặt câu hỏi đúng lúc và tránh giọng quảng cáo.",
  conversion: "Cấu trúc theo pain point → insight → solution → proof → CTA, rõ ràng và thuyết phục.",
};
const CONTENT_LIBRARY_KEY = "dol_writer_library_v2";
let contentModels = [];
let activeArticleId = null;
let writerAutosaveTimer = null;
let activeGoogleDoc = null;
let googleWorkspaceConnected = false;
let googleWorkspaceConfigured = true;

function groupedModelOptions(models) {
  const groups = new Map();
  models.forEach((model) => {
    if (!groups.has(model.group)) groups.set(model.group, []);
    groups.get(model.group).push(model);
  });
  return [...groups.entries()].map(([label, items]) => `<optgroup label="${escapeHtml(label)}">${items.map((model) => `<option value="${escapeHtml(model.id)}">${model.recommended ? "★ " : ""}${escapeHtml(model.name)} · $${escapeHtml(model.prompt_price)}/$${escapeHtml(model.completion_price)}</option>`).join("")}</optgroup>`).join("");
}

async function loadContentModels() {
  const selects = [...document.querySelectorAll(".ai-model-select")];
  const meta = document.querySelector("#modelMeta");
  if (!selects.length) return;
  try {
    const response = await fetch(`${BASE_PATH}/api/openrouter/models`, { headers: { Accept: "application/json" } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Không tải được model.");
    contentModels = payload.models || [];
    const options = groupedModelOptions(contentModels);
    const recommended = contentModels.find((model) => model.recommended) || contentModels[0];
    selects.forEach((select) => { select.innerHTML = options; if (recommended) select.value = recommended.id; });
    const updateMeta = () => {
      const model = contentModels.find((item) => item.id === document.querySelector("#writerModel").value);
      if (model) meta.textContent = `${model.context.toLocaleString("vi-VN")} context · input $${model.prompt_price}/1M · output $${model.completion_price}/1M${model.economy ? " · Tiết kiệm" : ""}`;
    };
    document.querySelector("#writerModel").addEventListener("change", updateMeta);
    updateMeta();
  } catch (error) {
    selects.forEach((select) => { select.innerHTML = '<option value="openai/gpt-4.1-mini">OpenAI GPT-4.1 Mini · fallback</option>'; });
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
    h1: document.querySelector("#writerH1").value,
    slug: document.querySelector("#writerSlug").value,
    description: document.querySelector("#writerDescription").value,
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
  const shared = { mode, model: document.querySelector("#writerModel")?.value || "openai/gpt-4.1-mini", temperature: 0.3 };
  if (mode === "keywords") return { ...shared, project: document.querySelector("#keywordProject").value, market: document.querySelector("#keywordMarket").value, seed: document.querySelector("#keywordSeed").value, audience: document.querySelector("#keywordAudience").value, count: document.querySelector("#keywordCount").value, instruction: document.querySelector("#keywordInstruction").value };
  if (mode === "outline") return { ...shared, keyword: document.querySelector("#outlineKeyword").value, entities: document.querySelector("#outlineEntities").value, intent: document.querySelector("#outlineIntent").value, depth: document.querySelector("#outlineDepth").value, angle: document.querySelector("#outlineAngle").value, customPrompt: "" };
  if (mode === "review") return { ...shared, content: document.querySelector("#reviewInput").value, dimensions: [...document.querySelectorAll(".review-dimensions input:checked")].map((input) => input.parentElement.textContent.trim()) };
  return { ...shared, url: document.querySelector("#auditUrl").value, keyword: document.querySelector("#auditKeyword").value, content: document.querySelector("#auditInput").value, seoRules: selectedSeoRules() };
}

function stripCodeFence(content) {
  return String(content || "").trim().replace(/^```(?:html|json|markdown|md)?\s*/i, "").replace(/\s*```$/, "");
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

function metadataPayload(fields) {
  return {
    mode: "metadata",
    model: document.querySelector("#writerMetaModel").value,
    temperature: 0.4,
    fields,
    keyword: document.querySelector("#writerKeyword").value,
    project: document.querySelector("#writerProject").value,
    intent: document.querySelector("#writerOutlineIntent").value,
    brandVoice: document.querySelector("#writerVoice").value,
    prompts: { title: document.querySelector("#writerTitlePrompt").value, h1: document.querySelector("#writerH1Prompt").value, slug: document.querySelector("#writerSlugPrompt").value, description: document.querySelector("#writerDescriptionPrompt").value },
  };
}

async function generateMetadata(fields, button) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "Đang tạo...";
  try {
    const data = await callContentAgent(metadataPayload(fields));
    const result = JSON.parse(stripCodeFence(data.content));
    const targets = { title: "#writerTitle", h1: "#writerH1", slug: "#writerSlug", description: "#writerDescription" };
    fields.forEach((field) => { if (result[field]) document.querySelector(targets[field]).value = result[field]; });
    updateSeoDashboard();
    showToast("Đã tạo SEO metadata", `${fields.length} trường đã được cập nhật và vẫn có thể chỉnh tay.`);
  } catch (error) {
    showToast("Không thể tạo metadata", error.message);
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

document.querySelector("#generateAllMetadata")?.addEventListener("click", (event) => generateMetadata(["title", "h1", "slug", "description"], event.currentTarget));
document.querySelectorAll("[data-generate-meta]").forEach((button) => button.addEventListener("click", () => generateMetadata([button.dataset.generateMeta], button)));

document.querySelector("#generateWriterOutline")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "✦ Đang tạo outline...";
  try {
    const data = await callContentAgent({ mode: "outline", model: document.querySelector("#writerOutlineModel").value, temperature: 0.3, keyword: document.querySelector("#writerKeyword").value, entities: "", intent: document.querySelector("#writerOutlineIntent").value, depth: "H1 + H2 + H3 + FAQ", angle: document.querySelector("#writerInstruction").value, customPrompt: document.querySelector("#writerOutlinePrompt").value });
    const doc = new DOMParser().parseFromString(sanitizeGeneratedHtml(data.content), "text/html");
    document.querySelector("#writerOutline").value = doc.body.innerText.trim();
    showToast("Đã tạo outline", "Bạn có thể chỉnh trực tiếp trước khi generate bài.");
  } catch (error) { showToast("Không thể tạo outline", error.message); }
  finally { button.disabled = false; button.textContent = original; }
});

function readLibrary() {
  try { return JSON.parse(localStorage.getItem(CONTENT_LIBRARY_KEY) || "[]"); } catch { return []; }
}

function writeLibrary(items) {
  try { localStorage.setItem(CONTENT_LIBRARY_KEY, JSON.stringify(items.slice(0, 25))); } catch { showToast("Không thể lưu local", "Dung lượng trình duyệt đã đầy."); }
}

function currentArticle(model = "") {
  const output = document.querySelector("#writerOutput");
  return { id: activeArticleId || `content-${Date.now()}`, title: document.querySelector("#writerTitle").value || "Untitled content", h1: document.querySelector("#writerH1").value, slug: document.querySelector("#writerSlug").value, description: document.querySelector("#writerDescription").value, keyword: document.querySelector("#writerKeyword").value, project: document.querySelector("#writerProject").value, model: model || document.querySelector("#writerModel").value, wordcount: output.innerText.trim().split(/\s+/).filter(Boolean).length, html: output.innerHTML, googleDoc: activeGoogleDoc, updatedAt: new Date().toISOString() };
}

function saveCurrentArticle(model = "") {
  if (!document.querySelector("#writerOutput").innerText.trim()) return;
  const article = currentArticle(model);
  activeArticleId = article.id;
  const items = readLibrary().filter((item) => item.id !== article.id);
  writeLibrary([article, ...items]);
  renderWriterLibrary();
  document.querySelector("#editorSaveState").textContent = "● Đã lưu";
}

function renderWriterLibrary() {
  const items = readLibrary();
  const container = document.querySelector("#writerLibrary");
  document.querySelector("#writerLibraryCount").textContent = `${items.length} bài`;
  if (!items.length) { container.innerHTML = '<div class="library-empty">Chưa có bài viết nào. Bài mới sẽ xuất hiện tại đây sau khi generate.</div>'; return; }
  container.innerHTML = items.map((item) => `<div class="library-row" data-article-id="${escapeHtml(item.id)}"><div class="library-main"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.keyword)} · ${escapeHtml(item.project)}${item.googleDoc?.id ? " · Google Docs ✓" : ""}</small></div><div class="library-model"><strong>${escapeHtml(item.model)}</strong><small>${Number(item.wordcount || 0).toLocaleString("vi-VN")} từ</small></div><time>${new Date(item.updatedAt).toLocaleString("vi-VN")}</time><div class="library-actions"><button data-library-open>Mở editor</button><select data-library-format><option value="html">HTML</option><option value="doc">DOC</option><option value="txt">TXT</option><option value="md">Markdown</option><option value="json">JSON</option></select><button data-library-export>Export</button></div></div>`).join("");
}

function showWriterEditor() {
  document.querySelector("#writerSetupWorkspace").hidden = true;
  document.querySelector("#writerEditorDashboard").hidden = false;
  document.querySelector("#editorDocumentTitle").textContent = document.querySelector("#writerTitle").value || "Untitled content";
  renderGoogleDocState();
  if (activeGoogleDoc?.id) loadGoogleComments();
  updateSeoDashboard();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showWriterSetup() {
  document.querySelector("#writerEditorDashboard").hidden = true;
  document.querySelector("#writerSetupWorkspace").hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
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
    activeArticleId = `content-${Date.now()}`;
    activeGoogleDoc = null;
    document.querySelector("#writerOutput").innerHTML = sanitizeGeneratedHtml(data.content);
    document.querySelector("#writerOutputMeta").textContent = `${data.model} · ${data.usage?.total_tokens?.toLocaleString("vi-VN") || "—"} tokens`;
    saveCurrentArticle(data.model);
    showWriterEditor();
    showToast("Đã tạo content", "Bài viết đã lưu vào Content Library và sẵn sàng chỉnh sửa.");
  } catch (error) { showToast("Không thể generate", error.message); }
  finally { button.classList.remove("loading"); strong.textContent = "Generate Content"; small.textContent = "Chạy Writer Agent qua OpenRouter"; }
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
    else { target.classList.add("has-result", "workflow-report"); target.textContent = stripCodeFence(data.content); }
    const score = String(data.content).match(/(?:SCORE|ĐIỂM)\s*[:：]\s*(\d{1,3})/i)?.[1];
    if (score && (mode === "review" || mode === "audit")) {
      const badge = document.querySelector(mode === "review" ? "#reviewScore" : "#auditScore");
      badge.textContent = score;
      badge.className = `score ${Number(score) >= 80 ? "good" : "medium"}`;
    }
    showToast("Workflow hoàn tất", `${mode} đã tạo kết quả mới.`);
  } catch (error) { showToast("Workflow thất bại", error.message); }
  finally { button.disabled = false; button.textContent = original; }
}

document.querySelectorAll("[data-run-mode]").forEach((button) => button.addEventListener("click", () => runSecondaryWorkflow(button.dataset.runMode, button)));
document.querySelector("#outlineToWriter")?.addEventListener("click", () => {
  const outline = document.querySelector("#outlineResult").innerText.trim();
  if (!outline) return showToast("Outline đang trống", "Hãy tạo hoặc nhập outline trước.");
  document.querySelector("#writerOutline").value = outline;
  navigateContent("writer");
  showToast("Đã chuyển outline", "Outline đã được đưa vào Writer setup.");
});

document.querySelector("#writerSystemPreset")?.addEventListener("change", (event) => { if (systemPromptPresets[event.target.value]) document.querySelector("#writerSystemPrompt").value = systemPromptPresets[event.target.value]; });
document.querySelector("#writerVoicePreset")?.addEventListener("change", (event) => { if (voicePresets[event.target.value]) document.querySelector("#writerVoice").value = voicePresets[event.target.value]; });
document.querySelector("#writerStylePreset")?.addEventListener("change", (event) => { if (stylePresets[event.target.value]) document.querySelector("#writerStyle").value = stylePresets[event.target.value]; });
document.querySelector("#resetSystemPrompt")?.addEventListener("click", () => { document.querySelector("#writerSystemPreset").value = "seo"; document.querySelector("#writerSystemPrompt").value = defaultSystemPrompt; });
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

function articleDocument(article) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(article.title)}</title><meta name="description" content="${escapeHtml(article.description)}"></head><body>${article.html}</body></html>`;
}

function articleText(article) {
  return new DOMParser().parseFromString(article.html, "text/html").body.innerText;
}

function exportArticle(article, format) {
  const filename = (article.slug || "/dol-content").replace(/^\//, "") || "dol-content";
  if (format === "txt") return downloadContent(`${filename}.txt`, articleText(article), "text/plain;charset=utf-8");
  if (format === "md") return downloadContent(`${filename}.md`, `# ${article.h1 || article.title}\n\n${articleText(article)}`, "text/markdown;charset=utf-8");
  if (format === "json") return downloadContent(`${filename}.json`, JSON.stringify(article, null, 2), "application/json;charset=utf-8");
  if (format === "doc") return downloadContent(`${filename}.doc`, articleDocument(article), "application/msword");
  downloadContent(`${filename}.html`, articleDocument(article), "text/html;charset=utf-8");
}

function exportWriter() {
  if (!document.querySelector("#writerOutput").innerText.trim()) return showToast("Chưa có content", "Generate hoặc nhập content trước khi export.");
  exportArticle(currentArticle(), document.querySelector("#writerExportFormat").value);
}

document.querySelector("#exportWriterOutput")?.addEventListener("click", exportWriter);
document.querySelector("#copyWriterOutput")?.addEventListener("click", async () => {
  const output = document.querySelector("#writerOutput");
  if (!output.innerText.trim()) return showToast("Chưa có content", "Không có nội dung để sao chép.");
  await navigator.clipboard.writeText(output.innerText);
  showToast("Đã sao chép", "Content đã được đưa vào clipboard.");
});
document.querySelectorAll("[data-export-target]").forEach((button) => button.addEventListener("click", () => {
  const target = document.querySelector(`#${button.dataset.exportTarget}`);
  if (!target?.innerText.trim() || !target.classList.contains("has-result")) return showToast("Chưa có dữ liệu", "Chạy workflow trước khi tải file.");
  downloadContent("dol-keyword-research.txt", target.innerText, "text/plain;charset=utf-8");
}));

function slugify(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function updateSeoDashboard() {
  const output = document.querySelector("#writerOutput");
  if (!output) return;
  const text = output.innerText.trim();
  const keyword = document.querySelector("#writerKeyword").value.trim().toLowerCase();
  const title = document.querySelector("#writerTitle").value.trim();
  const h1 = document.querySelector("#writerH1").value.trim();
  const slug = document.querySelector("#writerSlug").value.trim();
  const description = document.querySelector("#writerDescription").value.trim();
  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const target = Number(document.querySelector("#writerLength").value || 0);
  const checks = [
    [title.toLowerCase().includes(keyword), "Keyword có trong SEO Title"],
    [h1.toLowerCase().includes(keyword), "Keyword có trong Heading 1"],
    [description.toLowerCase().includes(keyword), "Keyword có trong Description"],
    [slugify(slug).includes(slugify(keyword)), "Keyword có trong URL"],
    [words.slice(0, 100).join(" ").toLowerCase().includes(keyword), "Keyword xuất hiện trong 100 từ đầu"],
    [output.querySelectorAll("h2").length >= 2, "Có cấu trúc H2 rõ ràng"],
    [description.length >= 120 && description.length <= 160, `Description ${description.length}/160 ký tự`],
    [!target || words.length >= target * .8, `Wordcount ${words.length.toLocaleString("vi-VN")}/${target.toLocaleString("vi-VN")}`],
  ];
  const passed = checks.filter(([ok]) => ok).length;
  const score = Math.round((passed / checks.length) * 100);
  document.querySelector("#liveSeoScore").textContent = `${score}%`;
  document.querySelector("#liveSeoBar").style.width = `${score}%`;
  document.querySelector("#serpTitle").textContent = title || "SEO title";
  document.querySelector("#serpDescription").textContent = description || "Meta description sẽ hiển thị tại đây.";
  document.querySelector("#serpUrl").textContent = `${document.querySelector("#writerProject").value}${slug || "/..."}`;
  document.querySelector("#seoKeywordChip").textContent = keyword || "focus keyword";
  document.querySelector("#editorWordCount").textContent = `${words.length.toLocaleString("vi-VN")} words`;
  document.querySelector("#liveSeoChecklist").innerHTML = checks.map(([ok, label]) => `<div class="seo-live-item ${ok ? "pass" : "fail"}"><i>${ok ? "✓" : "!"}</i><span>${escapeHtml(label)}</span></div>`).join("");
}

document.querySelector("#backToWriterSetup")?.addEventListener("click", showWriterSetup);
document.querySelector("#openReviewFromEditor")?.addEventListener("click", () => navigateContent("review"));
document.querySelector("#openAuditFromEditor")?.addEventListener("click", () => navigateContent("audit"));
document.querySelector("#writerOutput")?.addEventListener("input", () => {
  document.querySelector("#editorSaveState").textContent = "● Đang lưu...";
  updateSeoDashboard();
  clearTimeout(writerAutosaveTimer);
  writerAutosaveTimer = setTimeout(() => saveCurrentArticle(), 700);
});
document.querySelectorAll("#writerTitle,#writerH1,#writerSlug,#writerDescription,#writerKeyword,#writerLength").forEach((input) => input.addEventListener("input", updateSeoDashboard));

document.querySelector("#editorToolbar")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-command]");
  if (!button) return;
  const command = button.dataset.command;
  const value = command === "createLink" ? window.prompt("Nhập URL liên kết:", "https://") : null;
  if (command === "createLink" && !value) return;
  document.execCommand(command, false, value);
  document.querySelector("#writerOutput").focus();
});
document.querySelector("[data-format-block]")?.addEventListener("change", (event) => { document.execCommand("formatBlock", false, event.target.value); document.querySelector("#writerOutput").focus(); });

document.querySelectorAll("[data-inspector-tab]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-inspector-tab]").forEach((item) => item.classList.toggle("active", item === button));
  document.querySelectorAll(".inspector-pane").forEach((pane) => { const active = pane.id === `inspector-${button.dataset.inspectorTab}`; pane.hidden = !active; pane.classList.toggle("active", active); });
}));
document.querySelectorAll("[data-ai-edit]").forEach((button) => button.addEventListener("click", () => showToast("AI editing", "Tính năng xử lý đoạn đang chọn sẽ dùng cùng Writer model ở revision tiếp theo.")));

document.querySelector("#writerLibrary")?.addEventListener("click", (event) => {
  const row = event.target.closest("[data-article-id]");
  if (!row) return;
  const article = readLibrary().find((item) => item.id === row.dataset.articleId);
  if (!article) return;
  if (event.target.closest("[data-library-open]")) {
    activeArticleId = article.id;
    activeGoogleDoc = article.googleDoc || null;
    document.querySelector("#writerOutput").innerHTML = sanitizeGeneratedHtml(article.html);
    [["#writerTitle", article.title], ["#writerH1", article.h1], ["#writerSlug", article.slug], ["#writerDescription", article.description], ["#writerKeyword", article.keyword]].forEach(([selector, value]) => { document.querySelector(selector).value = value || ""; });
    document.querySelector("#writerOutputMeta").textContent = `${article.model} · cập nhật ${new Date(article.updatedAt).toLocaleString("vi-VN")}`;
    showWriterEditor();
  }
  if (event.target.closest("[data-library-export]")) exportArticle(article, row.querySelector("[data-library-format]").value);
});

document.querySelectorAll("#writerSystemPrompt,#writerTitle,#writerKeyword,#writerOutline,#writerInstruction,#writerVoice,#writerStyle").forEach((input) => input.addEventListener("input", () => {
  const payload = writerPayload();
  const chars = payload.systemPrompt.length + payload.outline.length + payload.instruction.length + payload.brandVoice.length + payload.style.length;
  document.querySelector("#writerTokenEstimate").textContent = `~${Math.max(300, Math.round(chars / 3.5)).toLocaleString("vi-VN")} tokens`;
}));

// Google Workspace / Docs integration
async function googleRequest(path, options = {}) {
  const response = await fetch(`${BASE_PATH}/api/google/${path}`, { credentials: "same-origin", ...options, headers: { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) { googleWorkspaceConnected = false; renderGoogleDocState(); }
    throw new Error(data.error || "Google Workspace không thể hoàn thành yêu cầu.");
  }
  return data;
}

function renderGoogleDocState() {
  const title = document.querySelector("#googleDocTitle");
  if (!title) return;
  const meta = document.querySelector("#googleDocMeta");
  const state = document.querySelector("#googleDocState");
  const connect = document.querySelector("#googleConnect");
  const create = document.querySelector("#createGoogleDoc");
  const sync = document.querySelector("#syncGoogleDoc");
  const pull = document.querySelector("#pullGoogleDoc");
  const open = document.querySelector("#openGoogleDoc");
  connect.hidden = googleWorkspaceConnected;
  create.hidden = !googleWorkspaceConnected || Boolean(activeGoogleDoc?.id);
  sync.hidden = !googleWorkspaceConnected || !activeGoogleDoc?.id;
  pull.hidden = !googleWorkspaceConnected || !activeGoogleDoc?.id;
  open.hidden = !activeGoogleDoc?.url;
  if (activeGoogleDoc?.url) open.href = activeGoogleDoc.url;
  if (activeGoogleDoc?.id) {
    title.textContent = activeGoogleDoc.name || document.querySelector("#writerTitle").value || "Google Doc";
    meta.textContent = activeGoogleDoc.modifiedTime ? `Google Doc gốc · cập nhật ${new Date(activeGoogleDoc.modifiedTime).toLocaleString("vi-VN")}` : "Google Doc gốc đã liên kết với content này.";
    state.textContent = "Đã liên kết";
    state.className = "google-doc-state synced";
  } else if (googleWorkspaceConnected) {
    title.textContent = "Google Workspace đã kết nối";
    meta.textContent = "Sẵn sàng tạo Google Doc trong thư mục Content của DOL.";
    state.textContent = "Đã kết nối";
    state.className = "google-doc-state connected";
  } else {
    title.textContent = "Google Docs chưa kết nối";
    meta.textContent = googleWorkspaceConfigured ? "Đăng nhập Google Workspace để tạo tài liệu và đồng bộ comment." : "Chưa cấu hình Google OAuth secrets trên Vercel.";
    state.textContent = "Chưa kết nối";
    state.className = "google-doc-state disconnected";
  }
}

async function checkGoogleWorkspace() {
  try {
    const data = await googleRequest("status");
    googleWorkspaceConfigured = data.configured !== false;
    googleWorkspaceConnected = Boolean(data.connected);
  } catch { googleWorkspaceConnected = false; }
  renderGoogleDocState();
}

function editorGooglePayload() {
  const output = document.querySelector("#writerOutput");
  const nodes = [...output.querySelectorAll("h1,h2,h3,p,li,blockquote")];
  const blocks = nodes.length ? nodes : [output];
  let text = "";
  const paragraphs = [];
  blocks.forEach((node) => {
    const value = node.innerText.trim();
    if (!value) return;
    const startIndex = text.length + 1;
    text += `${value}\n`;
    const tag = node.tagName?.toLowerCase();
    const namedStyleType = tag === "h1" ? "TITLE" : tag === "h2" ? "HEADING_1" : tag === "h3" ? "HEADING_2" : "NORMAL_TEXT";
    paragraphs.push({ startIndex, endIndex: startIndex + value.length, namedStyleType });
  });
  return { title: document.querySelector("#writerTitle").value || "DOL Content", text: text || `${output.innerText.trim()}\n`, paragraphs };
}

function setGoogleButtonLoading(button, loading, label) {
  if (!button) return;
  if (loading) { button.dataset.label = button.textContent; button.disabled = true; button.textContent = "Đang xử lý..."; }
  else { button.disabled = false; button.textContent = label || button.dataset.label || button.textContent; }
}

async function createGoogleDocument() {
  if (!document.querySelector("#writerOutput").innerText.trim()) return showToast("Chưa có content", "Generate hoặc nhập content trước khi tạo Google Doc.");
  const button = document.querySelector("#createGoogleDoc");
  setGoogleButtonLoading(button, true);
  try {
    const data = await googleRequest("document", { method: "POST", body: JSON.stringify({ action: "create", ...editorGooglePayload() }) });
    activeGoogleDoc = data.document;
    saveCurrentArticle();
    renderGoogleDocState();
    await loadGoogleComments();
    showToast("Đã tạo Google Doc", "Nội dung đã được ghi vào tài liệu gốc của DOL.");
  } catch (error) { showToast("Không thể tạo Google Doc", error.message); }
  finally { setGoogleButtonLoading(button, false, "Tạo Google Doc"); }
}

async function pushToGoogleDocument() {
  if (!activeGoogleDoc?.id) return createGoogleDocument();
  const button = document.querySelector("#syncGoogleDoc");
  setGoogleButtonLoading(button, true);
  try {
    const data = await googleRequest("document", { method: "POST", body: JSON.stringify({ action: "update", documentId: activeGoogleDoc.id, ...editorGooglePayload() }) });
    activeGoogleDoc = { ...activeGoogleDoc, ...data.document };
    saveCurrentArticle();
    renderGoogleDocState();
    showToast("Đã đồng bộ Google Docs", "Bản trên web đã được gửi lên Google Doc.");
  } catch (error) { showToast("Đồng bộ thất bại", error.message); }
  finally { setGoogleButtonLoading(button, false, "↑ Gửi lên Docs"); }
}

async function pullFromGoogleDocument() {
  if (!activeGoogleDoc?.id) return;
  const button = document.querySelector("#pullGoogleDoc");
  setGoogleButtonLoading(button, true);
  try {
    const data = await googleRequest(`document?id=${encodeURIComponent(activeGoogleDoc.id)}`);
    const text = data.document.text?.trim() || "";
    if (text) document.querySelector("#writerOutput").innerHTML = text.split(/\n{2,}/).map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`).join("");
    activeGoogleDoc = { ...activeGoogleDoc, ...data.document };
    saveCurrentArticle();
    updateSeoDashboard();
    renderGoogleComments(data.comments || []);
    renderGoogleDocState();
    showToast("Đã lấy bản Google Docs", "Editor đã cập nhật theo nội dung mới nhất trên Google.");
  } catch (error) { showToast("Không thể lấy Google Doc", error.message); }
  finally { setGoogleButtonLoading(button, false, "↓ Lấy từ Docs"); }
}

function renderGoogleComments(comments = []) {
  const container = document.querySelector("#googleCommentList");
  if (!container) return;
  if (!activeGoogleDoc?.id) { container.innerHTML = '<div class="google-comment-empty">Kết nối một Google Doc để xem feedback.</div>'; return; }
  if (!comments.length) { container.innerHTML = '<div class="google-comment-empty">Chưa có comment. Feedback tạo ở đây sẽ xuất hiện trong Google Drive/Docs.</div>'; return; }
  container.innerHTML = comments.map((comment) => `<article class="google-comment ${comment.resolved ? "resolved" : ""}" data-google-comment="${escapeHtml(comment.id)}"><div class="google-comment-head"><strong>${escapeHtml(comment.author?.displayName || "Google user")}</strong><time>${new Date(comment.createdTime).toLocaleString("vi-VN")}</time></div><p>${escapeHtml(comment.content || "")}</p>${comment.resolved ? '<span class="google-comment-status">✓ Đã resolve</span>' : '<div class="google-comment-actions"><button type="button" data-google-reply>Reply</button><button type="button" data-google-resolve>Resolve</button></div>'}<div class="google-replies">${(comment.replies || []).filter((reply) => !reply.deleted && reply.content).map((reply) => `<div class="google-reply"><strong>${escapeHtml(reply.author?.displayName || "Google user")}</strong> ${escapeHtml(reply.content)}</div>`).join("")}</div></article>`).join("");
}

async function loadGoogleComments() {
  if (!activeGoogleDoc?.id || !googleWorkspaceConnected) return renderGoogleComments([]);
  try { const data = await googleRequest(`document?id=${encodeURIComponent(activeGoogleDoc.id)}&comments=1`); renderGoogleComments(data.comments || []); }
  catch (error) { document.querySelector("#googleCommentList").innerHTML = `<div class="google-comment-empty">${escapeHtml(error.message)}</div>`; }
}

async function addGoogleComment() {
  const input = document.querySelector("#googleCommentInput");
  if (!activeGoogleDoc?.id) return showToast("Chưa có Google Doc", "Tạo hoặc liên kết tài liệu trước khi comment.");
  if (!input.value.trim()) return;
  const button = document.querySelector("#addGoogleComment");
  setGoogleButtonLoading(button, true);
  try {
    await googleRequest("document", { method: "POST", body: JSON.stringify({ action: "comment", documentId: activeGoogleDoc.id, content: input.value.trim() }) });
    input.value = "";
    await loadGoogleComments();
    showToast("Đã gửi comment", "Comment đã được thêm bằng tài khoản Google của bạn.");
  } catch (error) { showToast("Không thể comment", error.message); }
  finally { setGoogleButtonLoading(button, false, "Gửi comment"); }
}

document.querySelector("#googleConnect")?.addEventListener("click", () => { location.href = `${BASE_PATH}/api/google/auth`; });
document.querySelector("#createGoogleDoc")?.addEventListener("click", createGoogleDocument);
document.querySelector("#syncGoogleDoc")?.addEventListener("click", pushToGoogleDocument);
document.querySelector("#pullGoogleDoc")?.addEventListener("click", pullFromGoogleDocument);
document.querySelector("#refreshGoogleComments")?.addEventListener("click", loadGoogleComments);
document.querySelector("#addGoogleComment")?.addEventListener("click", addGoogleComment);
document.querySelector("#googleCommentList")?.addEventListener("click", async (event) => {
  const comment = event.target.closest("[data-google-comment]");
  if (!comment) return;
  const resolve = Boolean(event.target.closest("[data-google-resolve]"));
  if (!resolve && !event.target.closest("[data-google-reply]")) return;
  const content = resolve ? "Đã xử lý feedback trên DOL Marketing OS." : window.prompt("Nhập nội dung reply:", "");
  if (!content) return;
  try {
    await googleRequest("document", { method: "POST", body: JSON.stringify({ action: "reply", documentId: activeGoogleDoc.id, commentId: comment.dataset.googleComment, content, resolve }) });
    await loadGoogleComments();
    showToast(resolve ? "Đã resolve comment" : "Đã reply", "Google Docs đã nhận cập nhật.");
  } catch (error) { showToast("Không thể cập nhật comment", error.message); }
});

document.querySelector("#contentPromptLibrary")?.addEventListener("click", () => showToast("Prompt Library", "Prompt preset có thể chọn và custom trực tiếp trong Writer setup."));
renderWriterLibrary();
loadContentModels();
checkGoogleWorkspace();

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
