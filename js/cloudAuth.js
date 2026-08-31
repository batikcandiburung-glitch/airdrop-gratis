/* ==========================================
   CLOUDAUTH.JS
   Login / Daftar / Logout, halaman Profile,
   dan ganti password (Security page).
========================================== */

import { showToast } from "./helpers.js";
import { showConfirm } from "./dialog.js";
import { loginWithEmail, registerWithEmail, logoutCloud, getCurrentUser, changePassword, isCloudSyncConfigured } from "./cloudSync.js";

const cloudAuthModal = document.getElementById("cloudAuthModal");
const cloudAuthEmail = document.getElementById("cloudAuthEmail");
const cloudAuthPassword = document.getElementById("cloudAuthPassword");
const cloudAuthError = document.getElementById("cloudAuthError");
const cloudAuthSkip = document.getElementById("cloudAuthSkip");
const cloudAuthLoginBtn = document.getElementById("cloudAuthLoginBtn");
const cloudAuthRegisterLink = document.getElementById("cloudAuthRegisterLink");

const profileLoggedInView = document.getElementById("profileLoggedInView");
const profileLoggedOutView = document.getElementById("profileLoggedOutView");
const profileEmailDisplay = document.getElementById("profileEmailDisplay");
const profileAvatar = document.getElementById("profileAvatar");
const profileLoginBtn = document.getElementById("profileLoginBtn");
const profileLogoutBtn = document.getElementById("profileLogoutBtn");

const securityCurrentPassword = document.getElementById("securityCurrentPassword");
const securityNewPassword = document.getElementById("securityNewPassword");
const securityError = document.getElementById("securityError");
const securityUpdateBtn = document.getElementById("securityUpdateBtn");

let cloudAuthMode = "login"; // "login" atau "register"

/* ==========================================
   CLOUD AUTH MODAL
========================================== */

export function showCloudAuthModal() {

    if (!isCloudSyncConfigured()) {
        showToast("Cloud sync sedang dinonaktifkan — data hanya tersimpan di device ini.", 3000, "warning");
        return;
    }

    cloudAuthError.style.display = "none";
    cloudAuthModal.style.display = "flex";
    document.body.classList.add("modal-open");
}

function closeCloudAuthModal() {
    cloudAuthModal.style.display = "none";
    document.body.classList.remove("modal-open");
}

function setCloudAuthError(message) {
    cloudAuthError.textContent = message;
    cloudAuthError.style.display = "block";
}

function friendlyAuthError(error) {

    const code = error && error.code ? error.code : "";

    if (code.includes("invalid-email")) return "Format email tidak valid.";
    if (code.includes("user-not-found") || code.includes("invalid-credential")) return "Email/password salah atau belum terdaftar.";
    if (code.includes("wrong-password")) return "Password salah.";
    if (code.includes("email-already-in-use")) return "Email ini sudah terdaftar, coba Login.";
    if (code.includes("weak-password")) return "Password minimal 6 karakter.";

    return "Gagal login/daftar, coba lagi.";

}

function withUiTimeout(promise, ms) {

    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms))
    ]);

}

/* ==========================================
   PROFILE PAGE STATE
========================================== */

export function refreshProfilePage() {

    const user = getCurrentUser();

    if (user) {

        profileLoggedInView.style.display = "block";
        profileLoggedOutView.style.display = "none";

        profileEmailDisplay.textContent = user.email;
        profileAvatar.textContent = user.email.charAt(0).toUpperCase();

    } else {

        profileLoggedInView.style.display = "none";
        profileLoggedOutView.style.display = "block";

        securityCurrentPassword.value = "";
        securityNewPassword.value = "";
        securityError.style.display = "none";

    }

}

/* ==========================================
   INIT
========================================== */

export function initCloudAuth() {

    cloudAuthRegisterLink.onclick = (e) => {

        e.preventDefault();

        cloudAuthMode = cloudAuthMode === "login" ? "register" : "login";

        cloudAuthLoginBtn.textContent = cloudAuthMode === "login" ? "Login" : "Daftar";
        cloudAuthRegisterLink.textContent = cloudAuthMode === "login" ? "Daftar sekarang" : "Login di sini";
        cloudAuthRegisterLink.previousSibling.textContent = cloudAuthMode === "login" ? "Belum punya akun? " : "Sudah punya akun? ";

        cloudAuthError.style.display = "none";

    };

    cloudAuthSkip.onclick = () => {
        closeCloudAuthModal();
        showToast("Mode offline — data hanya tersimpan di device ini.", 3000, "warning");
    };

    cloudAuthLoginBtn.onclick = async () => {

        const email = cloudAuthEmail.value.trim();
        const password = cloudAuthPassword.value;

        if (!email || !password) {
            setCloudAuthError("Email & password wajib diisi.");
            return;
        }

        cloudAuthLoginBtn.disabled = true;
        cloudAuthLoginBtn.textContent = "Memproses...";

        try {

            const action = cloudAuthMode === "login"
                ? loginWithEmail(email, password)
                : registerWithEmail(email, password);

            // Batas waktu 8 detik: cukup toleran untuk jaringan 4G yang
            // agak lambat, tapi tombol tidak akan macet selamanya walau
            // koneksi ke server lambat/gagal total.
            const user = await withUiTimeout(action, 8000);

            closeCloudAuthModal();

            refreshProfilePage();

            showToast("Berhasil login, memuat data...");

            setTimeout(() => location.reload(), 700);

            return;

        } catch (error) {

            console.error("[CloudAuth]", error);

            if (error.message === "TIMEOUT") {
                setCloudAuthError("Koneksi ke server lambat/gagal. Periksa jaringan lalu coba lagi.");
            } else {
                setCloudAuthError(friendlyAuthError(error));
            }

        }

        cloudAuthLoginBtn.disabled = false;
        cloudAuthLoginBtn.textContent = cloudAuthMode === "login" ? "Login" : "Daftar";

    };

    profileLoginBtn.onclick = showCloudAuthModal;

    profileLogoutBtn.onclick = async () => {

        const user = getCurrentUser();

        if (!user) return;

        const confirmed = await showConfirm(`Logout dari ${user.email}? Data tetap tersimpan di cloud.`, "Logout");

        if (confirmed) {
            await logoutCloud();
            showToast("Berhasil logout.");
            refreshProfilePage();
        }

    };

    securityUpdateBtn.onclick = async () => {

        const current = securityCurrentPassword.value;
        const next = securityNewPassword.value;

        if (!current || !next) {
            securityError.textContent = "Semua field wajib diisi.";
            securityError.style.display = "block";
            return;
        }

        if (next.length < 6) {
            securityError.textContent = "Password baru minimal 6 karakter.";
            securityError.style.display = "block";
            return;
        }

        securityUpdateBtn.disabled = true;
        securityUpdateBtn.textContent = "Memproses...";

        try {

            await withUiTimeout(changePassword(current, next), 8000);

            securityCurrentPassword.value = "";
            securityNewPassword.value = "";
            securityError.style.display = "none";

            showToast("Password berhasil diubah.");

        } catch (error) {

            console.error("[Security]", error);

            let msg = "Gagal mengubah password.";

            if (error.message === "TIMEOUT") msg = "Koneksi lambat/gagal, coba lagi.";
            else if (error.code && error.code.includes("wrong-password")) msg = "Password saat ini salah.";
            else if (error.code && error.code.includes("weak-password")) msg = "Password baru terlalu lemah.";

            securityError.textContent = msg;
            securityError.style.display = "block";

        }

        securityUpdateBtn.disabled = false;
        securityUpdateBtn.textContent = "Update Password";

    };

}
