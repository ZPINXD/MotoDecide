import { Router } from 'express';
import crypto from 'crypto';
import pool from '../db.js';
import { SKALA_VALID } from '../lib/konstanta.js';
import { prosesAHP } from '../lib/ahp.js';

const router = Router();

// POST /api/sesi — membuat sesi baru
router.post('/', async (req, res) => {
  try {
    const sesiId = crypto.randomUUID();
    await pool.query(
      'INSERT INTO sesi_kuesioner (id, status, putaran_ulang) VALUES (?, ?, ?)',
      [sesiId, 'berjalan', 0]
    );
    res.status(201).json({ sesi_id: sesiId, status: 'berjalan' });
  } catch (err) {
    console.error('Create sesi error:', err);
    res.status(500).json({ error: { kode: 'SERVER_ERROR', pesan: 'Gagal membuat sesi' } });
  }
});

// GET /api/sesi/:id — status sesi
router.get('/:id', async (req, res) => {
  try {
    const [sesi] = await pool.query(
      'SELECT id, status, putaran_ulang, cr FROM sesi_kuesioner WHERE id = ?',
      [req.params.id]
    );
    if (sesi.length === 0) {
      return res.status(404).json({ error: { kode: 'SESI_TIDAK_DITEMUKAN', pesan: 'Sesi tidak ditemukan' } });
    }

    const [jawaban] = await pool.query(
      'SELECT COUNT(*) AS jumlah FROM jawaban WHERE sesi_id = ?',
      [req.params.id]
    );

    const s = sesi[0];
    res.json({
      sesi_id: s.id,
      status: s.status,
      putaran_ulang: s.putaran_ulang,
      cr: s.cr ? parseFloat(s.cr) : null,
      jumlah_jawaban: jawaban[0].jumlah,
    });
  } catch (err) {
    console.error('Get sesi error:', err);
    res.status(500).json({ error: { kode: 'SERVER_ERROR', pesan: 'Kesalahan server' } });
  }
});

