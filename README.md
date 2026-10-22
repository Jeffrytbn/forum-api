# Forum API

REST API forum diskusi (Node.js + Express + PostgreSQL) dengan Clean Architecture dan automation testing.

## Fitur
- Registrasi, login, refresh access token, logout
- Menambahkan thread, melihat detail thread (terbuka)
- Menambahkan dan menghapus komentar (soft delete)
- Menambahkan dan menghapus balasan komentar (soft delete, opsional)
- Menyukai dan batal menyukai komentar (`PUT .../likes`, opsional), jumlahnya tampil sebagai `likeCount`
- CI/CD GitHub Actions, limit access 90 request/menit di `/threads` (NGINX), dan HTTPS

## Struktur (Clean Architecture)
```
src/
├── Commons/          # exception & translator error domain
├── Domains/          # entities + interface repository (aturan bisnis inti)
├── Applications/     # use case + interface security (alur bisnis)
├── Interfaces/http/  # handler, router, middleware (adapter ke Express)
└── Infrastructures/  # Postgres, bcrypt, JWT, container DI, createServer
tests/                # table test helper untuk integration test
```
Autentikasi dilakukan di level interface (middleware); use case menerima `owner` sebagai parameter.

## Menjalankan
Prasyarat: Node.js 22 LTS dan PostgreSQL.

```bash
npm install
cp .env.example .env
# sesuaikan nilai di .env, buat dua database (dev & test)
npm run migrate up        # database development
npm run migrate:test up   # database test
npm start
```

## Pengujian
```bash
npm test                  # unit + integration + functional
npm run test:coverage     # laporan coverage
```
Integration test memakai database test (`PG*_TEST` di `.env`) dan dijalankan berurutan.

## Endpoint
| Method | Path | Auth |
|---|---|---|
| POST | /users | - |
| POST / PUT / DELETE | /authentications | - |
| POST | /threads | ya |
| GET | /threads/{threadId} | - |
| POST | /threads/{threadId}/comments | ya |
| DELETE | /threads/{threadId}/comments/{commentId} | ya |
| PUT | /threads/{threadId}/comments/{commentId}/likes | ya |
| POST | /threads/{threadId}/comments/{commentId}/replies | ya |
| DELETE | /threads/{threadId}/comments/{commentId}/replies/{replyId} | ya |

## CI/CD dan deployment
Workflow ada di `.github/workflows/` (`ci.yml` untuk pull request, `cd.yml` untuk push ke `main`). Konfigurasi NGINX ada di `nginx.conf`. Langkah lengkap deployment ke Google Cloud ada di `PANDUAN-DEPLOY.md`.
