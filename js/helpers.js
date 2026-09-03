/* ==========================================
   HELPERS.JS
========================================== */

import { showAlert } from "./dialog.js";
import { t } from "./i18n.js";
import { ICON_CHECK, ICON_XMARK } from "./icons.js";

/* ==========================
FORMAT URL
========================== */

export function formatUrl(url = "") {

    url = url.trim();

    if (url === "") return "#";

    if (
        url.startsWith("http://") ||
        url.startsWith("https://")
    ) {
        return url;
    }

    return "https://" + url;

}

/* ==========================
QUICK FILTER PREDICATES
(dipakai bareng oleh dashboard.js untuk hitung,
dan project.js untuk filter list)
========================== */

export function isTaskDueToday(project) {

    if (project.status !== "Active") return false;

    switch (project.taskType) {

        case "Daily":
            return !project.dailyDone;

        case "Weekly":
            return isTodayWeeklyTask(project) && !project.dailyDone;

        case "Testnet":
        case "Mainnet":
            return !project.dailyDone;

        default:
            return false;

    }

}

export function isDeadlineToday(project) {

    if (!project.deadline) return false;

    const now = new Date();
    const dl = new Date(project.deadline);

    return (
        dl.getFullYear() === now.getFullYear() &&
        dl.getMonth() === now.getMonth() &&
        dl.getDate() === now.getDate()
    );

}

function isTodayWeeklyTask(project) {

    if (!project.deadline) return true;

    const deadline = new Date(project.deadline);
    const today = new Date();

    return deadline.getDay() === today.getDay();

}

/* ==========================
FORMAT DATE
========================== */

export function formatDate(timestamp) {

    if (!timestamp) return "-";

    const date = new Date(timestamp);

    if (isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-US", {

        day: "numeric",
        month: "short",
        year: "numeric"

    });

}

/* ==========================
TOAST
========================== */

export function showToast(message, duration = 2500, type = "success") {

    const toast = document.getElementById("toast");
    const text = document.getElementById("toastText");
    const icon = document.getElementById("toastIcon");

    if (!toast || !text) return;

    text.textContent = message;

    if (icon) {

        icon.innerHTML = type === "error" ? ICON_XMARK : ICON_CHECK;

    }

    toast.classList.toggle("toast-error", type === "error");

    toast.classList.add("show");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {

        toast.classList.remove("show");

    }, duration);

}

/* ==========================
NOTIFICATION CENTER
(riwayat error/peringatan sistem, terpisah dari toast sekilas)
========================== */

const NOTIF_KEY = "airdropHub_notifications";
const MAX_NOTIFS = 20;

export function addNotification(message, type = "info") {

    const list = getNotifications();

    list.unshift({
        id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        message,
        type, // "info" | "warning" | "error"
        createdAt: new Date().toISOString(),
        read: false
    });

    localStorage.setItem(NOTIF_KEY, JSON.stringify(list.slice(0, MAX_NOTIFS)));

    window.dispatchEvent(new CustomEvent("airdrophub:notification"));

}

export function getNotifications() {

    try {

        const raw = localStorage.getItem(NOTIF_KEY);
        const parsed = raw ? JSON.parse(raw) : [];

        return Array.isArray(parsed) ? parsed : [];

    } catch (error) {

        return [];

    }

}

export function unreadNotificationCount() {

    return getNotifications().filter((n) => !n.read).length;

}

export function markAllNotificationsRead() {

    const list = getNotifications().map((n) => ({ ...n, read: true }));

    localStorage.setItem(NOTIF_KEY, JSON.stringify(list));

    window.dispatchEvent(new CustomEvent("airdrophub:notification"));

}

export function clearNotifications() {

    localStorage.setItem(NOTIF_KEY, "[]");

    window.dispatchEvent(new CustomEvent("airdrophub:notification"));

}

/* ==========================
LOADING
========================== */

export function showLoading() {

    const loading = document.getElementById("loading");

    if (loading) {

        loading.style.display = "flex";

    }

}

export function hideLoading() {

    const loading = document.getElementById("loading");

    if (loading) {

        loading.style.display = "none";

    }

}

/* ==========================
CLEAR ADD FORM
========================== */

export function clearAddForm() {

    document.getElementById("name").value = "";

    document.getElementById("network").value = "";

    document.getElementById("website").value = "";

    document.getElementById("deadline").value = "";

    document.getElementById("note").value = "";

    document.getElementById("taskType").selectedIndex = 0;

    document.getElementById("priority").selectedIndex = 0;

    document.getElementById("status").selectedIndex = 0;

}

/* ==========================
VALIDASI PROJECT
========================== */

/* ==========================
VALIDASI PROJECT
========================== */

export async function validateProject(project) {

    if (!project.name.trim()) {

        await showAlert(t("project.nameRequired"));

        return false;

    }

    if (!project.network.trim()) {

        await showAlert(t("project.chainRequired"));

        return false;

    }

    return true;

}

/* ==========================
SORT PROJECT
========================== */

export function sortProjects(projects, mode = "default") {

    if (mode === "deadline") {

        return [...projects].sort((a, b) => {

            if (!a.deadline && !b.deadline)
                return a.name.localeCompare(b.name, "en");

            if (!a.deadline) return 1;
            if (!b.deadline) return -1;

            return new Date(a.deadline) - new Date(b.deadline);

        });

    }

    if (mode === "newest") {

        return [...projects].sort(
            (a, b) => b.id - a.id
        );

    }

    const statusOrder = {

        Active: 1,
        Waitlist: 2,
        Pending: 3,
        Complete: 4

    };

    return [...projects].sort((a, b) => {

        const statusA = statusOrder[a.status] ?? 999;
        const statusB = statusOrder[b.status] ?? 999;

        if (statusA !== statusB)
            return statusA - statusB;

        return a.name.localeCompare(
            b.name,
            "en",
            { sensitivity: "base" }
        );

    });

}

/* ==========================
STATUS COLOR
========================== */

export function statusClass(status) {

    switch (status) {

        case "Active":
            return "active";

        case "Pending":
            return "pending";

        case "Waitlist":
            return "waitlist";

        case "Complete":
            return "complete";

        default:
            return "";

    }

  }

/* ==========================
STATUS LABEL (untuk ditampilkan)
========================== */

export function statusLabel(status) {

    switch (status) {

        case "Active": return t("project.active");
        case "Pending": return t("project.pending");
        case "Waitlist": return t("project.waitlist");
        case "Complete": return t("project.complete");
        default: return status;

    }

}
