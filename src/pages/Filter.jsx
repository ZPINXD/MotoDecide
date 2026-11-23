import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMotor } from '../api/client.js';
import Stepper from '../components/Stepper.jsx';

export default function Filter() {
  const navigate = useNavigate();
  const sesiId = sessionStorage.getItem('sesi_id');

  const [hargaMaxDisplay, setHargaMaxDisplay] = useState('');
  const [hargaMax, setHargaMax] = useState('');
  const [tahunMin, setTahunMin] = useState('');
  const [kmMaxDisplay, setKmMaxDisplay] = useState('');
  const [kmMax, setKmMax] = useState('');
  const [ccMax, setCcMax] = useState('');
  const [preview, setPreview] = useState(null);

  // Format angka ribuan dengan titik (15000000 -> 15.000.000)
  const formatRibuan = (str) => {
    if (!str) return '';
    const clean = str.toString().replace(/\D/g, '');
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleHargaChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setHargaMax(raw);
    setHargaMaxDisplay(formatRibuan(raw));
  };

  const handleKmChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setKmMax(raw);
    setKmMaxDisplay(formatRibuan(raw));
  };

  useEffect(() => {
    if (!sesiId) {
      navigate('/kuesioner');
      return;
    }
    loadPreview();

    // Load filter sebelumnya jika ada di sessionStorage
    try {
      const stored = JSON.parse(sessionStorage.getItem('filter') || '{}');
      if (stored.harga_max) {
        setHargaMax(stored.harga_max.toString());
        setHargaMaxDisplay(formatRibuan(stored.harga_max.toString()));
      }
      if (stored.tahun_min) setTahunMin(stored.tahun_min.toString());
      if (stored.km_max) {
        setKmMax(stored.km_max.toString());
        setKmMaxDisplay(formatRibuan(stored.km_max.toString()));
      }
      if (stored.cc_max) setCcMax(stored.cc_max.toString());
    } catch {}
  }, []);

  const loadPreview = async () => {
    try {
      const data = await getMotor();
      setPreview(data);
    } catch {
      // Ignore
    }
  };

  const tampilkanHasil = () => {
    const filter = {};
    if (hargaMax) filter.harga_max = parseInt(hargaMax, 10);
    if (tahunMin) filter.tahun_min = parseInt(tahunMin, 10);
    if (kmMax) filter.km_max = parseInt(kmMax, 10);
    if (ccMax) filter.cc_max = parseInt(ccMax, 10);
    sessionStorage.setItem('filter', JSON.stringify(filter));
    navigate('/hasil');
  };

  return (
    <div className="page">
      <div className="container">
        <Stepper activeStep={2} />

        <h1 className="page-judul">Filter Spesifikasi Motor</h1>
        <p className="page-subjudul">
          Batasi pencarian sesuai kriteria yang Anda inginkan (semua opsi bersifat opsional).
          {preview && ` Total motor dalam database: ${preview.total} unit.`}
        </p>

        <div className="card" style={{ marginBottom: 24 }}>
          <div className="filter-grid">
            <div className="form-group">
              <label className="form-label">💰 Harga Maksimum (Rp)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 15.000.000"
                value={hargaMaxDisplay}
                onChange={handleHargaChange}
              />
              <span style={{ fontSize: 12, color: 'var(--teks-sekunder)' }}>
                Format otomatis dengan titik ribuan
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">📅 Tahun Produksi Minimum</label>
              <input
                type="number"
                className="form-input"
                placeholder="Contoh: 2015"
                value={tahunMin}
                onChange={(e) => setTahunMin(e.target.value)}
                min="1990"
                max={new Date().getFullYear()}
              />
              <span style={{ fontSize: 12, color: 'var(--teks-sekunder)' }}>
                Tahun perakitan minimal motor
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">🛣️ Jarak Tempuh Maksimum (KM)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 50.000"
                value={kmMaxDisplay}
                onChange={handleKmChange}
              />
              <span style={{ fontSize: 12, color: 'var(--teks-sekunder)' }}>
                Odometer maksimal pada speedometer
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">⚙️ Kapasitas Mesin Maksimum (CC)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Contoh: 160"
                value={ccMax}
                onChange={(e) => setCcMax(e.target.value)}
                min="0"
              />
              <span style={{ fontSize: 12, color: 'var(--teks-sekunder)' }}>
                Batasan cc mesin (misal: 110, 125, 150, 250)
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <button className="btn btn-sekunder" onClick={() => navigate('/kuesioner')}>
            ← Kembali ke Kuesioner
          </button>
          <button className="btn btn-primer btn-lg" onClick={tampilkanHasil}>
            📊 Tampilkan Hasil Rekomendasi →
          </button>
        </div>
      </div>
    </div>
  );
}
