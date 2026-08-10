/* ==========================================================
   AIRDROP HUB — APP.JS
   Single-file application logic (no build step required)
========================================================== */
(function () {
"use strict";

/* ==========================================================
   STORAGE
========================================================== */
const STORAGE_KEY = "airdropHub";
const WALLET_STORAGE_KEY = "airdropHub_wallets";
const DAILY_RESET_KEY = "airdropHub_lastReset";

function loadProjects() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to read projects from storage:", e);
    return [];
  }
}

function saveProjects(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save projects:", e);
  }
}

function loadWallets() {
  try {
    const data = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to read wallets from storage:", e);
    return [];
  }
}

function saveWallets(list) {
  try {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save wallets:", e);
  }
}

function resetDailyTasks(list) {
  const now = new Date();
  const today = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  const lastReset = localStorage.getItem(DAILY_RESET_KEY);

  if (lastReset === today) return list;

  list.forEach((p) => {
    if (p.status !== "Active") return;
    if (["Daily", "Weekly", "Testnet", "Mainnet"].includes(p.taskType)) {
      p.dailyDone = false;
    }
  });

  localStorage.setItem(DAILY_RESET_KEY, today);
  saveProjects(list);
  return list;
}

const STALE_STATUSES = ["Waitlist", "Pending"];
const STALE_THRESHOLD_MS = 60 * 24 * 60 * 60 * 1000; // ~2 months

function cleanupStaleProjects(list) {
  const now = Date.now();
  const remaining = [];
  let removedCount = 0;

  list.forEach((p) => {
    const lastActivity = p.updatedAt || p.createdAt || now;
    const isStale = STALE_STATUSES.includes(p.status) && now - lastActivity > STALE_THRESHOLD_MS;
    if (isStale) {
      removedCount++;
    } else {
      remaining.push(p);
    }
  });

  if (removedCount > 0) saveProjects(remaining);

  return { projects: remaining, removedCount };
}

/* ==========================================================
   STATE
========================================================== */
let projects = [];
let wallets = [];

const CHAIN_ICONS = {
  Ethereum: "🔷",
  Solana: "🟣",
  BNB: "🟡",
  "Gram (TON)": "💎",
  Lainnya: "🔗",
};

const CHAIN_COLORS = {
  Ethereum: "#5b8cff",
  Solana: "#a78bfa",
  BNB: "#f5b942",
  "Gram (TON)": "#33d6a6",
  Lainnya: "#8b93a6",
};

/* ==========================================================
   HELPERS
========================================================== */
function formatUrl(url) {
  url = (url || "").trim();
  if (url === "") return "#";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return "https://" + url;
}

function formatDate(timestamp) {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function showToast(message, duration, type) {
  duration = duration || 2500;
  type = type || "success";
  const toast = document.getElementById("toast");
  const text = document.getElementById("toastText");
  const icon = document.getElementById("toastIcon");
  if (!toast || !text) return;

  text.textContent = message;
  if (icon) icon.className = type === "error" ? "ti ti-x" : "ti ti-check";
  toast.classList.toggle("toast-error", type === "error");
  toast.classList.add("show");

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), duration);
}

function showLoading() {
  const el = document.getElementById("loading");
  if (el) el.style.display = "flex";
}

function hideLoading() {
  const el = document.getElementById("loading");
  if (el) el.style.display = "none";
}

function clearAddForm() {
  document.getElementById("name").value = "";
  document.getElementById("network").value = "";
  document.getElementById("website").value = "";
  document.getElementById("deadline").value = "";
  document.getElementById("note").value = "";
  document.getElementById("taskType").selectedIndex = 0;
  document.getElementById("priority").selectedIndex = 0;
  document.getElementById("status").selectedIndex = 0;
}

