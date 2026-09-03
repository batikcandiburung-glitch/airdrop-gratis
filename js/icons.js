/* ==========================================
   ICONS.JS
   Inline SVG icons (no external font/CDN dependency).
   Dipakai untuk ikon-ikon yang sebelumnya tidak
   konsisten muncul saat memakai Font Awesome webfont
   (copy, trash, check, xmark) — lihat catatan bug.
========================================== */

const svg = (inner, extra = "") =>
    `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${inner}</svg>`;

export const ICON_CHECK = svg(`<path d="M20 6 9 17l-5-5"/>`);

export const ICON_XMARK = svg(`<path d="M18 6 6 18M6 6l12 12"/>`);

export const ICON_COPY = svg(
    `<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>`
);

export const ICON_TRASH = svg(
    `<path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/>`
);
