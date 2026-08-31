/* ==========================================
   AIRDROP HUB V5
   APP.JS — application bootstrap
========================================== */

import { initEvents } from "./event.js";
import { loadProjects, resetDailyTasks, cleanupStaleProjects } from "./storage.js";
import { renderProjects } from "./render.js";
import { updateDashboard } from "./dashboard.js";
import { showLoading, hideLoading, showToast, addNotification } from "./helpers.js";
import { setProjects } from "./project.js";
import { initWallet } from "./wallet.js";
import { initDialog } from "./dialog.js";
import { initNavigation } from "./navigation.js";
import { initNotifications } from "./notifications.js";
import { initCloudAuth, showCloudAuthModal, refreshProfilePage } from "./cloudAuth.js";
import { initFirebaseApp, waitForPersistedSession } from "./cloudSync.js";

/* ==========================================
   PROJECT VIEW REFRESH
   (daily reset + stale cleanup + re-render)
========================================== */

function refreshProjectsView(showStaleToast = true) {

    let projects = loadProjects();

    // Reset task harian bila hari sudah berganti
    projects = resetDailyTasks(projects);

    // Hapus otomatis project Waitlist/Pending yang tidak diupdate 2 bulan
    const cleanup = cleanupStaleProjects(projects);
    projects = cleanup.projects;

    setProjects(projects);

    updateDashboard(projects);

    renderProjects();

    if (showStaleToast && cleanup.removedCount > 0) {

        const msg = `${cleanup.removedCount} stale Waitlist/Pending project(s) auto-removed (no update in 2 months).`;

        showToast(msg, 4000);
        addNotification(msg, "warning");

    }

}

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshProjectsView();
});

/* ==========================================
   CLOUD SYNC (background, non-blocking)
========================================== */

async function runCloudSyncInBackground(configured) {

    if (!configured) return;

    try {

        const existingUser = await waitForPersistedSession();

        if (existingUser) {

            showToast("Cloud sync aktif — login sebagai " + existingUser.email, 2500);
            refreshProfilePage();

            // Data lokal mungkin baru saja ditimpa oleh data cloud, refresh tampilan.
            refreshProjectsView(false);

        } else {

            showCloudAuthModal();
            refreshProfilePage();

        }

    } catch (error) {

        console.warn("[CloudSync] Gagal sync di background, tetap pakai data lokal:", error);

    }

}

/* ==========================================
   INITIALIZE APPLICATION
========================================== */

document.addEventListener("DOMContentLoaded", async () => {

    showLoading();

    initDialog();

    try {

        // Siapkan koneksi Firebase (kalau sudah dikonfigurasi), tapi JANGAN
        // ditunggu (await) di sini — biar app langsung tampil pakai data
        // lokal dulu, cloud sync menyusul di belakang layar.
        const configured = initFirebaseApp();

        runCloudSyncInBackground(configured);

        refreshProjectsView();

        initEvents();
        initWallet();
        initNotifications();
        initCloudAuth();

        initNavigation({
            onProfileOpen: refreshProfilePage,
            onLangChange: () => refreshProjectsView(false)
        });

        // Mengecek pergantian hari setiap 1 menit
        setInterval(refreshProjectsView, 60000);

    } catch (error) {

        console.error(error);
        showToast("Something went wrong while loading the app.", 4000, "error");

    } finally {

        hideLoading();

    }

});

window.addEventListener("offline", () => console.warn("Offline Mode"));
window.addEventListener("online", () => console.log("Online"));
