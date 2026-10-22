# Panduan CI/CD, Limit Access, dan HTTPS — Forum API (Google Cloud)

Panduan ini mengikuti kriteria submission "CI/CD dan Security". Deployment memakai **VM Compute Engine (Ubuntu)** di Google Cloud sebagai pengganti EC2. Kriteria memperbolehkan layanan lain selama CD berjalan lewat GitHub Actions.

Alur akhirnya:

```
Pull Request ──▶ GitHub Actions CI (test + PostgreSQL service container)
Merge ke main ─▶ GitHub Actions CD ──SSH──▶ VM: git pull → npm ci → migrate → pm2 restart
Internet ─HTTPS─▶ NGINX (limit 90 req/menit di /threads) ─▶ Node.js :5000 ─▶ PostgreSQL
```

## Batasan peran Editor di Google Cloud
Akun Anda berperan **Editor**, jadi Anda bisa membuat VM, IP statis, dan aturan firewall. Yang **tidak** bisa Anda lakukan: mengatur billing dan mengubah IAM. Compute Engine butuh billing aktif, jadi pastikan pemegang **Owner** proyek sudah menautkan billing account sebelum Langkah 2. Kalau tombol Create VM menolak, mintakan ke Owner.

---

## Langkah 1 — Siapkan repository GitHub
1. Buat repository **publik** di GitHub (mis. `forum-api`). Syarat submission: repository harus publik.
2. Di folder proyek, salin `.env.example` menjadi `.env` untuk pengembangan lokal. `.env` sudah ada di `.gitignore`, jadi tidak ikut ter-commit.
3. Push proyek ke branch `main`:
   ```bash
   git init
   git add .
   git commit -m "feat: forum api"
   git branch -M main
   git remote add origin https://github.com/<username>/forum-api.git
   git push -u origin main
   ```
   Run CD pertama kemungkinan **gagal** karena server belum siap. Itu wajar dan akan dijalankan ulang di Langkah 9.

## Langkah 2 — Buat VM di Compute Engine
1. Google Cloud Console → **Compute Engine → VM instances → Create instance**.
2. Isi:
   - **Name:** `forum-api`
   - **Region:** `us-central1` (e2-micro masuk Always Free di region ini) atau `asia-southeast2` (Jakarta, lebih dekat tetapi berbayar).
   - **Machine type:** `e2-small` disarankan. `e2-micro` (1 GB RAM) cukup kalau Anda menambah swap (Langkah 4).
   - **Boot disk:** Ubuntu 22.04 LTS, 20 GB.
   - **Firewall:** centang **Allow HTTP traffic** dan **Allow HTTPS traffic**.
3. Klik **Create**.
4. Reservasi IP statis supaya IP tidak berubah saat VM restart: **VPC network → IP addresses**, cari IP eksternal VM Anda, ubah **Type** dari *Ephemeral* menjadi **Static**, beri nama `forum-api-ip`. Catat IP-nya.
5. Jangan membuka port 5000 atau 5432 ke publik. Hanya 22, 80, 443 yang dipakai.

## Langkah 3 — Buat SSH key untuk GitHub Actions
Di komputer Anda:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/forum_deploy -C "github-actions" -N ""
cat ~/.ssh/forum_deploy.pub
```
1. Di Console, klik tombol **SSH** pada VM (membuka terminal browser).
2. Jalankan `whoami` dan catat hasilnya. Itu nilai `SSH_USERNAME`.
3. Tambahkan public key:
   ```bash
   mkdir -p ~/.ssh && chmod 700 ~/.ssh
   echo "ISI_PUBLIC_KEY_DARI_forum_deploy.pub" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```
4. Uji dari komputer Anda: `ssh -i ~/.ssh/forum_deploy <SSH_USERNAME>@<IP_STATIS>`.

## Langkah 4 — Siapkan server (lewat terminal VM)
```bash
# swap 1 GB (penting untuk e2-micro)
sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

sudo apt update && sudo apt install -y git nginx postgresql postgresql-contrib certbot python3-certbot-nginx

# Node.js 22 lewat nvm + pm2
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
npm install -g pm2
```

**Database:**
```bash
sudo -u postgres psql <<'SQL'
CREATE USER forum WITH PASSWORD 'GANTI_PASSWORD_KUAT';
CREATE DATABASE forumapi OWNER forum;
SQL
```

**Ambil kode dan buat `.env` produksi:**
```bash
cd ~ && git clone https://github.com/<username>/forum-api.git
cd forum-api
cp .env.example .env
nano .env
```
Isi `.env` di server:
- `HOST=127.0.0.1` dan `PORT=5000` (hanya NGINX yang boleh mengakses aplikasi).
- `PGHOST=localhost`, `PGUSER=forum`, `PGDATABASE=forumapi`, `PGPASSWORD=<password tadi>`, `PGPORT=5432`.
- `ACCESS_TOKEN_KEY` dan `REFRESH_TOKEN_KEY`: hasil `openssl rand -hex 32` (jalankan dua kali, nilainya harus berbeda).
- `ACCESS_TOKEN_AGE=3000`.

**Jalankan pertama kali:**
```bash
npm ci --omit=dev
npm run migrate up
pm2 start src/app.js --name forum-api
pm2 save
pm2 startup        # jalankan perintah sudo yang dicetak pm2
curl http://127.0.0.1:5000/threads/tidak-ada    # harus: 404 thread tidak ditemukan
```

## Langkah 5 — Pasang NGINX (reverse proxy + Limit Access)
File `nginx.conf` di root proyek sudah berisi limit **90 request/menit** untuk `/threads` beserta seluruh path di bawahnya (balasan **429** saat terlampaui).
```bash
sudo cp ~/forum-api/nginx.conf /etc/nginx/sites-available/forum-api
sudo nano /etc/nginx/sites-available/forum-api    # ganti api.example.com dengan domain Anda
sudo ln -s /etc/nginx/sites-available/forum-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```
Uji lewat IP: `curl http://<IP_STATIS>/threads/tidak-ada` harus 404.

