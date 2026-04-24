## Uji Kualitas Aplikasi (Detail Alumni & Integrasi OpenAI API)

| No | Fitur | Aspek Kualitas | Skenario Pengujian | Data Uji | Hasil yang Diharapkan | Hasil Aktual | Status |
|----|------|----------------|--------------------|----------|----------------------|--------------|--------|
| 1  | Sosial Media Alumni | Functional Suitability | Input LinkedIn valid | https://linkedin.com/in/user | Sistem menerima URL valid | Tersimpan di database | ✅ Lulus |
| 2  | Sosial Media Alumni | Reliability | Input IG tidak valid | "instagramku" | Sistem menolak input | Validasi error muncul | ✅ Lulus |
| 3  | Email Alumni | Functional Suitability | Input email valid | user@gmail.com | Email diterima | Data tersimpan | ✅ Lulus |
| 4  | Email Alumni | Security | Input email invalid | user@@gmail | Ditolak sistem | Error validasi | ✅ Lulus |
| 5  | No HP | Functional Suitability | Input nomor valid | 08123456789 | Format diterima | Data tersimpan | ✅ Lulus |
| 6  | No HP | Reliability | Input huruf | 08abc | Ditolak | Error muncul | ✅ Lulus |
| 7  | Tempat Bekerja | Functional Suitability | Input nama perusahaan | PT Maju Jaya | Data tersimpan | Berhasil | ✅ Lulus |
| 8  | Alamat Bekerja | Functional Suitability | Input alamat kerja | Surabaya | Data tersimpan | Berhasil | ✅ Lulus |
| 9  | Posisi | Functional Suitability | Input jabatan | Backend Developer | Data tersimpan | Berhasil | ✅ Lulus |
| 10 | Status Pekerjaan | Functional Suitability | Pilih kategori | Wirausaha | Tersimpan sesuai pilihan | Berhasil | ✅ Lulus |
| 11 | Sosial Media Perusahaan | Functional Suitability | Input link perusahaan | linkedin.com/company/abc | URL valid | Tersimpan | ✅ Lulus |
| 12 | OpenAI Validation | Functional Suitability | Kirim data ke OpenAI | Email & HP | AI validasi format data | Respon validasi diterima | ✅ Lulus |
| 13 | OpenAI Validation | Performance Efficiency | Response API | Request validasi | < 5 detik | ±2 detik | ✅ Lulus |
| 14 | OpenAI Validation | Reliability | API key salah | invalid_key | Request gagal | Error API muncul | ✅ Lulus |
| 15 | OpenAI Validation | Security | Penyimpanan API Key | .env file | API key tidak terlihat di frontend | Aman | ✅ Lulus |
