import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import pertanyaanRouter from './routes/pertanyaan.js';
import sesiRouter from './routes/sesi.js';
import motorRouter from './routes/motor.js';
import peringkatRouter from './routes/peringkat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/pertanyaan', pertanyaanRouter);
app.use('/api/sesi', sesiRouter);
app.use('/api/motor', motorRouter);
app.use('/api', peringkatRouter);

// Metodologi endpoint
app.get('/api/metodologi', async (req, res) => {
  try {
    const { default: pool } = await import('./db.js');
    const [kriteria] = await pool.query('SELECT id, kode, nama, jenis, kolom_motor FROM kriteria ORDER BY id');

    // Jika ada sesi_id di query, ambil bobot dan CR
    let bobot = null;
    let cr = null;
    if (req.query.sesi_id) {
      const [sesi] = await pool.query('SELECT cr FROM sesi_kuesioner WHERE id = ?', [req.query.sesi_id]);
      if (sesi.length > 0) {
        cr = sesi[0].cr;
        const [bobotRows] = await pool.query(
          'SELECT k.kode, b.bobot FROM bobot_sesi b JOIN kriteria k ON b.kriteria_id = k.id WHERE b.sesi_id = ? ORDER BY k.id',
          [req.query.sesi_id]
        );
        if (bobotRows.length > 0) {
          bobot = {};
          for (const row of bobotRows) {
            bobot[row.kode] = parseFloat(row.bobot);
          }
        }
      }
    }

    res.json({
      kriteria,
      ri: 1.32,
      batas_cr: 0.1,
      bobot,
      cr: cr ? parseFloat(cr) : null,
    });
  } catch (err) {
    console.error('Metodologi error:', err);
    res.status(500).json({ error: { kode: 'SERVER_ERROR', pesan: 'Kesalahan server' } });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: { kode: 'SERVER_ERROR', pesan: 'Kesalahan server' } });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});

