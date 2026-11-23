import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/motor — daftar motor dengan filter opsional
router.get('/', async (req, res) => {
  try {
    const { harga_max, tahun_min, km_max, cc_max } = req.query;

    const hargaMax = harga_max ? parseInt(harga_max, 10) : null;
    const tahunMin = tahun_min ? parseInt(tahun_min, 10) : null;
    const kmMax = km_max ? parseInt(km_max, 10) : null;
    const ccMax = cc_max ? parseInt(cc_max, 10) : null;

    // Validasi
    if (harga_max && (isNaN(hargaMax) || hargaMax <= 0)) {
      return res.status(400).json({ error: { kode: 'VALIDASI_GAGAL', pesan: 'harga_max harus angka positif' } });
    }
    if (tahun_min && (isNaN(tahunMin) || tahunMin < 1990 || tahunMin > new Date().getFullYear())) {
      return res.status(400).json({ error: { kode: 'VALIDASI_GAGAL', pesan: `tahun_min harus antara 1990 dan ${new Date().getFullYear()}` } });
    }
    if (km_max && (isNaN(kmMax) || kmMax <= 0)) {
      return res.status(400).json({ error: { kode: 'VALIDASI_GAGAL', pesan: 'km_max harus angka positif' } });
    }
    if (cc_max && (isNaN(ccMax) || ccMax <= 0)) {
      return res.status(400).json({ error: { kode: 'VALIDASI_GAGAL', pesan: 'cc_max harus angka positif' } });
    }

    const [rows] = await pool.query(
      `SELECT * FROM motor
       WHERE (? IS NULL OR harga <= ?)
         AND (? IS NULL OR tahun >= ?)
         AND (? IS NULL OR km <= ?)
         AND (? IS NULL OR cc <= ?)
       ORDER BY kode`,
      [hargaMax, hargaMax, tahunMin, tahunMin, kmMax, kmMax, ccMax, ccMax]
    );

    res.json({ total: rows.length, data: rows });
  } catch (err) {
    console.error('Motor list error:', err);
    res.status(500).json({ error: { kode: 'SERVER_ERROR', pesan: 'Gagal mengambil data motor' } });
  }
});

// GET /api/motor/:id — detail motor
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM motor WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: { kode: 'SESI_TIDAK_DITEMUKAN', pesan: 'Motor tidak ditemukan' } });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Motor detail error:', err);
    res.status(500).json({ error: { kode: 'SERVER_ERROR', pesan: 'Gagal mengambil detail motor' } });
  }
});

export default router;

