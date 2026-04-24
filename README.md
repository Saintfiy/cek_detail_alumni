1. Input Data
Sistem menggunakan dataset awal yang berasal dari file data.js yang berisi daftar alumni dengan atribut:
Nama lengkap (full_name)
NIM
Fakultas
Program studi
Tahun masuk
Selain itu, pengguna juga melakukan konfigurasi:
URL dan API Key Supabase
API Key AI
Offset data dan jumlah data yang diproses
Delay antar proses
Nama universitas
2. Inisialisasi Proses
Ketika tombol Mulai ditekan:
Sistem menjalankan fungsi doStart()
Data akan difilter berdasarkan offset dan limit
Statistik di-reset
Proses iterasi dimulai
3. Proses Pengolahan Data
Setiap data alumni diproses secara berurutan melalui fungsi processOne() dengan tahapan sebagai berikut:
a. Pencarian Informasi (AI Processing)
Sistem mengirimkan request ke API AI melalui endpoint lokal:
http://localhost:5001/anthropic
AI akan melakukan pencarian berbasis web untuk mendapatkan informasi tambahan, seperti:
Media sosial (LinkedIn, Instagram, Facebook, TikTok)
Kontak (email, nomor telepon)
Informasi pekerjaan (tempat kerja, posisi, jenis pekerjaan)
Hasil pencarian dikembalikan dalam format JSON.
b. Parsing Data
Sistem mengekstrak JSON dari response AI
Jika parsing gagal, data akan di-skip
Jika berhasil, data akan diproses ke tahap berikutnya
c. Penyimpanan ke Database
Data hasil pencarian akan dikirim ke database Supabase menggunakan metode PATCH melalui REST API:
/rest/v1/alumni?full_name=eq.{nama}
Data yang diperbarui meliputi:
Media sosial
Kontak
Informasi pekerjaan
Status tracking
d. Update Status
Sistem memberikan status:
Teridentifikasi dari sumber publik → jika data ditemukan
Belum ditemukan di sumber publik → jika data tidak ditemukan
e. Delay Proses
Setiap proses diberikan jeda (delay) untuk:
Menghindari pembatasan (rate limit) API
Menjaga kestabilan sistem
4. Monitoring dan Output
Sistem menyediakan informasi secara real-time berupa:
Progress bar proses
Statistik data:
Tersimpan
Skip
Error
Log aktivitas sistem
Tampilan detail alumni yang sedang diproses
5. Penghentian Proses
Pengguna dapat menghentikan proses dengan tombol Stop, yang akan:
Menghentikan iterasi setelah proses saat ini selesai
Menjaga konsistensi data
🧩 Arsitektur Sistem
Frontend: HTML, CSS, JavaScript
Sumber Data: File lokal (data.js)
AI Service: API lokal (integrasi AI + web search)
Database: Supabase (REST API)
🎯 Tujuan Sistem
Mengotomatisasi pengayaan data alumni
Mengurangi proses pencarian manual
Meningkatkan kelengkapan dan kualitas data
Mendukung analisis data alumni
