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
