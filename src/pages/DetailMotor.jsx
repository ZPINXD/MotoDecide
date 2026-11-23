import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMotorDetail } from '../api/client.js';

const KRITERIA_LABEL = {
  C1: 'Harga',
  C2: 'Tahun Produksi',
  C3: 'Kilometer',
  C4: 'Kapasitas Mesin (CC)',
  C5: 'Kondisi Mesin',
  C6: 'Kondisi Body',
  C7: 'Dokumen & Pajak',
};

export default function DetailMotor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [motor, setMotor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ambil kontribusi & persentase dari sessionStorage jika ada
  const [kontribusi, setKontribusi] = useState(null);
  const [persentase, setPersentase] = useState(null);

  useEffect(() => {
    loadMotor();

    try {
      const storedKontribusi = sessionStorage.getItem('kontribusi_' + id);
      if (storedKontribusi) setKontribusi(JSON.parse(storedKontribusi));

      const storedPersentase = sessionStorage.getItem('persentase_' + id);
      if (storedPersentase) setPersentase(storedPersentase);
    } catch {}
  }, [id]);

  const loadMotor = async () => {
    setLoading(true);
    try {
      const data = await getMotorDetail(id);
      setMotor(data);
    } catch (err) {
      setError(err.pesan || 'Gagal memuat detail motor.');
    } finally {
      setLoading(false);
    }
  };

  const formatHarga = (h) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(h);

  const formatKm = (km) =>
    new Intl.NumberFormat('id-ID').format(km);

  const skorLabel = (skor) => {
    if (skor >= 5) return { text: 'Sangat Baik', cls: 'badge-sukses' };
    if (skor >= 4) return { text: 'Baik', cls: 'badge-info' };
    if (skor >= 3) return { text: 'Cukup', cls: 'badge-peringatan' };
    return { text: 'Kurang', cls: 'badge-bahaya' };
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="loading"><div className="spinner"></div> Memuat detail motor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="container">
          <div className="pesan pesan-error">{error}</div>
          <button onClick={() => navigate(-1)} className="btn btn-sekunder" style={{ marginTop: 16 }}>
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!motor) return null;

  const mesinInfo = skorLabel(motor.skor_mesin);
  const bodyInfo = skorLabel(motor.skor_body);
  const dokumenInfo = skorLabel(motor.skor_dokumen);

  return (
    <div className="page">
      <div className="container">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-sm btn-sekunder"
          style={{ marginBottom: 20 }}
        >
          ← Kembali
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-judul" style={{ marginBottom: 4 }}>{motor.merek} {motor.model}</h1>
            <p className="page-subjudul" style={{ marginBottom: 0 }}>
              Tahun Perakitan: {motor.tahun} • Kapasitas Mesin: {motor.cc} CC
            </p>
          </div>

          {persentase && (
            <div style={{ background: 'var(--putih)', padding: '8px 16px', borderRadius: 'var(--radius)', border: '2px solid var(--aksen)' }}>
              <span style={{ fontSize: 13, color: 'var(--teks-sekunder)', display: 'block' }}>Kesesuaian Preferensi</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--aksen)' }}>{persentase}% Sesuai</span>
            </div>
          )}
        </div>

        <div className="detail-grid">
          <div className="card">
            <h3 className="card-judul">📋 Informasi Spesifikasi</h3>
            <dl className="detail-attr">
              <dt>Merek</dt>
              <dd>{motor.merek}</dd>
              <dt>Model</dt>
              <dd>{motor.model}</dd>
              <dt>Tahun Produksi</dt>
              <dd>{motor.tahun}</dd>
              <dt>Harga Pasaran</dt>
              <dd style={{ color: 'var(--aksen)', fontWeight: 700 }}>{formatHarga(motor.harga)}</dd>
              <dt>Jarak Tempuh</dt>
              <dd>{formatKm(motor.km)} km</dd>
              <dt>Kapasitas Mesin</dt>
              <dd>{motor.cc} CC</dd>
              {motor.lokasi && (
                <>
                  <dt>Lokasi Unit</dt>
                  <dd>{motor.lokasi}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="card">
            <h3 className="card-judul">⭐ Kondisi Fisik & Legalitas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>Kondisi Mesin</span>
                  <span className={`badge ${mesinInfo.cls}`}>{motor.skor_mesin}/5 — {mesinInfo.text}</span>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>Kondisi Body</span>
                  <span className={`badge ${bodyInfo.cls}`}>{motor.skor_body}/5 — {bodyInfo.text}</span>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>Dokumen & Pajak</span>
                  <span className={`badge ${dokumenInfo.cls}`}>{motor.skor_dokumen}/5 — {dokumenInfo.text}</span>
                </div>
              </div>
            </div>

            {motor.tautan_iklan && (
              <a
                href={motor.tautan_iklan}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primer"
                style={{ width: '100%', marginTop: 24 }}
              >
                🔗 Buka Tautan Iklan Asli ↗
              </a>
            )}
          </div>
        </div>

        {kontribusi && (
          <div className="card" style={{ marginTop: 24 }}>
            <h3 className="card-judul">📊 Analisis Kontribusi Kriteria (Weighted Product)</h3>
            <p style={{ fontSize: 14, color: 'var(--teks-sekunder)', marginBottom: 16 }}>
              Grafik kontribusi kriteria terhadap skor akhir motor ini berdasarkan bobot kuesioner Anda:
            </p>
            {Object.entries(kontribusi).map(([kode, nilai]) => {
              const maxAbs = Math.max(...Object.values(kontribusi).map(Math.abs));
              const pct = maxAbs > 0 ? (Math.abs(nilai) / maxAbs) * 100 : 0;
              return (
                <div key={kode} className="kontribusi-bar">
                  <span className="kontribusi-label">{KRITERIA_LABEL[kode] || kode}</span>
                  <div className="kontribusi-track">
                    <div
                      className={`kontribusi-fill ${nilai >= 0 ? 'positif' : 'negatif'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="kontribusi-value">{nilai.toFixed(4)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
