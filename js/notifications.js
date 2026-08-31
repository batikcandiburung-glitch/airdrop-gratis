/* ==========================================
   NOTIFICATIONS.JS
   Bell icon, badge, notification center modal.
========================================== */

import { getNotifications, unreadNotificationCount, markAllNotificationsRead, clearNotifications } from "./helpers.js";
import { showConfirm } from "./dialog.js";
import { t } from "./i18n.js";

const notifBtn = document.getElementById("notifBtn");
const notifBadge = document.getElementById("notifBadge");
const notifModal = document.getElementById("notifModal");
const notifList = document.getElementById("notifList");
const notifEmpty = document.getElementById("notifEmpty");
const closeNotifModal = document.getElementById("closeNotifModal");
const notifClearBtn = document.getElementById("notifClearBtn");

const NOTIF_ICON = {
    error: "fa-solid fa-circle-exclamation",
    warning: "fa-solid fa-triangle-exclamation",
    info: "fa-solid fa-circle-info"
};

function timeAgo(isoString) {

    const diffMs = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / 60000);

    if (mins < 1) return "Baru saja";
    if (mins < 60) return `${mins} menit lalu`;

    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;

    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;

}

export function refreshNotifBadge() {

    const count = unreadNotificationCount();

    if (count > 0) {
        notifBadge.textContent = count > 9 ? "9+" : String(count);
        notifBadge.style.display = "flex";
    } else {
        notifBadge.style.display = "none";
    }

}

function renderNotifList() {

    const list = getNotifications();

    notifList.innerHTML = "";

    if (!list.length) {
        notifEmpty.style.display = "block";
        return;
    }

    notifEmpty.style.display = "none";

    list.forEach((n, index) => {

        const item = document.createElement("div");

        item.className = "notif-item" + (n.read ? "" : " unread");
        item.dataset.type = n.type || "info";
        item.style.animationDelay = `${index * 40}ms`;

        item.innerHTML = `
            <i class="notif-icon ${NOTIF_ICON[n.type] || NOTIF_ICON.info}"></i>
            <div class="notif-body">
                <div class="notif-message"></div>
                <div class="notif-time">${timeAgo(n.createdAt)}</div>
            </div>
        `;

        item.querySelector(".notif-message").textContent = n.message;

        notifList.appendChild(item);

    });

}

function closeNotifModalFn() {
    notifModal.style.display = "none";
    document.body.classList.remove("modal-open");
}

export function initNotifications() {

    notifBtn.onclick = () => {
        renderNotifList();
        notifModal.style.display = "flex";
        document.body.classList.add("modal-open");
        markAllNotificationsRead();
        refreshNotifBadge();
    };

    closeNotifModal.onclick = closeNotifModalFn;

    notifClearBtn.onclick = async () => {

        const confirmed = await showConfirm(t("notif.clearConfirm"), t("notif.clearBtn"));

        if (confirmed) {
            clearNotifications();
            renderNotifList();
            refreshNotifBadge();
        }

    };

    window.addEventListener("airdrophub:notification", refreshNotifBadge);

    refreshNotifBadge();

}