## Langkah 6 — Domain
Sertifikat HTTPS butuh nama domain yang mengarah ke IP statis VM (A record).
- **Subdomain dcdg.xyz:** ikuti instruksi di materi kelas "Menggunakan HTTPS" untuk meminta subdomain dengan IP statis VM Anda.
- **Alternatif:** domain sendiri, atau layanan DNS gratis seperti DuckDNS (buat subdomain, isi IP statis).

Cek DNS sudah mengarah: `dig +short domain-anda` harus menampilkan IP statis VM. Setelah itu pastikan `server_name` di NGINX sudah memakai domain tersebut (Langkah 5).

## Langkah 7 — Aktifkan HTTPS
```bash
sudo certbot --nginx -d domain-anda
```
Pilih opsi redirect HTTP ke HTTPS jika ditanya. Uji pembaruan otomatis:
```bash
sudo certbot renew --dry-run
```
Buka `https://domain-anda/threads/tidak-ada` di browser. Harus 404 JSON dengan gembok HTTPS.

## Langkah 8 — Isi GitHub Secrets
Repository GitHub → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Isi |
|---|---|
| `SSH_HOST` | IP statis VM |
| `SSH_USERNAME` | hasil `whoami` di Langkah 3 |
| `SSH_PRIVATE_KEY` | seluruh isi `~/.ssh/forum_deploy` (termasuk baris BEGIN/END) |
| `SSH_PORT` | `22` |

## Langkah 9 — Buat skenario CI (gagal dan berhasil) lalu CD
Kriteria: minimal dua run CI (satu gagal, satu berhasil) dan satu run CD yang berhasil.

1. **Run CI gagal.** Buat branch dan ubah satu tes supaya sengaja salah:
   ```bash
   git checkout -b feature/hello-world
   ```
   Tambahkan file `src/Commons/_test/hello.test.js` berisi:
   ```js
   describe('hello', () => {
     it('should say hello', () => {
       expect('hello').toEqual('world');   // sengaja salah
     });
   });
   ```
   ```bash
   git add . && git commit -m "feat: hello world (tes gagal)" && git push -u origin feature/hello-world
   ```
   Di GitHub, buka **Pull request** dari `feature/hello-world` ke `main`. Tab **Actions** akan menampilkan run CI **merah**. Jangan merge dulu.
2. **Run CI berhasil.** Perbaiki tesnya (`toEqual('hello')`), lalu:
   ```bash
   git add . && git commit -m "fix: perbaiki tes hello" && git push
   ```
   Push ke branch PR menjalankan CI lagi dan hasilnya **hijau**. Di tab Actions kini ada satu run gagal dan satu run berhasil.
3. **Run CD berhasil.** Klik **Merge pull request**. Event push ke `main` menjalankan workflow *Continuous Deployment*, dan run-nya harus hijau. Kalau run CD pertama dari Langkah 1 gagal, itu tidak masalah selama ada satu yang berhasil.
4. Buka tab **Actions**, pastikan kedua workflow tampil dengan riwayat gagal/berhasil seperti contoh di materi. Reviewer melihat riwayat ini, jadi jangan hapus run lama.

## Langkah 10 — Uji dengan Postman
1. Import **Forum API V2 Collection + Environment** dari materi kelas.
2. Pada environment, ubah variabel URL ke `https://domain-anda` (tanpa `/` di akhir).
3. Jalankan seluruh collection lewat **Collection Runner** secara berurutan. Semua request wajib (kecuali bertanda `[optional]`) harus lulus.
4. Kalau ada request `/threads` yang mendapat **429** saat runner berjalan cepat, naikkan `burst` di `nginx.conf` (mis. `burst=20`), lalu `sudo nginx -t && sudo systemctl reload nginx`. Nilai `rate=90r/m` jangan diubah.
5. Bersihkan database sebelum mengulang uji: `sudo -u postgres psql forumapi -c "DELETE FROM users;"`.

## Langkah 11 — Pengiriman
1. Hapus `node_modules` lalu ZIP folder proyek (pastikan `package.json` dan `nginx.conf` ada di root). `.env` boleh tidak disertakan.
2. Di **student notes** tulis: URL repository GitHub (publik) dan URL HTTPS Forum API.
3. Pastikan kedua link bisa diakses dari browser tanpa login.

---

## Troubleshooting
| Gejala | Penyebab umum | Solusi |
|---|---|---|
| 502 Bad Gateway | aplikasi tidak jalan | `pm2 status`, `pm2 logs forum-api` |
| CD gagal "handshake failed" | secret SSH salah | cek ulang `SSH_PRIVATE_KEY` (utuh) dan `SSH_USERNAME` |
| CD gagal "pm2: command not found" | nvm tidak termuat | skrip `cd.yml` sudah memuat nvm; pastikan Node dipasang lewat nvm |
| Certbot gagal | DNS belum mengarah / port 80 tertutup | cek `dig`, cek firewall HTTP/HTTPS di VM |
| Aplikasi 500 saat start | `.env` server salah | cek `pm2 logs`, cek kredensial database |
| Semua request kena 429 | rate limit terlalu ketat untuk runner | naikkan `burst` (Langkah 10) |
