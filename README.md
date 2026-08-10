# Manifest — Pelacak Airdrop Pribadi

Situs statis untuk mendokumentasikan airdrop kripto yang sedang kamu buru: **Akan Datang**, **Sedang Berjalan**, dan **Selesai**. Tidak butuh backend atau database — semua data disimpan dalam satu file JavaScript yang mudah diedit.

## Struktur file

```
airdrop-tracker/
├── index.html          # Halaman utama
├── assets/
│   ├── style.css        # Semua styling
│   ├── script.js         # Logika render, filter, pencarian
│   └── data.js           # <-- SATU-SATUNYA FILE YANG PERLU KAMU EDIT
└── README.md
```

## Cara menambah / mengedit airdrop

Buka `assets/data.js` dan tambahkan objek baru ke dalam array `AIRDROP_DATA`, contoh:

```js
{
  id: "nama-unik-tanpa-spasi",
  name: "Nama Proyek",
  chain: "Nama Chain",
  category: "Testnet L1", // bebas, mis. Points / DeFi / L2
  status: "upcoming",      // "upcoming" | "ongoing" | "completed"
  priority: "high",        // "high" | "medium" | "low"
  snapshotDate: null,      // "YYYY-MM-DD" atau null
  tgeDate: "Belum diumumkan",
  updatedAt: "2026-08-10", // dipakai untuk sortir "Terbaru Diperbarui"
  walletTag: "wallet-utama",
  notes: "Catatan bebas kamu di sini.",
  tasks: [
    { label: "Deskripsi tugas", done: false },
  ],
  links: [
    { label: "Situs Resmi", url: "https://..." },
  ],
},
```

Simpan file, refresh browser — kartu baru langsung muncul di kolom yang sesuai. Mengubah `status` sebuah entri otomatis memindahkannya ke kolom lain.

## Menjalankan secara lokal

Tidak perlu build tool apa pun. Buka `index.html` langsung di browser, atau jalankan server statis sederhana:

```bash
python3 -m http.server 8000
# lalu buka http://localhost:8000
```

## Deploy ke GitHub Pages

1. Buat repository baru di GitHub, misalnya `airdrop-tracker`.
2. Upload seluruh isi folder ini ke repository tersebut (root repo, bukan di dalam sub-folder), lalu commit & push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: manifest airdrop tracker"
   git branch -M main
   git remote add origin https://github.com/USERNAME/airdrop-tracker.git
   git push -u origin main
   ```
3. Di GitHub, buka repo → **Settings → Pages**.
4. Pada **Source**, pilih branch `main` dan folder `/ (root)`, lalu klik **Save**.
5. Tunggu 1–2 menit, situs akan aktif di:
   `https://USERNAME.github.io/airdrop-tracker/`

Setiap kali kamu commit perubahan ke `assets/data.js`, GitHub Pages otomatis memperbarui situs dalam beberapa menit.

## Catatan desain

- Kartu bergaya "manifest/boarding pass" dengan indikator lintasan (dot progres) yang menunjukkan tahap airdrop: Terdaftar → Aktif → Mendarat.
- Tiga warna status: biru (Akan Datang), amber (Sedang Berjalan), hijau (Selesai).
- Font: **Space Grotesk** (judul), **Inter** (teks), **JetBrains Mono** (data/label) — dimuat dari Google Fonts via CDN.
- Sepenuhnya responsif dan bisa diakses dari mobile.
