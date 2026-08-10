/**
 * DATA AIRDROP
 * -------------------------------------------------------------
 * Ini adalah satu-satunya file yang perlu kamu ubah untuk menambah,
 * mengedit, atau menghapus catatan airdrop. Tidak perlu menyentuh
 * index.html / style.css / script.js untuk operasi sehari-hari.
 *
 * status  : "upcoming" | "ongoing" | "completed"
 * chain   : nama jaringan, bebas teks, misal "Ethereum", "Solana"
 * category: kategori bebas, misal "Testnet", "Points", "DeFi", "L2"
 * tasks   : daftar tugas. `done: true` akan otomatis dicoret & masuk hitungan progres
 * links   : { label, url } — muncul sebagai tombol di detail kartu
 * updatedAt: format "YYYY-MM-DD", dipakai untuk urutan "Terbaru diperbarui"
 * -------------------------------------------------------------
 */

const AIRDROP_DATA = [
  {
    id: "monad-testnet",
    name: "Monad",
    chain: "Monad Testnet",
    category: "Testnet L1",
    status: "ongoing",
    priority: "high",
    snapshotDate: null,
    tgeDate: "2026-Q4 (estimasi)",
    updatedAt: "2026-08-05",
    walletTag: "wallet-utama",
    notes:
      "Fokus interaksi mingguan di DEX & bridge testnet. Pantau papan peringkat komunitas.",
    tasks: [
      { label: "Klaim faucet testnet", done: true },
      { label: "Swap di DEX testnet 3x/minggu", done: true },
      { label: "Bridge aset ke testnet", done: false },
      { label: "Ikut kuis komunitas Discord", done: false },
    ],
    links: [
      { label: "Situs Resmi", url: "https://www.monad.xyz" },
      { label: "Discord", url: "https://discord.gg/monaddev" },
    ],
  },
  {
    id: "layerzero-v2",
    name: "LayerZero",
    chain: "Multi-chain",
    category: "Interoperability",
    status: "ongoing",
    priority: "high",
    snapshotDate: null,
    tgeDate: "Belum diumumkan",
    updatedAt: "2026-07-28",
    walletTag: "wallet-utama",
    notes: "Jaga transaksi lintas chain tetap organik, hindari pola bot.",
    tasks: [
      { label: "Bridge via Stargate", done: true },
      { label: "Interaksi 5 chain berbeda", done: true },
      { label: "Pertahankan aktivitas bulanan", done: false },
    ],
    links: [{ label: "Stargate", url: "https://stargate.finance" }],
  },
  {
    id: "eclipse-testnet",
    name: "Eclipse",
    chain: "Eclipse (SVM on Ethereum)",
    category: "Testnet L2",
    status: "upcoming",
    priority: "medium",
    snapshotDate: null,
    tgeDate: "Belum diumumkan",
    updatedAt: "2026-08-01",
    walletTag: "wallet-testnet",
    notes: "Masih tahap pendaftaran awal, belum ada task on-chain resmi.",
    tasks: [
      { label: "Daftar waitlist", done: true },
      { label: "Setup wallet khusus testnet", done: false },
    ],
    links: [{ label: "Situs Resmi", url: "https://www.eclipse.xyz" }],
  },
  {
    id: "fuel-network",
    name: "Fuel Network",
    chain: "Fuel",
    category: "Testnet L2",
    status: "upcoming",
    priority: "low",
    snapshotDate: null,
    tgeDate: "Belum diumumkan",
    updatedAt: "2026-06-20",
    walletTag: "wallet-testnet",
    notes: "Pantau saja dulu, belum daftar program testnet aktif.",
    tasks: [{ label: "Riset dokumentasi proyek", done: true }],
    links: [{ label: "Situs Resmi", url: "https://fuel.network" }],
  },
  {
    id: "hyperliquid",
    name: "Hyperliquid",
    chain: "Hyperliquid L1",
    category: "Points",
    status: "completed",
    priority: "high",
    snapshotDate: "2025-11-01",
    tgeDate: "2025-11-29",
    updatedAt: "2025-12-02",
    walletTag: "wallet-utama",
    notes: "Token sudah diklaim dan masuk dompet. Simpan bukti klaim di catatan pribadi.",
    tasks: [
      { label: "Trading volume mingguan", done: true },
      { label: "Snapshot terverifikasi", done: true },
      { label: "Klaim token", done: true },
    ],
    links: [{ label: "Situs Resmi", url: "https://hyperliquid.xyz" }],
  },
  {
    id: "zksync-era",
    name: "zkSync Era",
    chain: "zkSync",
    category: "L2 Rollup",
    status: "completed",
    priority: "medium",
    snapshotDate: "2024-06-17",
    tgeDate: "2024-06-24",
    updatedAt: "2024-06-25",
    walletTag: "wallet-utama",
    notes: "Alokasi lebih kecil dari perkiraan, tetap diklaim penuh.",
    tasks: [
      { label: "Bridge & transaksi rutin", done: true },
      { label: "Klaim token", done: true },
    ],
    links: [{ label: "Situs Resmi", url: "https://zksync.io" }],
  },
];
