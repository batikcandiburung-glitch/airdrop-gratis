/* ==========================================
   MODAL.JS
========================================== */

import { clearAddForm } from "./helpers.js";
import { populateWalletSelect } from "./walletSelect.js";

/* ==========================================
   ELEMENT
========================================== */

const projectModal = document.getElementById("projectModal");
const editModal = document.getElementById("editModal");

const addProjectBtn = document.getElementById("addProjectBtn");
const closeModalBtn = document.getElementById("closeModal");
const closeEditModalBtn = document.getElementById("closeEditModal");

/* ==========================================
   LOCK BODY SCROLL
========================================== */

function lockBodyScroll() {
    document.body.classList.add("modal-open");
}

function unlockBodyScroll() {
    document.body.classList.remove("modal-open");
}

/* ==========================================
   OPEN MODAL
========================================== */

export function openAddModal() {

    clearAddForm();

    populateWalletSelect(document.getElementById("projectWallet"), "");

    projectModal.style.display = "flex";

    lockBodyScroll();

}

export function openEditModal() {

    editModal.style.display = "flex";

    lockBodyScroll();

}

/* ==========================================
   CLOSE MODAL
========================================== */

export function closeAddModal() {

    projectModal.style.display = "none";

    unlockBodyScroll();

}

export function closeEditModal() {

    editModal.style.display = "none";

    unlockBodyScroll();

}

/* ==========================================
   FILL EDIT FORM
========================================== */

export function fillEditForm(project) {

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

/* ==========================================
   REGISTER EVENT
========================================== */

export function initModal() {

    addProjectBtn.addEventListener("click", openAddModal);

    closeModalBtn.addEventListener("click", closeAddModal);
    closeEditModalBtn.addEventListener("click", closeEditModal);

    window.addEventListener("click", (e) => {

        if (e.target === projectModal) closeAddModal();
        if (e.target === editModal) closeEditModal();

    });

    document.addEventListener("keydown", (e) => {

        if (e.key === "Escape") {
            closeAddModal();
            closeEditModal();
        }

    });

}
