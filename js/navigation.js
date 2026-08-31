/* ==========================================
   NAVIGATION.JS
   Page routing (Home/Profile/Wallet/Security),
   bottom nav, side menu, dark mode & language.
========================================== */

import { getLang, setLang, applyStaticTranslations } from "./i18n.js";

const THEME_KEY = "airdropHub_theme";

const homeBtn = document.getElementById("homeBtn");
const profileBtn = document.getElementById("profileBtn");
const addBottomBtn = document.getElementById("addBottomBtn");
const searchBtn = document.getElementById("searchBtn");

const homePage = document.getElementById("homePage");
const profilePage = document.getElementById("profilePage");
const walletPage = document.getElementById("walletPage");
const securityPage = document.getElementById("securityPage");

const allPages = [homePage, profilePage, walletPage, securityPage];
const bottomNavButtons = [homeBtn, searchBtn, addBottomBtn, profileBtn];

const bottomNav = document.querySelector(".bottom-nav");

const menuBtn = document.getElementById("menuBtn");
const closeMenuBtn = document.getElementById("closeMenuBtn");
const sideMenuOverlay = document.getElementById("sideMenuOverlay");

const darkModeToggle = document.getElementById("darkModeToggle");
const langSwitch = document.getElementById("langSwitch");
const langButtons = langSwitch.querySelectorAll("[data-lang]");

const closeWalletPageBtn = document.getElementById("closeWalletPageBtn");
const menuWalletBtn = document.querySelectorAll("#profileWalletBtn, #profileWalletBtnLoggedOut");
const profileSecurityBtn = document.getElementById("profileSecurityBtn");
const closeSecurityPageBtn = document.getElementById("closeSecurityPageBtn");

/* ==========================================
   PAGE SWITCHING
========================================== */

function setActiveNav(activeBtn) {

    bottomNavButtons.forEach(btn => btn.classList.remove("active"));

    if (activeBtn) activeBtn.classList.add("active");

}

function showPage(page) {

    allPages.forEach(p => { p.style.display = "none"; });

    page.style.display = "block";

}

function goHome() {
    showPage(homePage);
    setActiveNav(homeBtn);
    bottomNav.style.display = "flex";
}

function goProfile(onProfileOpen) {
    showPage(profilePage);
    setActiveNav(profileBtn);
    bottomNav.style.display = "flex";
    if (onProfileOpen) onProfileOpen();
}

function openWalletPage() {
    showPage(walletPage);
    setActiveNav(null);
    bottomNav.style.display = "none";
}

function closeWalletPage() {
    goProfile();
}

function openSecurityPage() {
    showPage(securityPage);
    setActiveNav(null);
    bottomNav.style.display = "none";
}

function closeSecurityPage() {
    goProfile();
}

/* ==========================================
   SIDE MENU
========================================== */

function openMenu() {
    sideMenuOverlay.classList.add("active");
    document.body.classList.add("modal-open");
}

function closeMenu() {
    sideMenuOverlay.classList.remove("active");
    document.body.classList.remove("modal-open");
}

/* ==========================================
   THEME
========================================== */

function applyTheme(theme) {
    document.body.classList.toggle("theme-light", theme === "light");
    darkModeToggle.checked = theme === "dark";
}

/* ==========================================
   INIT
========================================== */

export function initNavigation({ onProfileOpen, onLangChange } = {}) {

    homeBtn.onclick = goHome;

    profileBtn.onclick = () => goProfile(onProfileOpen);

    addBottomBtn.onclick = () => {
        document.getElementById("addProjectBtn").click();
    };

    searchBtn.onclick = () => {
        goHome();
        document.getElementById("search").focus();
    };

    setActiveNav(homeBtn);

    menuBtn.onclick = openMenu;
    closeMenuBtn.onclick = closeMenu;

    sideMenuOverlay.addEventListener("click", (e) => {
        if (e.target === sideMenuOverlay) closeMenu();
    });

    menuWalletBtn.forEach(btn => {
        btn.onclick = () => { openWalletPage(); closeMenu(); };
    });

    closeWalletPageBtn.onclick = closeWalletPage;

    profileSecurityBtn.onclick = openSecurityPage;
    closeSecurityPageBtn.onclick = closeSecurityPage;

    const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
    applyTheme(savedTheme);

    darkModeToggle.onchange = () => {
        const theme = darkModeToggle.checked ? "dark" : "light";
        localStorage.setItem(THEME_KEY, theme);
        applyTheme(theme);
    };

    const applyLang = (lang, { refresh = true } = {}) => {

        setLang(lang);

        langButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.lang === lang));

        applyStaticTranslations();

        if (refresh && onLangChange) onLangChange();

    };

    applyLang(getLang(), { refresh: false });

    langButtons.forEach(btn => {
        btn.onclick = () => applyLang(btn.dataset.lang);
    });

}
