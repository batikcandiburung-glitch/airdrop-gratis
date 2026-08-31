/* ==========================================
   FIREBASE CONFIG
   Ambil nilai ini dari:
   Firebase Console > Project Settings > General
   > Your apps > SDK setup and configuration
   ========================================== */

export const firebaseConfig = {
    apiKey: "GANTI_AIzaSyB67OfbQb8MzC2V4ln4jIgGOdc-uqxHUVE",
    authDomain: "airdrop-hub-f40ba.firebaseapp.com",
    databaseURL: "https://airdrop-hub-f40ba-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "airdrop-hub-f40ba",
    storageBucket: "airdrop-hub-f40ba.firebasestorage.app",
    messagingSenderId: "198163092739",
    appId: "1:198163092739:web:dd99560373e08f3792c536",
    measurementId: "G-Z73MXBXETQ"
};

/*
   Cloud sync SENGAJA dinonaktifkan (prefix "GANTI_" di apiKey).
   Kredensial asli tetap disimpan di bawah ini — hapus prefix
   "GANTI_" kapan pun untuk menyambungkan kembali ke Firebase:

   apiKey asli: AIzaSyB67OfbQb8MzC2V4ln4jIgGOdc-uqxHUVE
*/

/*
   Selama apiKey masih diawali "GANTI_", cloud sync otomatis
   dinonaktifkan dan aplikasi tetap berjalan normal memakai
   localStorage seperti biasa (mode offline).
*/
