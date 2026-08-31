/* ==========================================
   STORAGE.JS
   Local Storage Manager
========================================== */

export const STORAGE_KEY = "airdropHub";

import { pushToCloud } from "./cloudSync.js";

export function loadProjects() {

    try {

        const data = localStorage.getItem(STORAGE_KEY);

        if (!data) return [];

        const projects = JSON.parse(data);

        return Array.isArray(projects) ? projects : [];

    } catch (error) {

        console.error("Gagal membaca LocalStorage:", error);
        return [];

    }

}

export function saveProjects(projects) {

    try {

        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

        pushToCloud();

    } catch (error) {

        console.error("Gagal menyimpan LocalStorage:", error);

    }

}

/* ==========================================
   DAILY TASK RESET
========================================== */

const DAILY_RESET_KEY = "airdropHub_lastReset";

export function resetDailyTasks(projects) {

    const now = new Date();

    const today =
        now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0");

    const lastReset = localStorage.getItem(DAILY_RESET_KEY);

    if (lastReset === today) {
        return projects;
    }

    projects.forEach(project => {

        if (project.status !== "Active") return;

        switch (project.taskType) {

            case "Daily":
            case "Weekly":
            case "Testnet":
            case "Mainnet":
                project.dailyDone = false;
                break;

        }

    });

    localStorage.setItem(DAILY_RESET_KEY, today);

    saveProjects(projects);

    return projects;

}

/* ==========================================
   AUTO DELETE PROJECT WAITLIST/PENDING
   YANG TIDAK DIUPDATE SELAMA 2 BULAN
========================================== */

const STALE_STATUSES = ["Waitlist", "Pending"];

// approx 2 bulan (60 hari)
const STALE_THRESHOLD_MS = 60 * 24 * 60 * 60 * 1000;

export function cleanupStaleProjects(projects) {

    const now = Date.now();

    const remaining = [];

    let removedCount = 0;

    projects.forEach(project => {

        const lastActivity = project.updatedAt || project.createdAt || now;

        const isStale =
            STALE_STATUSES.includes(project.status) &&
            (now - lastActivity) > STALE_THRESHOLD_MS;

        if (isStale) {
            removedCount++;
        } else {
            remaining.push(project);
        }

    });

    if (removedCount > 0) {
        saveProjects(remaining);
    }

    return {
        projects: remaining,
        removedCount: removedCount
    };

}
