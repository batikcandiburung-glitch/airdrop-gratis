/* ==========================================
   CLOUD SYNC.JS
   Sinkronisasi data (projects, wallets) ke
   Firebase Firestore, login pakai Email/Password
   (supaya UID sama di semua device -> data nyambung).

   Cara kerja:
   - Kalau firebaseConfig.js belum diisi -> otomatis
     nonaktif, aplikasi tetap jalan normal via localStorage.
   - Kalau sudah dikonfigurasi -> user harus login/daftar
     dengan email, lalu data localStorage ditarik/ditimpa
     dari cloud, dan didorong ke cloud tiap kali disimpan.
   - Kalau device sedang offline / gagal konek, aplikasi
     tetap jalan normal pakai data lokal (tidak pernah blocking).
========================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import { firebaseConfig } from "./firebaseConfig.js";
import { addNotification } from "./helpers.js";

const PROJECTS_KEY = "airdropHub";
const WALLETS_KEY = "airdropHub_wallets";
const RESET_KEY = "airdropHub_lastReset";

let auth = null;
let db = null;
let currentUid = null;
let ready = false;
let pushTimer = null;

function isConfigured() {
    return (
        firebaseConfig &&
        firebaseConfig.apiKey &&
        !firebaseConfig.apiKey.startsWith("GANTI_")
    );
}

export function isCloudSyncEnabled() {
    return ready;
}

export function isCloudSyncConfigured() {
    return isConfigured();
}

export function getCurrentUser() {
    return auth ? auth.currentUser : null;
}

function userDocRef() {
    return doc(db, "airdropHubUsers", currentUid);
}

/* ==========================================
   INIT APP (tidak login, cuma siapkan koneksi)
========================================== */

export function initFirebaseApp() {

    if (!isConfigured()) {
        console.log("[CloudSync] firebaseConfig.js belum diisi, jalan mode offline.");
        return false;
    }

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    return true;

}

/* ==========================================
   CEK SESI YANG SUDAH LOGIN SEBELUMNYA
   (Firebase otomatis menyimpan sesi di browser,
   jadi user tidak perlu login ulang tiap buka app)
========================================== */

function withTimeout(promise, ms, fallbackValue) {

    return Promise.race([
        promise,
        new Promise((resolve) => setTimeout(() => resolve(fallbackValue), ms))
    ]);

}

export function waitForPersistedSession() {

    if (!auth) return Promise.resolve(null);

    return new Promise((resolve) => {

        let settled = false;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {

            if (settled) return; // sudah keburu timeout, abaikan callback telat

            settled = true;
            unsubscribe();

            if (user) {

                currentUid = user.uid;
                ready = true;

                await pullFromCloud();

            }

            resolve(user);

        });

        // Jangan pernah tahan app lebih dari 4 detik hanya buat cek sesi login.
        setTimeout(() => {

            if (!settled) {
                settled = true;
                resolve(null);
            }

        }, 4000);

    });

}

/* ==========================================
   LOGIN / DAFTAR / LOGOUT
========================================== */

export async function loginWithEmail(email, password) {

    const cred = await signInWithEmailAndPassword(auth, email, password);

    currentUid = cred.user.uid;
    ready = true;

    await pullFromCloud();

    return cred.user;

}

export async function registerWithEmail(email, password) {

    const cred = await createUserWithEmailAndPassword(auth, email, password);

    currentUid = cred.user.uid;
    ready = true;

    // Akun baru -> belum ada data di cloud, upload data lokal yang ada sekarang.
    await pushToCloud(true);

    return cred.user;

}

export async function logoutCloud() {

    if (auth) await signOut(auth);

    ready = false;
    currentUid = null;

}

/* ==========================================
   GANTI PASSWORD
========================================== */

export async function changePassword(currentPassword, newPassword) {

    const user = auth ? auth.currentUser : null;

    if (!user) throw new Error("NOT_LOGGED_IN");

    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    await reauthenticateWithCredential(user, credential);

    await updatePassword(user, newPassword);

}

/* ==========================================
   PULL (cloud -> localStorage)
========================================== */

export async function pullFromCloud() {

    if (!ready) return;

    try {

        const snap = await withTimeout(getDoc(userDocRef()), 6000, null);

        if (snap === null) {

            console.warn("[CloudSync] Timeout ambil data cloud, pakai data lokal dulu.");
            addNotification("Sinkronisasi cloud lambat/timeout — memakai data lokal untuk sementara.", "warning");
            return;

        }

        if (snap.exists()) {

            const cloud = snap.data();

            if (typeof cloud.projects === "string") localStorage.setItem(PROJECTS_KEY, cloud.projects);
            if (typeof cloud.wallets === "string") localStorage.setItem(WALLETS_KEY, cloud.wallets);
            if (typeof cloud.lastReset === "string") localStorage.setItem(RESET_KEY, cloud.lastReset);

        } else {

            // Belum ada data di cloud untuk user ini -> upload data lokal sekarang sebagai data awal
            await pushToCloud(true);

        }

    } catch (error) {

        console.warn("[CloudSync] Gagal ambil data cloud, pakai data lokal:", error);
        addNotification("Gagal mengambil data dari cloud. Aplikasi tetap memakai data di device ini.", "error");

    }

}

/* ==========================================
   PUSH (localStorage -> cloud)
   Default: di-debounce 600ms biar tidak spam write
   saat ada banyak perubahan beruntun.
   immediate=true: langsung kirim & ditunggu (dipakai
   setelah import backup / register, sebelum reload).
========================================== */

export function pushToCloud(immediate = false) {

    if (!ready) return Promise.resolve();

    const doPush = async () => {

        try {

            await setDoc(userDocRef(), {
                projects: localStorage.getItem(PROJECTS_KEY) || "[]",
                wallets: localStorage.getItem(WALLETS_KEY) || "[]",
                lastReset: localStorage.getItem(RESET_KEY) || "",
                updatedAt: serverTimestamp()
            });

        } catch (error) {

            console.warn("[CloudSync] Gagal simpan ke cloud (data tetap aman di device ini):", error);
            addNotification("Gagal menyimpan perubahan ke cloud. Data tetap aman di device ini.", "error");

        }

    };

    if (immediate) {
        clearTimeout(pushTimer);
        return doPush();
    }

    clearTimeout(pushTimer);
    pushTimer = setTimeout(doPush, 600);

    return Promise.resolve();

}
