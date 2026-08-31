/* ==========================================
   WALLETSELECT.JS
   Sinkronisasi select Chain -> select Wallet
   di form Add Project & Edit Project
========================================== */

import { getWallets } from "./wallet.js";
import { t } from "./i18n.js";

export const CHAIN_ICONS = {
    "Ethereum": "🔷",
    "Solana": "🟣",
    "BNB": "🟡",
    "Gram (TON)": "💎",
    "Lainnya": "🔗"
};

/* ==========================================
   ISI SELECT WALLET SESUAI CHAIN TERPILIH
========================================== */

export function populateWalletSelect(selectEl, chain, selectedId = "") {

    if (!selectEl) return;

    if (!chain) {
        selectEl.innerHTML = `<option value="" disabled selected>${t("wallet.chooseChainFirst")}</option>`;
        selectEl.disabled = true;
        return;
    }

    const wallets = getWallets().filter(wallet => wallet.chain === chain);

    if (wallets.length === 0) {
        selectEl.innerHTML = `<option value="" disabled selected>${t("wallet.empty")}</option>`;
        selectEl.disabled = true;
        return;
    }

    selectEl.disabled = false;

    const icon = CHAIN_ICONS[chain] || "🔗";

    let html = `<option value="" disabled ${selectedId ? "" : "selected"}>Select wallet</option>`;

    wallets.forEach(wallet => {

        const isSelected = String(wallet.id) === String(selectedId);

        html += `
            <option value="${wallet.id}" ${isSelected ? "selected" : ""}>
                ${icon} ${wallet.address}
            </option>
        `;

    });

    selectEl.innerHTML = html;

}

/* ==========================================
   PASANG LISTENER PERUBAHAN CHAIN
========================================== */

export function initWalletSelectSync() {

    const networkSelect = document.getElementById("network");
    const walletSelect = document.getElementById("projectWallet");

    const editNetworkSelect = document.getElementById("editNetwork");
    const editWalletSelect = document.getElementById("editProjectWallet");

    networkSelect.addEventListener("change", () => {
        populateWalletSelect(walletSelect, networkSelect.value);
    });

    editNetworkSelect.addEventListener("change", () => {
        populateWalletSelect(editWalletSelect, editNetworkSelect.value);
    });

}
