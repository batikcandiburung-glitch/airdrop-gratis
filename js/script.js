/* =========================================================
   State (in-memory only — sumber data asli ada di data.js)
   ========================================================= */
const state = {
  status: "all",
  query: "",
  sort: "priority",
};

const STATUS_META = {
  upcoming: { label: "Akan Datang", laneTitle: "Akan Datang — Belum Dimulai" },
  ongoing: { label: "Sedang Berjalan", laneTitle: "Sedang Berjalan — Perlu Aksi" },
  completed: { label: "Selesai", laneTitle: "Selesai — Sudah Diklaim" },
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

/* =========================================================
   Helpers
   ========================================================= */
function taskProgress(airdrop) {
  const total = airdrop.tasks.length;
  const done = airdrop.tasks.filter((t) => t.done).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d + "T00:00:00");
  if (isNaN(date)) return d;
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function matchesQuery(airdrop, q) {
  if (!q) return true;
  const hay = `${airdrop.name} ${airdrop.chain} ${airdrop.category}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

function sortAirdrops(list, sortKey) {
  const copy = [...list];
  if (sortKey === "priority") {
    copy.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  } else if (sortKey === "updated") {
    copy.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } else if (sortKey === "name") {
    copy.sort((a, b) => a.name.localeCompare(b.name));
  }
  return copy;
}

/* =========================================================
   Rendering
   ========================================================= */
function renderStats() {
  const counts = { upcoming: 0, ongoing: 0, completed: 0 };
  AIRDROP_DATA.forEach((a) => counts[a.status]++);
  document.getElementById("stat-total").textContent = AIRDROP_DATA.length;
  document.getElementById("stat-upcoming").textContent = counts.upcoming;
  document.getElementById("stat-ongoing").textContent = counts.ongoing;
  document.getElementById("stat-completed").textContent = counts.completed;
}

function cardTemplate(airdrop) {
  const progress = taskProgress(airdrop);
  const statusIndex = { upcoming: 1, ongoing: 2, completed: 3 }[airdrop.status];

  return `
    <article class="card" tabindex="0" role="button" data-id="${airdrop.id}" aria-label="Lihat detail ${airdrop.name}">
      <div class="card-top">
        <div class="card-id">
          <div class="card-mark">${initials(airdrop.name)}</div>
          <div>
            <p class="card-name">${airdrop.name}</p>
            <p class="card-chain">${airdrop.chain}</p>
          </div>
        </div>
        <span class="priority-flag" data-p="${airdrop.priority}" title="Prioritas ${airdrop.priority}"></span>
      </div>

      <div class="card-tags">
        <span class="tag">${airdrop.category}</span>
        <span class="tag">${STATUS_META[airdrop.status].label}</span>
      </div>

      <div class="card-progress-label">
        <span>Progres tugas</span>
        <span>${progress.done}/${progress.total}</span>
      </div>
      <div class="trajectory" data-status="${airdrop.status}">
        <div class="seg ${statusIndex >= 1 ? "filled" : ""}"><span></span></div>
        <div class="seg ${statusIndex >= 2 ? "filled" : ""}"><span></span></div>
        <div class="seg ${statusIndex >= 3 ? "filled" : ""}"><span></span></div>
      </div>

      <div class="card-updated">Diperbarui ${formatDate(airdrop.updatedAt)}</div>
    </article>
  `;
}

function renderBoard() {
  const board = document.getElementById("board");
  const filtered = AIRDROP_DATA.filter(
    (a) => (state.status === "all" || a.status === state.status) && matchesQuery(a, state.query)
  );

  if (filtered.length === 0) {
    board.innerHTML = `<div class="no-results">Tidak ada airdrop yang cocok dengan pencarian "${state.query}".</div>`;
    return;
  }

  const lanesToShow = state.status === "all" ? ["upcoming", "ongoing", "completed"] : [state.status];

  board.innerHTML = lanesToShow
    .map((laneStatus) => {
      const items = sortAirdrops(
        filtered.filter((a) => a.status === laneStatus),
        state.sort
      );
      if (items.length === 0) {
        return `
          <section class="lane" data-status="${laneStatus}">
            <div class="lane-head">
              <span class="lane-title">${STATUS_META[laneStatus].laneTitle}</span>
              <span class="lane-count">0</span>
            </div>
            <div class="empty-lane">Belum ada catatan di kategori ini.</div>
          </section>`;
      }
      return `
        <section class="lane" data-status="${laneStatus}">
          <div class="lane-head">
            <span class="lane-title">${STATUS_META[laneStatus].laneTitle}</span>
            <span class="lane-count">${items.length}</span>
          </div>
          <div class="card-grid">
            ${items.map(cardTemplate).join("")}
          </div>
        </section>`;
    })
    .join("");

  board.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => openDetail(card.dataset.id));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDetail(card.dataset.id);
      }
    });
  });
}

/* =========================================================
   Detail panel
   ========================================================= */
function openDetail(id) {
  const airdrop = AIRDROP_DATA.find((a) => a.id === id);
  if (!airdrop) return;
  const progress = taskProgress(airdrop);

  document.getElementById("detail-body").innerHTML = `
    <button class="detail-close" id="detail-close" aria-label="Tutup">✕</button>
    <span class="detail-status-badge" data-status="${airdrop.status}">${STATUS_META[airdrop.status].label}</span>
    <h2>${airdrop.name}</h2>
    <p class="chain-line">${airdrop.chain} · ${airdrop.category}</p>

    <div class="detail-section">
      <h3>Ringkasan</h3>
      <div class="meta-grid">
        <div class="meta-item"><div class="k">Snapshot</div><div class="v">${formatDate(airdrop.snapshotDate)}</div></div>
        <div class="meta-item"><div class="k">TGE</div><div class="v">${airdrop.tgeDate || "—"}</div></div>
        <div class="meta-item"><div class="k">Wallet</div><div class="v">${airdrop.walletTag}</div></div>
        <div class="meta-item"><div class="k">Prioritas</div><div class="v" style="text-transform:capitalize">${airdrop.priority}</div></div>
      </div>
    </div>

    <div class="detail-section">
      <h3>Tugas (${progress.done}/${progress.total})</h3>
      <ul class="task-list">
        ${airdrop.tasks
          .map(
            (t) => `
          <li class="task-item ${t.done ? "done" : ""}">
            <span class="task-check">${t.done ? "✓" : ""}</span>
            <span class="label">${t.label}</span>
          </li>`
          )
          .join("")}
      </ul>
    </div>

    ${
      airdrop.notes
        ? `<div class="detail-section"><h3>Catatan</h3><p class="detail-notes">${airdrop.notes}</p></div>`
        : ""
    }

    ${
      airdrop.links && airdrop.links.length
        ? `<div class="detail-section"><h3>Tautan</h3><div class="detail-links">
            ${airdrop.links.map((l) => `<a class="detail-link" href="${l.url}" target="_blank" rel="noopener">${l.label} ↗</a>`).join("")}
          </div></div>`
        : ""
    }
  `;

  document.getElementById("detail-close").addEventListener("click", closeDetail);
  document.getElementById("overlay").classList.add("open");
  document.getElementById("detail-panel").classList.add("open");
}

function closeDetail() {
  document.getElementById("overlay").classList.remove("open");
  document.getElementById("detail-panel").classList.remove("open");
}

/* =========================================================
   Controls wiring
   ========================================================= */
function wireControls() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      state.status = tab.dataset.status;
      renderBoard();
    });
  });

  document.getElementById("search").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderBoard();
  });

  document.getElementById("sort").addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderBoard();
  });

  document.getElementById("overlay").addEventListener("click", closeDetail);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDetail();
  });
}

/* =========================================================
   Init
   ========================================================= */
function init() {
  document.getElementById("year").textContent = new Date().getFullYear();
  renderStats();
  wireControls();
  renderBoard();
}

document.addEventListener("DOMContentLoaded", init);
