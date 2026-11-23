import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/pertanyaan
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id,
        p.teks,
        p.kriteria_kiri_id,
        p.kriteria_kanan_id,
        kl.kode AS kiri_kode,
        kl.nama AS kiri_nama,
        kr.kode AS kanan_kode,
        kr.nama AS kanan_nama
      FROM pertanyaan p
      JOIN kriteria kl ON p.kriteria_kiri_id = kl.id
      JOIN kriteria kr ON p.kriteria_kanan_id = kr.id
      ORDER BY p.id
    `);

    const hasil = rows.map((r) => ({
      id: r.id,
      kiri: { id: r.kriteria_kiri_id, kode: r.kiri_kode, nama: r.kiri_nama },
      kanan: { id: r.kriteria_kanan_id, kode: r.kanan_kode, nama: r.kanan_nama },
      teks: r.teks,
    }));

    res.json(hasil);
  } catch (err) {
    console.error('Pertanyaan error:', err);
    res.status(500).json({ error: { kode: 'SERVER_ERROR', pesan: 'Gagal mengambil pertanyaan' } });
  }
});

export default router;

