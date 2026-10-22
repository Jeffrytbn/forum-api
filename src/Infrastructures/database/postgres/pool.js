const { Pool } = require('pg');

const testConfig = {
  host: process.env.PGHOST_TEST,
  port: process.env.PGPORT_TEST,
  user: process.env.PGUSER_TEST,
  password: process.env.PGPASSWORD_TEST,
  database: process.env.PGDATABASE_TEST,
};

// Mode test memakai database terpisah agar data development tidak tersentuh.
// Cabang non-test (konfigurasi dari env PG*) hanya berjalan saat aplikasi dijalankan.
/* v8 ignore next */
const pool = process.env.NODE_ENV === 'test' ? new Pool(testConfig) : new Pool();

module.exports = pool;