// PUT /api/sesi/:id/jawaban — menyimpan/mengubah jawaban
router.put('/:id/jawaban', async (req, res) => {
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

    const { jawaban: jawabanInput } = req.body;
    if (!Array.isArray(jawabanInput) || jawabanInput.length === 0) {
      return res.status(400).json({ error: { kode: 'VALIDASI_GAGAL', pesan: 'jawaban harus berupa array yang tidak kosong' } });
    }

    // Validasi setiap jawaban
    for (const j of jawabanInput) {
      if (!j.pertanyaan_id || j.pertanyaan_id < 1 || j.pertanyaan_id > 21) {
        return res.status(400).json({ error: { kode: 'VALIDASI_GAGAL', pesan: 'pertanyaan_id harus antara 1 dan 21' } });
      }
      if (!SKALA_VALID.includes(j.tingkat)) {
        return res.status(400).json({ error: { kode: 'VALIDASI_GAGAL', pesan: 'tingkat harus 1, 3, 5, 7, atau 9' } });
      }
      if (j.tingkat === 1 && j.arah !== 'sama') {
        return res.status(400).json({ error: { kode: 'VALIDASI_GAGAL', pesan: 'arah harus "sama" jika tingkat = 1' } });
      }
      if (j.tingkat > 1 && !['kiri', 'kanan'].includes(j.arah)) {
        return res.status(400).json({ error: { kode: 'VALIDASI_GAGAL', pesan: 'arah harus "kiri" atau "kanan" jika tingkat > 1' } });
      }
    }

    const putaran = sesi[0].putaran_ulang || 0;

    // Upsert jawaban
    for (const j of jawabanInput) {
      await pool.query(
        `INSERT INTO jawaban (sesi_id, pertanyaan_id, arah, tingkat, putaran)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE arah = VALUES(arah), tingkat = VALUES(tingkat), putaran = VALUES(putaran)`,
        [sesiId, j.pertanyaan_id, j.arah, j.tingkat, putaran + 1]
      );
    }

    // Cek apakah sudah lengkap 21 jawaban
    const [countResult] = await pool.query(
      'SELECT COUNT(*) AS jumlah FROM jawaban WHERE sesi_id = ?',
      [sesiId]
    );
    const jumlahJawaban = countResult[0].jumlah;

    if (jumlahJawaban < 21) {
      // Belum lengkap
      const belumTerisi = [];
      const [existing] = await pool.query(
        'SELECT pertanyaan_id FROM jawaban WHERE sesi_id = ?',
        [sesiId]
      );
      const existingIds = new Set(existing.map((r) => r.pertanyaan_id));
      for (let i = 1; i <= 21; i++) {
        if (!existingIds.has(i)) belumTerisi.push(i);
      }
      return res.json({ status: 'berjalan', belum_terisi: belumTerisi });
    }

    // 21 jawaban lengkap — hitung AHP
    const [semuaJawaban] = await pool.query(
      `SELECT j.pertanyaan_id, j.arah, j.tingkat, p.kriteria_kiri_id, p.kriteria_kanan_id
       FROM jawaban j
       JOIN pertanyaan p ON j.pertanyaan_id = p.id
       WHERE j.sesi_id = ?`,
      [sesiId]
    );

    const hasilAHP = prosesAHP(semuaJawaban);

    // Simpan CR
    await pool.query(
      'UPDATE sesi_kuesioner SET cr = ? WHERE id = ?',
      [hasilAHP.cr, sesiId]
    );

    // Simpan bobot
    await pool.query('DELETE FROM bobot_sesi WHERE sesi_id = ?', [sesiId]);
    for (let i = 0; i < 7; i++) {
      await pool.query(
        'INSERT INTO bobot_sesi (sesi_id, kriteria_id, bobot) VALUES (?, ?, ?)',
        [sesiId, i + 1, hasilAHP.bobot[i]]
      );
    }

    if (hasilAHP.konsisten) {
      // CR ≤ 0.1
      await pool.query(
        'UPDATE sesi_kuesioner SET status = ? WHERE id = ?',
        ['konsisten', sesiId]
      );

      const bobotObj = {};
      for (let i = 0; i < 7; i++) {
        bobotObj[`C${i + 1}`] = hasilAHP.bobot[i];
      }

      return res.json({
        status: 'konsisten',
        cr: hasilAHP.cr,
        bobot: bobotObj,
      });
    }

    // CR > 0.1
    const currentPutaran = sesi[0].putaran_ulang;
    if (currentPutaran < 2) {
      // Masih bisa ulang
      const newPutaran = currentPutaran + 1;
      await pool.query(
        'UPDATE sesi_kuesioner SET putaran_ulang = ?, status = ? WHERE id = ?',
        [newPutaran, 'berjalan', sesiId]
      );

      // Cari pertanyaan yang bermasalah
      const pasanganBermasalah = hasilAHP.pasanganBermasalah;
      const pertanyaanBermasalah = [];

      for (const p of pasanganBermasalah) {
        const kiriId = p.i + 1;
        const kananId = p.j + 1;

        const [pertanyaan] = await pool.query(
          'SELECT id, teks FROM pertanyaan WHERE kriteria_kiri_id = ? AND kriteria_kanan_id = ?',
          [kiriId, kananId]
        );

        if (pertanyaan.length > 0) {
          const jawSaatIni = semuaJawaban.find(
            (j) => j.kriteria_kiri_id === kiriId && j.kriteria_kanan_id === kananId
          );

          pertanyaanBermasalah.push({
            pertanyaan_id: pertanyaan[0].id,
            teks: pertanyaan[0].teks,
            jawaban_saat_ini: jawSaatIni
              ? { arah: jawSaatIni.arah, tingkat: jawSaatIni.tingkat }
              : null,
            saran: p.saran,
          });
        }
      }

      return res.json({
        status: 'perlu_ulang',
        cr: hasilAHP.cr,
        putaran_ulang: newPutaran,
        pasangan_bermasalah: pertanyaanBermasalah,
      });
    }

    // Sudah 2 putaran, tetap tidak konsisten
    await pool.query(
      'UPDATE sesi_kuesioner SET status = ?, putaran_ulang = ? WHERE id = ?',
      ['tidak_konsisten_dilanjutkan', 2, sesiId]
    );

    return res.json({
      status: 'tidak_konsisten',
      cr: hasilAHP.cr,
      putaran_ulang: 2,
    });
  } catch (err) {
    console.error('Put jawaban error:', err);
    res.status(500).json({ error: { kode: 'SERVER_ERROR', pesan: 'Kesalahan server' } });
  }
});

// POST /api/sesi/:id/lanjutkan — lanjutkan meski tidak konsisten
router.post('/:id/lanjutkan', async (req, res) => {
  try {
    const sesiId = req.params.id;
    const [sesi] = await pool.query(
      'SELECT id, status, putaran_ulang, cr FROM sesi_kuesioner WHERE id = ?',
      [sesiId]
    );
    if (sesi.length === 0) {
      return res.status(404).json({ error: { kode: 'SESI_TIDAK_DITEMUKAN', pesan: 'Sesi tidak ditemukan' } });
    }

    await pool.query(
      'UPDATE sesi_kuesioner SET status = ? WHERE id = ?',
      ['tidak_konsisten_dilanjutkan', sesiId]
    );

    // Ambil bobot
    const [bobotRows] = await pool.query(
      'SELECT k.kode, b.bobot FROM bobot_sesi b JOIN kriteria k ON b.kriteria_id = k.id WHERE b.sesi_id = ? ORDER BY k.id',
      [sesiId]
    );
    const bobotObj = {};
    for (const row of bobotRows) {
      bobotObj[row.kode] = parseFloat(row.bobot);
    }

    res.json({
      status: 'tidak_konsisten_dilanjutkan',
      cr: sesi[0].cr ? parseFloat(sesi[0].cr) : null,
      bobot: bobotObj,
    });
  } catch (err) {
    console.error('Lanjutkan error:', err);
    res.status(500).json({ error: { kode: 'SERVER_ERROR', pesan: 'Kesalahan server' } });
  }
});

export default router;
