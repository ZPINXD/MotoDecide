import { Router } from 'express';
import pool from '../db.js';
import { hitungPangkat, hitungWP } from '../lib/wp.js';

const router = Router();

// POST /api/sesi/:id/peringkat
router.post('/sesi/:id/peringkat', async (req, res) => {
  try {
    const sesiId = req.params.id;

    // Cek sesi ada
    const [sesi] = await pool.query(
      'SELECT id, status, putaran_ulang FROM sesi_kuesioner WHERE id = ?',
      [sesiId]
    );
    if (sesi.length === 0) {
      return res.status(404).json({ error: { kode: 'SESI_TIDAK_DITEMUKAN', pesan: 'Sesi tidak ditemukan' } });
    }

    // Jika sesi sudah 2 putaran dan masih berstatus 'berjalan', auto-set ke 'tidak_konsisten_dilanjutkan'
    if (sesi[0].status === 'berjalan' && sesi[0].putaran_ulang >= 2) {
      await pool.query(
        "UPDATE sesi_kuesioner SET status = 'tidak_konsisten_dilanjutkan' WHERE id = ?",
        [sesiId]
      );
      sesi[0].status = 'tidak_konsisten_dilanjutkan';
    }

    if (!['konsisten', 'tidak_konsisten_dilanjutkan'].includes(sesi[0].status)) {
      return res.status(409).json({ error: { kode: 'BELUM_KONSISTEN', pesan: 'Sesi belum konsisten' } });
    }

    // Ambil bobot sesi
    const [bobotRows] = await pool.query(
      'SELECT kriteria_id, bobot FROM bobot_sesi WHERE sesi_id = ? ORDER BY kriteria_id',
      [sesiId]
    );
    if (bobotRows.length !== 7) {
      return res.status(409).json({ error: { kode: 'BELUM_KONSISTEN', pesan: 'Bobot belum lengkap' } });
    }
    const bobot = bobotRows.map((r) => parseFloat(r.bobot));
    const pangkat = hitungPangkat(bobot);

    // Filter motor
    const { harga_max, tahun_min, km_max, cc_max, jumlah = 10 } = req.body;

    const hargaMax = harga_max != null ? parseInt(harga_max, 10) : null;
    const tahunMin = tahun_min != null ? parseInt(tahun_min, 10) : null;
    const kmMax = km_max != null ? parseInt(km_max, 10) : null;
    const ccMax = cc_max != null ? parseInt(cc_max, 10) : null;
    const jml = Math.min(Math.max(parseInt(jumlah, 10) || 10, 1), 20);

    const [motorRows] = await pool.query(
      `SELECT * FROM motor
       WHERE (? IS NULL OR harga <= ?)
         AND (? IS NULL OR tahun >= ?)
         AND (? IS NULL OR km <= ?)
         AND (? IS NULL OR cc <= ?)`,
      [hargaMax, hargaMax, tahunMin, tahunMin, kmMax, kmMax, ccMax, ccMax]
    );

    if (motorRows.length === 0) {
      return res.json({ total_kandidat: 0, hasil: [] });
    }

    // Hitung WP
    const hasilWP = hitungWP(motorRows, pangkat);

    // Ambil top N
    const topN = hasilWP.slice(0, jml);

    // Hapus hasil lama untuk sesi ini
    await pool.query('DELETE FROM hasil_wp WHERE sesi_id = ?', [sesiId]);

    // Simpan ke hasil_wp (gunakan INSERT ... ON DUPLICATE KEY UPDATE agar aman dari race condition)
    const hasilResponse = [];
    for (let idx = 0; idx < topN.length; idx++) {
      const h = topN[idx];
      const peringkat = idx + 1;

      try {
        await pool.query(
          `INSERT INTO hasil_wp (sesi_id, motor_id, nilai_s, nilai_v, peringkat)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             nilai_s = VALUES(nilai_s),
             nilai_v = VALUES(nilai_v),
             peringkat = VALUES(peringkat)`,
          [sesiId, h.motor.id, h.nilaiS, h.nilaiV, peringkat]
        );
      } catch (insertErr) {
        console.warn('hasil_wp insert warning:', insertErr.message);
      }

      hasilResponse.push({
        peringkat,
        motor: {
          id: h.motor.id,
          kode: h.motor.kode,
          merek: h.motor.merek,
          model: h.motor.model,
          tahun: h.motor.tahun,
          harga: h.motor.harga,
          km: h.motor.km,
          cc: h.motor.cc,
          skor_mesin: h.motor.skor_mesin,
          skor_body: h.motor.skor_body,
          skor_dokumen: h.motor.skor_dokumen,
          foto_url: h.motor.foto_url,
          tautan_iklan: h.motor.tautan_iklan,
        },
        nilai_v: h.nilaiV,
        kontribusi: h.kontribusi,
      });
    }

    res.json({
      total_kandidat: motorRows.length,
      hasil: hasilResponse,
    });
  } catch (err) {
    console.error('Peringkat error:', err);
    res.status(500).json({ error: { kode: 'SERVER_ERROR', pesan: 'Gagal menghitung peringkat' } });
  }
});

export default router;
