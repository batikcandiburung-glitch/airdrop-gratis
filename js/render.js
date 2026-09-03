/* ==========================================
   RENDER.JS
========================================== */

import { formatUrl, sortProjects, statusClass, statusLabel, formatDate } from "./helpers.js";
import { updateDashboard } from "./dashboard.js";
import {
    filterProjects,
    deleteProject,
    editProject,
    getProjects
} from "./project.js";
import { saveProjects } from "./storage.js";
import { getWallets } from "./wallet.js";
import { t } from "./i18n.js";
import { ICON_CHECK, ICON_TRASH } from "./icons.js";

/* ==========================================
   ELEMENT
========================================== */

const projectList = document.getElementById("projectList");
const search = document.getElementById("search");
const sortBy = document.getElementById("sortBy");
const filterStatus = document.getElementById("filterStatus");
const filterTask = document.getElementById("filterTask");
const quickFilter = document.getElementById("quickFilter");

/* ==========================================
   RENDER
========================================== */

export function renderProjects() {

    const filtered = filterProjects(
        search.value,
        filterStatus.value,
        filterTask.value,
        quickFilter.value
    );

    const projects = sortProjects(
    filtered,
    sortBy.value
);

    updateDashboard(getProjects());

    if (projects.length === 0) {

        projectList.innerHTML = `
            <div class="empty">
                ${t("projects.emptyFiltered")}
            </div>
        `;

        return;
    }

    const taskTypeLabel = (value) => {
        switch (value) {
            case "Daily": return t("project.daily");
            case "Weekly": return t("project.weekly");
            case "Testnet": return t("project.testnet");
            case "Mainnet": return t("project.mainnet");
            case "One Time": return t("filter.oneTime");
            default: return value;
        }
    };

    const priorityLabel = (value) => {
        switch (value) {
            case "Low": return t("project.low");
            case "Medium": return t("project.medium");
            case "High": return t("project.high");
            default: return value;
        }
    };

    let html = "";

    projects.forEach(project => {

        const linkedWallet = getWallets().find(
            wallet => String(wallet.id) === String(project.wallet)
        );

        html += `
        <div class="project-card" data-status="${project.status}">

            <div class="project-title">

                <h3>${project.name}</h3>

                <div class="title-actions">

                    <span class="badge ${statusClass(project.status)}">

                        ${statusLabel(project.status)}

                    </span>

                    <a
                        class="icon-btn icon-btn-blue"
                        href="${formatUrl(project.website)}"
                        target="_blank"
                        title="${t("project.website.title")}">

                        <i class="fa-solid fa-globe" aria-hidden="true"></i>

                    </a>

                    ${project.status === "Active"
                        ? `
                            <button
                                class="icon-btn icon-btn-green"
                                data-action="daily"
                                data-id="${project.id}"
                                ${project.dailyDone ? "disabled" : ""}
                                title="${project.dailyDone ? t("project.doneCompleted") : t("project.markDone")}">

                                <i class="check-icon">${ICON_CHECK}</i>

                            </button>
                       `
                       : ""
                    }

                </div>

            </div>

            <button
                class="detail-toggle"
                data-action="toggle"
                data-id="${project.id}">

                <span>${t("project.viewDetails")}</span>
                <i class="fa-solid fa-chevron-down detail-arrow" aria-hidden="true"></i>

            </button>

            <div class="project-detail" id="detail-${project.id}">

                <div class="chip-group">

                    <span class="chip"><i class="fa-solid fa-link" aria-hidden="true"></i> ${project.network}</span>

                    <span class="chip ${linkedWallet ? "" : "chip-muted"}">
                        <i class="fa-solid fa-wallet" aria-hidden="true"></i> ${linkedWallet ? linkedWallet.address : t("wallet.noWalletLinked")}
                    </span>

                </div>

                <div class="info-grid">

                    <div class="info-tile">
                        <i class="fa-solid fa-list-check info-icon" aria-hidden="true"></i>
                        <div>
                            <div class="info-label">${t("project.task")}</div>
                            <div class="info-value">${taskTypeLabel(project.taskType)}</div>
                        </div>
                    </div>

                    <div class="info-tile">
                        <i class="fa-solid fa-flag info-icon" aria-hidden="true"></i>
                        <div>
                            <div class="info-label">${t("project.priority")}</div>
                            <div class="info-value">${priorityLabel(project.priority)}</div>
                        </div>
                    </div>

                    <div class="info-tile">
                        <i class="fa-solid fa-calendar info-icon" aria-hidden="true"></i>
                        <div>
                            <div class="info-label">${t("project.deadline")}</div>
                            <div class="info-value">${project.deadline || "-"}</div>
                        </div>
                    </div>

                </div>

                <div class="note">${project.note ? project.note.trim() : "-"}</div>

                <div class="project-action">

                    <button

                        class="btn-gray"
                        data-action="edit"
                        data-id="${project.id}">

                        <i class="fa-solid fa-pen" aria-hidden="true"></i> ${t("project.editBtn")}

                    </button>

                    <button
                        class="btn-red"
                        data-action="delete"
                        data-id="${project.id}">

                        <i class="trash-icon">${ICON_TRASH}</i> ${t("project.deleteBtn")}

                    </button>

                </div>

                <div class="project-meta">
                    ${t("project.added")} ${formatDate(project.createdAt)} · ${t("project.lastUpdated")} ${formatDate(project.updatedAt)}
                </div>

            </div>

        </div>
        `;

    });

    projectList.innerHTML = html;

}

/* ==========================================
   EVENT DELEGATION
========================================== */

projectList.addEventListener("click", async (e) => {

    const button = e.target.closest("button");

    if (!button) return;

    const action = button.dataset.action;
    const id = Number(button.dataset.id);

    switch (action) {

        case "toggle":

            const detail = document.getElementById(`detail-${id}`);

            if (!detail) return;

            const willOpen = !detail.classList.contains("open");

            // Tutup semua detail lain yang sedang terbuka
            document.querySelectorAll(".project-detail.open").forEach(openDetail => {

                if (openDetail === detail) return;

                openDetail.classList.remove("open");

                const otherToggle = openDetail
                    .closest(".project-card")
                    .querySelector(".detail-toggle");

                if (otherToggle) {

                    otherToggle.classList.remove("open");

                    otherToggle.querySelector("span").textContent = "View details";

                }

            });

            detail.classList.toggle("open", willOpen);

            button.classList.toggle("open", willOpen);

            button.querySelector("span").textContent =
                willOpen ? "Hide details" : "View details";

            break;

        case "daily":

            const project = getProjects().find(
            p => p.id === id
            );

            if (!project) return;

            project.dailyDone = true;

            project.updatedAt = Date.now();

            saveProjects(getProjects());

            renderProjects();

            break;
       
       case "edit":

            editProject(id);

            break;

        case "delete":

            const deleted = await deleteProject(id);

            if (deleted) {

                renderProjects();

            }

            break;

    }

});
