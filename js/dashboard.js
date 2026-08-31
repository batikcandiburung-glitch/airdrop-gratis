/* ==========================================
   DASHBOARD.JS
========================================== */

import { isTaskDueToday, isDeadlineToday } from "./helpers.js";

export function updateDashboard(projects) {

    const todayTask = document.getElementById("todayTask");
    const todayTaskCard = document.getElementById("todayTaskCard");
    const deadlineToday = document.getElementById("deadlineToday");
    const deadlineTodayCard = document.getElementById("deadlineTodayCard");
    const activeProject = document.getElementById("activeProject");
    const pendingProject = document.getElementById("pendingProject");
    const waitlistProject = document.getElementById("waitlistProject");
    const completeProject = document.getElementById("completedProject");

    let today = 0;
    let deadline = 0;
    let active = 0;
    let pending = 0;
    let waitlist = 0;
    let complete = 0;

    projects.forEach(project => {

        if (isDeadlineToday(project)) deadline++;

        switch (project.status) {
            case "Active": active++; break;
            case "Pending": pending++; break;
            case "Waitlist": waitlist++; break;
            case "Complete": complete++; break;
        }

        if (isTaskDueToday(project)) today++;

    });

    if (todayTask) todayTask.textContent = today;
    if (todayTaskCard) todayTaskCard.dataset.state = today > 0 ? "alert" : "clear";

    if (deadlineToday) deadlineToday.textContent = deadline;
    if (deadlineTodayCard) deadlineTodayCard.dataset.state = deadline > 0 ? "alert" : "clear";

    if (activeProject) activeProject.textContent = active;
    if (pendingProject) pendingProject.textContent = pending;
    if (waitlistProject) waitlistProject.textContent = waitlist;
    if (completeProject) completeProject.textContent = complete;

}
