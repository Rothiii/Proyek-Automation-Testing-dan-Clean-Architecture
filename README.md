# Forum API

REST API forum diskusi bertema thread, komentar, dan balasan. Proyek ini dibuat untuk submission kelas **Menjadi Back-End Developer Expert dengan JavaScript** di Dicoding.

## Fitur

- Registrasi dan login pengguna dengan password ter-hash (bcrypt) serta JWT access token.
- Membuat thread dan melihat detail thread beserta komentar dan balasannya.
- Menambah dan menghapus komentar.
- Menambah dan menghapus balasan komentar.
- Penghapusan komentar dan balasan memakai **soft delete**, sehingga riwayat diskusi tetap utuh.
- Otorisasi berbasis kepemilikan resource: pengguna hanya bisa menghapus komentar atau balasannya sendiri.

## Teknologi

- Node.js 22
- Express 5
- PostgreSQL 16
- `instances-container` untuk dependency injection
- Vitest dan Supertest untuk pengujian
- node-pg-migrate untuk migrasi basis data

## Arsitektur

Proyek memakai Clean Architecture dengan pembagian lapisan sebagai berikut.

```
src/
  Domains/          entitas dan kontrak repository (tidak bergantung pada framework)
  Applications/     use case sebagai orkestrator alur bisnis
  Infrastructures/  implementasi repository, security, database, dan HTTP server
  Interfaces/       handler dan route Express
  Commons/          konfigurasi dan exception bersama
```

Ketergantungan antar lapisan selalu mengarah ke dalam. Lapisan `Domains` tidak mengetahui Express maupun PostgreSQL, sehingga aturan bisnis bisa diuji tanpa server dan tanpa basis data.

## Struktur Endpoint

| Method | Endpoint | Autentikasi |
| --- | --- | --- |
| POST | `/users` | Tidak |
| POST | `/authentications` | Tidak |
| PUT | `/authentications` | Tidak |
| DELETE | `/authentications` | Tidak |
| POST | `/threads` | Ya |
| GET | `/threads/:threadId` | Tidak |
| POST | `/threads/:threadId/comments` | Ya |
| DELETE | `/threads/:threadId/comments/:commentId` | Ya |
| POST | `/threads/:threadId/comments/:commentId/replies` | Ya |
| DELETE | `/threads/:threadId/comments/:commentId/replies/:replyId` | Ya |

Autentikasi memakai header `Authorization: Bearer <accessToken>`.

## Menjalankan Proyek

### 1. Siapkan basis data

```bash
docker compose up -d postgres
```

### 2. Siapkan environment

Salin berkas contoh lalu sesuaikan nilainya.

```bash
cp .env.example .env
```

### 3. Pasang dependensi dan migrasi

```bash
npm install
npm run migrate up
```

### 4. Jalankan server

```bash
npm run start
```

Server berjalan di `http://localhost:3000`.

## Pengujian

Pengujian memakai basis data terpisah agar data pengembangan tidak tersentuh.

```bash
docker compose up -d postgres-test
npm run migrate:test up
npm run test:coverage
```

Hasil terakhir:

- 45 berkas pengujian, 157 test, seluruhnya lulus.
- Cakupan kode 100 persen untuk statement, branch, function, dan line.

Pengujian mencakup unit test entitas, kontrak repository, use case, implementasi repository dengan PostgreSQL asli, serta functional test endpoint HTTP memakai Supertest.

## Lisensi

ISC