function sortProjects(list, mode) {
  mode = mode || "default";

  if (mode === "deadline") {
    return [...list].sort((a, b) => {
      if (!a.deadline && !b.deadline) return a.name.localeCompare(b.name);
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
  }

  if (mode === "newest") {
    return [...list].sort((a, b) => b.id - a.id);
  }

  const statusOrder = { Active: 1, Waitlist: 2, Pending: 3, Complete: 4 };
  return [...list].sort((a, b) => {
    const sa = statusOrder[a.status] ?? 999;
    const sb = statusOrder[b.status] ?? 999;
    if (sa !== sb) return sa - sb;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

function statusClass(status) {
  switch (status) {
    case "Active": return "active";
    case "Pending": return "pending";
    case "Waitlist": return "waitlist";
    case "Complete": return "complete";
    default: return "";
  }
}

function statusLabel(status) {
  return status === "Complete" ? "Completed" : status;
}

/* ==========================================================
   DIALOG (custom alert / confirm)
========================================== */
let alertModal, alertMessage, alertOkBtn;
let confirmModal, confirmMessage, confirmOkBtn, confirmCancelBtn;

function initDialog() {
  alertModal = document.getElementById("customAlertModal");
  alertMessage = document.getElementById("customAlertMessage");
  alertOkBtn = document.getElementById("customAlertOk");

  confirmModal = document.getElementById("customConfirmModal");
  confirmMessage = document.getElementById("customConfirmMessage");
  confirmOkBtn = document.getElementById("customConfirmOk");
  confirmCancelBtn = document.getElementById("customConfirmCancel");
}

function showAlert(message) {
  return new Promise((resolve) => {
    alertMessage.textContent = message;
    alertModal.style.display = "flex";
    document.body.classList.add("modal-open");

    function onOk() {
      alertModal.style.display = "none";
      document.body.classList.remove("modal-open");
      alertOkBtn.removeEventListener("click", onOk);
      resolve();
    }
    alertOkBtn.addEventListener("click", onOk);
  });
}

function showConfirm(message, confirmLabel) {
  confirmLabel = confirmLabel || "Delete";
  return new Promise((resolve) => {
    confirmMessage.textContent = message;
    confirmOkBtn.textContent = confirmLabel;
    confirmModal.style.display = "flex";
    document.body.classList.add("modal-open");

    function cleanup(result) {
      confirmModal.style.display = "none";
      document.body.classList.remove("modal-open");
      confirmOkBtn.removeEventListener("click", onOk);
      confirmCancelBtn.removeEventListener("click", onCancel);
      resolve(result);
    }
    function onOk() { cleanup(true); }
    function onCancel() { cleanup(false); }

    confirmOkBtn.addEventListener("click", onOk);
    confirmCancelBtn.addEventListener("click", onCancel);
  });
}

async function validateProject(project) {
  if (!project.name.trim()) {
    await showAlert("Project name is required.");
    return false;
  }
  if (!project.network.trim()) {
    await showAlert("Chain is required.");
    return false;
  }
  return true;
}

/* ==========================================================
   DASHBOARD
========================================================== */
function isTodayWeeklyTask(project) {
  if (!project.deadline) return true;
  const deadline = new Date(project.deadline);
  const today = new Date();
  return deadline.getDay() === today.getDay();
}

function updateDashboard(list) {
  const els = {
    today: document.getElementById("todayTask"),
    deadline: document.getElementById("deadlineToday"),
    active: document.getElementById("activeProject"),
    pending: document.getElementById("pendingProject"),
    waitlist: document.getElementById("waitlistProject"),
    complete: document.getElementById("completedProject"),
  };

  let today = 0, deadline = 0, active = 0, pending = 0, waitlist = 0, complete = 0;

  list.forEach((project) => {
    if (project.deadline) {
      const now = new Date();
      const dl = new Date(project.deadline);
      if (dl.getFullYear() === now.getFullYear() && dl.getMonth() === now.getMonth() && dl.getDate() === now.getDate()) {
        deadline++;
      }
    }

    switch (project.status) {
      case "Active": active++; break;
      case "Pending": pending++; break;
      case "Waitlist": waitlist++; break;
      case "Complete": complete++; break;
    }

    if (project.status !== "Active") return;

    switch (project.taskType) {
      case "Daily":
        if (!project.dailyDone) today++;
        break;
      case "Weekly":
        if (isTodayWeeklyTask(project) && !project.dailyDone) today++;
        break;
      case "Testnet":
      case "Mainnet":
        if (!project.dailyDone) today++;
        break;
    }
  });

  if (els.today) els.today.textContent = today;
  if (els.deadline) els.deadline.textContent = deadline;
  if (els.active) els.active.textContent = active;
  if (els.pending) els.pending.textContent = pending;
  if (els.waitlist) els.waitlist.textContent = waitlist;
  if (els.complete) els.complete.textContent = complete;
}

/* ==========================================================
   PROJECT CRUD
========================================================== */
function saveProjectsState() {
  saveProjects(projects);
}

async function addProject(data) {
  if (!(await validateProject(data))) return false;

  projects.push({
    id: Date.now(),
    name: data.name.trim(),
    network: data.network.trim(),
    wallet: data.wallet || "",
    website: data.website.trim(),
    taskType: data.taskType,
    deadline: data.deadline,
    priority: data.priority,
    status: data.status,
    note: data.note.trim(),
    dailyDone: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  saveProjectsState();
  closeAddModal();
  showToast("Project added successfully.");
  return true;
}

async function deleteProject(id) {
  const confirmed = await showConfirm("Delete this project? This action cannot be undone.");
  if (!confirmed) return false;

  projects = projects.filter((p) => p.id !== Number(id));
  saveProjectsState();
  showToast("Project deleted successfully.");
  return true;
}

function editProject(id) {
  const project = projects.find((p) => p.id === Number(id));
  if (!project) return;
  fillEditForm(project);
  openEditModal();
}

async function updateProject(data) {
  const project = projects.find((p) => p.id === Number(data.id));
  if (!project) return false;

  project.name = data.name.trim();
  project.network = data.network.trim();
  project.wallet = data.wallet || "";
  project.website = data.website.trim();
  project.taskType = data.taskType;
  project.deadline = data.deadline;
  project.priority = data.priority;
  project.status = data.status;
  project.note = data.note.trim();
  project.updatedAt = Date.now();

  if (!(await validateProject(project))) return false;

  saveProjectsState();
  closeEditModal();
  showToast("Project updated successfully.");
  return true;
}

function filterProjects(keyword, status, task) {
  keyword = (keyword || "").toLowerCase();
  status = status || "All";
  task = task || "All";

  return projects.filter((p) => {
    const keywordMatch = p.name.toLowerCase().includes(keyword) || p.network.toLowerCase().includes(keyword);
    const statusMatch = status === "All" || p.status === status;
    const taskMatch = task === "All" || p.taskType === task;
    return keywordMatch && statusMatch && taskMatch;
  });
}

/* ==========================================================
   WALLET CRUD
========================================================== */
function saveWalletsState() {
  saveWallets(wallets);
}

function getWallets() {
  return wallets;
}

async function addWallet(data) {
  const address = data.address.trim();
  const chain = data.chain.trim();

  if (!chain) {
    await showAlert("Chain is required.");
    return false;
  }
  if (!address) {
    await showAlert("Wallet address is required.");
    return false;
  }

  wallets.push({ id: Date.now(), chain, address, note: data.note.trim() });
  saveWalletsState();
  showToast("Wallet added successfully.");
  return true;
}

async function deleteWallet(id) {
  const confirmed = await showConfirm("Delete this wallet? This action cannot be undone.");
  if (!confirmed) return false;

  wallets = wallets.filter((w) => w.id !== Number(id));
  saveWalletsState();
  showToast("Wallet deleted successfully.");
  return true;
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast("Wallet address copied.")).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const temp = document.createElement("textarea");
  temp.value = text;
  temp.style.position = "fixed";
  temp.style.opacity = "0";
  document.body.appendChild(temp);
  temp.select();
  try {
    document.execCommand("copy");
    showToast("Wallet address copied.");
  } catch (e) {
    console.error("Failed to copy address:", e);
  }
  document.body.removeChild(temp);
}

function renderWallets() {
  const walletList = document.getElementById("walletList");
  if (!walletList) return;

  if (wallets.length === 0) {
    walletList.innerHTML = '<div class="empty">No wallets yet.</div>';
    return;
  }

  let html = "";
  wallets.forEach((wallet) => {
    const icon = CHAIN_ICONS[wallet.chain] || "🔗";
    const dot = CHAIN_COLORS[wallet.chain] || "#8b93a6";
    html += `
    <div class="simple-card">
      <div class="simple-card-info">
        <p class="chain-name"><span class="chain-dot" style="background:${dot}"></span>${icon} ${wallet.chain || "-"}</p>
        <p class="wallet-address-row">
          <span class="wallet-address-text">${wallet.address}</span>
          <button class="copy-btn" data-action="copy" data-address="${wallet.address}" title="Copy address">
            <i class="ti ti-copy"></i>
          </button>
        </p>
        <p>${wallet.note || "-"}</p>
      </div>
      <button class="btn-red" data-action="delete" data-id="${wallet.id}" style="flex:none; padding:11px 16px;">
        <i class="ti ti-trash"></i> Delete
      </button>
    </div>`;
  });

  walletList.innerHTML = html;
}

/* ==========================================================
   WALLET SELECT SYNC (chain -> wallet dropdown in project forms)
========================================================== */
function populateWalletSelect(selectEl, chain, selectedId) {
  selectedId = selectedId || "";
  if (!selectEl) return;

  if (!chain) {
    selectEl.innerHTML = '<option value="" disabled selected>Choose chain first</option>';
    selectEl.disabled = true;
    return;
  }

  const matches = wallets.filter((w) => w.chain === chain);

  if (matches.length === 0) {
    selectEl.innerHTML = `<option value="" disabled selected>No ${chain} wallet yet</option>`;
    selectEl.disabled = true;
    return;
  }

  selectEl.disabled = false;
  const icon = CHAIN_ICONS[chain] || "🔗";
  let html = `<option value="" disabled ${selectedId ? "" : "selected"}>Select wallet</option>`;

  matches.forEach((wallet) => {
    const isSelected = String(wallet.id) === String(selectedId);
    html += `<option value="${wallet.id}" ${isSelected ? "selected" : ""}>${icon} ${wallet.address}</option>`;
  });

  selectEl.innerHTML = html;
}

function initWalletSelectSync() {
  const networkSelect = document.getElementById("network");
  const walletSelect = document.getElementById("projectWallet");
  const editNetworkSelect = document.getElementById("editNetwork");
  const editWalletSelect = document.getElementById("editProjectWallet");

  networkSelect.addEventListener("change", () => populateWalletSelect(walletSelect, networkSelect.value));
  editNetworkSelect.addEventListener("change", () => populateWalletSelect(editWalletSelect, editNetworkSelect.value));
}

/* ==========================================================
   MODALS
========================================================== */
const projectModal = () => document.getElementById("projectModal");
const editModal = () => document.getElementById("editModal");

function lockBodyScroll() { document.body.classList.add("modal-open"); }
function unlockBodyScroll() { document.body.classList.remove("modal-open"); }

function openAddModal() {
  clearAddForm();
  populateWalletSelect(document.getElementById("projectWallet"), "");
  projectModal().style.display = "flex";
  lockBodyScroll();
}

function openEditModal() {
  editModal().style.display = "flex";
  lockBodyScroll();
}

function closeAddModal() {
  projectModal().style.display = "none";
  unlockBodyScroll();
}

function closeEditModal() {
  editModal().style.display = "none";
  unlockBodyScroll();
}

function fillEditForm(project) {
  document.getElementById("editId").value = project.id;
  document.getElementById("editName").value = project.name;
  document.getElementById("editNetwork").value = project.network;
  populateWalletSelect(document.getElementById("editProjectWallet"), project.network, project.wallet);
  document.getElementById("editWebsite").value = project.website;
  document.getElementById("editTaskType").value = project.taskType;
  document.getElementById("editDeadline").value = project.deadline || "";
  document.getElementById("editPriority").value = project.priority;
  document.getElementById("editStatus").value = project.status;
  document.getElementById("editNote").value = project.note;
}

function initModal() {
  document.getElementById("addProjectBtn").addEventListener("click", openAddModal);
  document.getElementById("closeModal").addEventListener("click", closeAddModal);
  document.getElementById("closeEditModal").addEventListener("click", closeEditModal);

  window.addEventListener("click", (e) => {
    if (e.target === projectModal()) closeAddModal();
    if (e.target === editModal()) closeEditModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAddModal();
      closeEditModal();
    }
  });
}

/* ==========================================================
   RENDER PROJECTS
========================================================== */
function renderProjects() {
  const projectList = document.getElementById("projectList");
  const search = document.getElementById("search");
  const sortBy = document.getElementById("sortBy");
  const filterStatus = document.getElementById("filterStatus");
  const filterTask = document.getElementById("filterTask");

  const filtered = filterProjects(search.value, filterStatus.value, filterTask.value);
  const sorted = sortProjects(filtered, sortBy.value);

  updateDashboard(projects);

  if (sorted.length === 0) {
    projectList.innerHTML = '<div class="empty">No projects match your filters.</div>';
    return;
  }

  let html = "";
  sorted.forEach((project) => {
    const linkedWallet = wallets.find((w) => String(w.id) === String(project.wallet));

    html += `
    <div class="project-card" data-status="${project.status}">
      <div class="project-title">
        <h3>${project.name}</h3>
        <div class="title-actions">
          <span class="badge ${statusClass(project.status)}">${statusLabel(project.status)}</span>
          <a class="icon-btn icon-btn-blue" href="${formatUrl(project.website)}" target="_blank" rel="noopener" title="Website">
            <i class="ti ti-world"></i>
          </a>
          ${project.status === "Active" ? `
            <button class="icon-btn icon-btn-green" data-action="daily" data-id="${project.id}" ${project.dailyDone ? "disabled" : ""} title="${project.dailyDone ? "Completed" : "Mark done"}">
              <i class="ti ${project.dailyDone ? "ti-checks" : "ti-check"}"></i>
            </button>` : ""}
        </div>
      </div>

      <button class="detail-toggle" data-action="toggle" data-id="${project.id}">
        <span>View details</span>
        <i class="ti ti-chevron-down detail-arrow"></i>
      </button>

      <div class="project-detail" id="detail-${project.id}">
        <div class="chip-group">
          <span class="chip"><i class="ti ti-link"></i> ${project.network}</span>
          <span class="chip ${linkedWallet ? "" : "chip-muted"}">
            <i class="ti ti-wallet"></i> ${linkedWallet ? linkedWallet.address : "No wallet linked"}
          </span>
        </div>

        <div class="info-grid">
          <div class="info-tile">
            <i class="ti ti-list-check info-icon"></i>
            <div><div class="info-label">Task</div><div class="info-value">${project.taskType}</div></div>
          </div>
          <div class="info-tile">
            <i class="ti ti-flag info-icon"></i>
            <div><div class="info-label">Priority</div><div class="info-value">${project.priority}</div></div>
          </div>
          <div class="info-tile info-tile-full">
            <i class="ti ti-calendar info-icon"></i>
            <div><div class="info-label">Deadline</div><div class="info-value">${project.deadline || "-"}</div></div>
          </div>
        </div>

        <div class="note">${project.note || "-"}</div>

        <div class="project-action">
          <button class="btn-gray" data-action="edit" data-id="${project.id}"><i class="ti ti-edit"></i> Edit</button>
          <button class="btn-red" data-action="delete" data-id="${project.id}"><i class="ti ti-trash"></i> Delete</button>
        </div>

        <div class="project-meta">Added ${formatDate(project.createdAt)} · Last updated ${formatDate(project.updatedAt)}</div>
      </div>
    </div>`;
  });

  projectList.innerHTML = html;
}

/* ==========================================================
   EVENT DELEGATION — PROJECT LIST
========================================================== */
function initProjectListEvents() {
  const projectList = document.getElementById("projectList");

  projectList.addEventListener("click", async (e) => {
    const button = e.target.closest("button");
    if (!button) return;

    const action = button.dataset.action;
    const id = Number(button.dataset.id);

    if (action === "toggle") {
      const detail = document.getElementById(`detail-${id}`);
      if (!detail) return;
      const willOpen = !detail.classList.contains("open");

      document.querySelectorAll(".project-detail.open").forEach((openDetail) => {
        if (openDetail === detail) return;
        openDetail.classList.remove("open");
        const otherToggle = openDetail.closest(".project-card").querySelector(".detail-toggle");
        if (otherToggle) {
          otherToggle.classList.remove("open");
          otherToggle.querySelector("span").textContent = "View details";
        }
      });

      detail.classList.toggle("open", willOpen);
      button.classList.toggle("open", willOpen);
      button.querySelector("span").textContent = willOpen ? "Hide details" : "View details";
    }

    if (action === "daily") {
      const project = projects.find((p) => p.id === id);
      if (!project) return;
      project.dailyDone = true;
      project.updatedAt = Date.now();
      saveProjectsState();
      renderProjects();
    }

    if (action === "edit") {
      editProject(id);
    }

    if (action === "delete") {
      const deleted = await deleteProject(id);
      if (deleted) renderProjects();
    }
  });
}

/* ==========================================================
   EVENT DELEGATION — WALLET LIST
========================================================== */
function initWalletListEvents() {
  const walletList = document.getElementById("walletList");

  walletList.addEventListener("click", async (e) => {
    const button = e.target.closest("button");
    if (!button) return;

    const action = button.dataset.action;

    if (action === "copy") {
      copyToClipboard(button.dataset.address);
      return;
    }

    const id = Number(button.dataset.id);
    if (action === "delete") {
      const success = await deleteWallet(id);
      if (success) renderWallets();
    }
  });
}

function initWalletModal() {
  const walletModal = document.getElementById("walletModal");
  const addWalletBtn = document.getElementById("addWalletBtn");
  const closeWalletModalBtn = document.getElementById("closeWalletModal");
  const saveWalletBtn = document.getElementById("saveWallet");

  function openWalletModal() {
    document.getElementById("walletChain").selectedIndex = 0;
    document.getElementById("walletAddress").value = "";
    document.getElementById("walletNote").value = "";
    walletModal.style.display = "flex";
    document.body.classList.add("modal-open");
  }

  function closeWalletModal() {
    walletModal.style.display = "none";
    document.body.classList.remove("modal-open");
  }

  addWalletBtn.addEventListener("click", openWalletModal);
  closeWalletModalBtn.addEventListener("click", closeWalletModal);

  window.addEventListener("click", (e) => {
    if (e.target === walletModal) closeWalletModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeWalletModal();
  });

  saveWalletBtn.addEventListener("click", async () => {
    const success = await addWallet({
      chain: document.getElementById("walletChain").value,
      address: document.getElementById("walletAddress").value,
      note: document.getElementById("walletNote").value,
    });
    if (success) {
      closeWalletModal();
      renderWallets();
    }
  });
}

function initWallet() {
  initWalletListEvents();
  initWalletModal();
  renderWallets();
}

/* ==========================================================
   FORM EVENTS
========================================================== */
function initEvents() {
  initModal();
  initWalletSelectSync();
  initProjectListEvents();

  const search = document.getElementById("search");
  const sortBy = document.getElementById("sortBy");
  const filterStatus = document.getElementById("filterStatus");
  const filterTask = document.getElementById("filterTask");
  const saveProjectBtn = document.getElementById("saveProject");
  const updateProjectBtn = document.getElementById("updateProject");

  search.addEventListener("input", renderProjects);
  sortBy.addEventListener("change", renderProjects);
  filterStatus.addEventListener("change", renderProjects);
  filterTask.addEventListener("change", renderProjects);

  saveProjectBtn.addEventListener("click", async () => {
    const success = await addProject({
      name: document.getElementById("name").value,
      network: document.getElementById("network").value,
      wallet: document.getElementById("projectWallet").value,
      website: document.getElementById("website").value,
      taskType: document.getElementById("taskType").value,
      deadline: document.getElementById("deadline").value,
      priority: document.getElementById("priority").value,
      status: document.getElementById("status").value,
      note: document.getElementById("note").value,
    });
    if (success) renderProjects();
  });

  updateProjectBtn.addEventListener("click", async () => {
    const success = await updateProject({
      id: document.getElementById("editId").value,
      name: document.getElementById("editName").value,
      network: document.getElementById("editNetwork").value,
      wallet: document.getElementById("editProjectWallet").value,
      website: document.getElementById("editWebsite").value,
      taskType: document.getElementById("editTaskType").value,
      deadline: document.getElementById("editDeadline").value,
      priority: document.getElementById("editPriority").value,
      status: document.getElementById("editStatus").value,
      note: document.getElementById("editNote").value,
    });
    if (success) renderProjects();
  });

  renderProjects();
}

/* ==========================================================
   CUSTOM DROPDOWN (status / task / sort filters)
========================================================== */
function initCustomDropdowns() {
  const dropdowns = document.querySelectorAll(".dropdown");

  dropdowns.forEach((dropdown) => {
    const button = dropdown.querySelector(".dropbtn");
    const menu = dropdown.querySelector(".dropdown-content");

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdowns.forEach((d) => { if (d !== dropdown) d.classList.remove("active"); });
      dropdown.classList.toggle("active");
    });

    menu.querySelectorAll("div").forEach((item) => {
      item.addEventListener("click", () => {
        menu.querySelectorAll("div").forEach((i) => i.classList.remove("selected"));
        item.classList.add("selected");

        const value = item.dataset.value;
        const target = item.dataset.target;
        const select = document.getElementById(target);
        select.value = value;
        select.dispatchEvent(new Event("change"));

        const label = button.querySelector(".label");
        if (label) label.textContent = item.textContent.trim();

        dropdown.classList.remove("active");
      });
    });
  });

  document.addEventListener("click", () => {
    dropdowns.forEach((dropdown) => dropdown.classList.remove("active"));
  });
}

/* ==========================================================
   NAVIGATION (bottom nav, hamburger side menu, wallet page)
========================================================== */
function initNavigation() {
  const homeBtn = document.getElementById("homeBtn");
  const profileBtn = document.getElementById("profileBtn");
  const addBottomBtn = document.getElementById("addBottomBtn");
  const searchBtn = document.getElementById("searchBtn");

  const homePage = document.getElementById("homePage");
  const profilePage = document.getElementById("profilePage");
  const walletPage = document.getElementById("walletPage");
  const allPages = [homePage, profilePage, walletPage];
  const bottomNavButtons = [homeBtn, searchBtn, addBottomBtn, profileBtn];

  function setActiveNav(activeBtn) {
    bottomNavButtons.forEach((btn) => btn.classList.remove("active"));
    if (activeBtn) activeBtn.classList.add("active");
  }

  function showPage(page) {
    allPages.forEach((p) => (p.style.display = "none"));
    page.style.display = "block";
  }

  homeBtn.onclick = () => { showPage(homePage); setActiveNav(homeBtn); };
  profileBtn.onclick = () => { showPage(profilePage); setActiveNav(profileBtn); };
  addBottomBtn.onclick = () => document.getElementById("addProjectBtn").click();
  searchBtn.onclick = () => {
    showPage(homePage);
    setActiveNav(homeBtn);
    document.getElementById("search").focus();
  };

  setActiveNav(homeBtn);

  const menuBtn = document.getElementById("menuBtn");
  const closeMenuBtn = document.getElementById("closeMenuBtn");
  const sideMenuOverlay = document.getElementById("sideMenuOverlay");
  const menuWalletBtn = document.getElementById("menuWalletBtn");
  const closeWalletPageBtn = document.getElementById("closeWalletPageBtn");
  const bottomNav = document.querySelector(".bottom-nav");

  function openWalletPage() {
    showPage(walletPage);
    setActiveNav(null);
    bottomNav.style.display = "none";
  }

  function closeWalletPage() {
    showPage(homePage);
    setActiveNav(homeBtn);
    bottomNav.style.display = "flex";
  }

  function openMenu() { sideMenuOverlay.classList.add("active"); }
  function closeMenu() { sideMenuOverlay.classList.remove("active"); }

  menuBtn.onclick = openMenu;
  closeMenuBtn.onclick = closeMenu;

  sideMenuOverlay.addEventListener("click", (e) => {
    if (e.target === sideMenuOverlay) closeMenu();
  });

  menuWalletBtn.onclick = () => { openWalletPage(); closeMenu(); };
  closeWalletPageBtn.onclick = () => closeWalletPage();
}

/* ==========================================================
   INITIALIZE APPLICATION
========================================================== */
function refreshData() {
  projects = loadProjects();
  projects = resetDailyTasks(projects);
  const cleanup = cleanupStaleProjects(projects);
  projects = cleanup.projects;
  return cleanup;
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    refreshData();
    renderProjects();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  showLoading();
  initDialog();

  try {
    wallets = loadWallets();
    const cleanup = refreshData();

    updateDashboard(projects);
    renderProjects();

    if (cleanup.removedCount > 0) {
      showToast(`${cleanup.removedCount} stale Waitlist/Pending project(s) auto-removed (no update in 2 months).`, 4000);
    }

    initEvents();
    initWallet();
    initCustomDropdowns();
    initNavigation();

    setInterval(() => {
      const cleanup2 = refreshData();
      renderProjects();
      if (cleanup2.removedCount > 0) {
        showToast(`${cleanup2.removedCount} stale Waitlist/Pending project(s) auto-removed (no update in 2 months).`, 4000);
      }
    }, 60000);

  } catch (error) {
    console.error(error);
    showToast("Something went wrong while loading the app.", 4000, "error");
  } finally {
    setTimeout(hideLoading, 400);
  }
});

window.addEventListener("beforeunload", () => console.log("Airdrop Hub saved"));
window.addEventListener("offline", () => console.warn("Offline mode"));
window.addEventListener("online", () => console.log("Back online"));

})();
