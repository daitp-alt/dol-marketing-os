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

function navigate(view) {
  const target = document.querySelector(`#view-${view}`) || document.querySelector("#view-overview");
  document.querySelectorAll(".view").forEach((item) => item.classList.remove("active"));
  target.classList.add("active");
  document.querySelectorAll(".nav-item[data-view]").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === view);
  });
  history.replaceState(null, "", `#${view}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
  sidebar.classList.remove("open");
}

document.querySelectorAll("[data-view]").forEach((item) => item.addEventListener("click", (event) => {
  event.preventDefault();
  navigate(item.dataset.view);
}));
document.querySelectorAll("[data-view-jump]").forEach((item) => item.addEventListener("click", () => navigate(item.dataset.viewJump)));

document.querySelector("#menuToggle").addEventListener("click", () => sidebar.classList.add("open"));
document.querySelector("#sidebarClose").addEventListener("click", () => sidebar.classList.remove("open"));

document.querySelectorAll('[data-action="create"]').forEach((button) => button.addEventListener("click", () => {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}));
document.querySelector('[data-action="new-content"]').addEventListener("click", () => showToast("Content job mới", "Chọn template để bắt đầu."));
document.querySelector("#modalClose").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
document.querySelectorAll("[data-modal-jump]").forEach((item) => item.addEventListener("click", () => { closeModal(); navigate(item.dataset.modalJump); }));

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

document.querySelector("#generateDemo").addEventListener("click", (event) => {
  event.currentTarget.querySelector("strong").textContent = "Đang chuẩn bị workflow...";
  setTimeout(() => {
    event.currentTarget.querySelector("strong").textContent = "Generate content";
    showToast("Đã tạo content job", "Demo không gọi API hoặc sử dụng token thật.");
  }, 900);
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.querySelector("#globalSearch").focus();
  }
  if (event.key === "Escape") closeModal();
});

const initialView = location.hash.replace("#", "") || "overview";
navigate(initialView);

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
    const response = await fetch("/api/openrouter/usage", { headers: { Accept: "application/json", "X-Admin-Token": gatewayAdminToken } });
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
    const response = await fetch("/api/openrouter/usage", { method: "POST", headers: { "Content-Type": "application/json", "X-Admin-Token": gatewayAdminToken }, body: JSON.stringify({ apiKey: apiKeyInput.value, category }) });
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
