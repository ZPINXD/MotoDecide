import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMotor } from '../api/client.js';

export default function KatalogMotor() {
  const [motorList, setMotorList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [keyword, setKeyword] = useState('');
  const [hargaMaxDisplay, setHargaMaxDisplay] = useState('');
  const [hargaMax, setHargaMax] = useState('');
  const [tahunMin, setTahunMin] = useState('');
  const [kmMaxDisplay, setKmMaxDisplay] = useState('');
  const [kmMax, setKmMax] = useState('');
  const [ccMax, setCcMax] = useState('');

  // Auto-format separator titik
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

  const resetFilter = () => {
    setKeyword('');
    setHargaMax('');
    setHargaMaxDisplay('');
    setTahunMin('');
    setKmMax('');
    setKmMaxDisplay('');
    setCcMax('');
  };

  useEffect(() => {
    loadMotors();
  }, []);

  const loadMotors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMotor();
      setMotorList(data.data || []);
      setFilteredList(data.data || []);
    } catch (err) {
      setError(err.pesan || 'Gagal memuat data motor bekas.');
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering across keyword and inputs
  useEffect(() => {
    let result = [...motorList];

    if (keyword.trim()) {
      const q = keyword.toLowerCase();
      result = result.filter(
        (m) =>
          m.merek?.toLowerCase().includes(q) ||
          m.model?.toLowerCase().includes(q) ||
          m.tahun?.toString().includes(q)
      );
    }

    if (hargaMax) {
      const val = parseInt(hargaMax, 10);
      result = result.filter((m) => Number(m.harga) <= val);
    }

    if (tahunMin) {
      const val = parseInt(tahunMin, 10);
      result = result.filter((m) => Number(m.tahun) >= val);
    }

    if (kmMax) {
      const val = parseInt(kmMax, 10);
      result = result.filter((m) => Number(m.km) <= val);
    }

    if (ccMax) {
      const val = parseInt(ccMax, 10);
      result = result.filter((m) => Number(m.cc) <= val);
    }

    setFilteredList(result);
  }, [keyword, hargaMax, tahunMin, kmMax, ccMax, motorList]);

  const formatHarga = (h) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(h);

  const formatKm = (km) =>
    new Intl.NumberFormat('id-ID').format(km) + ' km';

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-judul" style={{ marginBottom: 4 }}>Katalog Motor Bekas</h1>
            <p className="page-subjudul" style={{ marginBottom: 0 }}>
              Menampilkan {filteredList.length} dari total {motorList.length} motor bekas di database
            </p>
          </div>
          <Link to="/kuesioner" className="btn btn-primer">
            ⚡ Cari Rekomendasi Pintar (AHP-WP)
          </Link>
        </div>

        {/* SEARCH & FILTER BOX */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">🔍 Cari Merek / Model Motor</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ketik merek atau model (contoh: Vario, Beat, Mio, PCX)..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

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
            </div>
            <div className="form-group">
              <label className="form-label">📅 Tahun Minimum</label>
              <input
                type="number"
                className="form-input"
                placeholder="Contoh: 2015"
                value={tahunMin}
                onChange={(e) => setTahunMin(e.target.value)}
                min="1990"
                max={new Date().getFullYear()}
              />
            </div>
            <div className="form-group">
              <label className="form-label">🛣️ Kilometer Maksimum</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 50.000"
                value={kmMaxDisplay}
                onChange={handleKmChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">⚙️ CC Maksimum</label>
              <input
                type="number"
                className="form-input"
                placeholder="Contoh: 160"
                value={ccMax}
                onChange={(e) => setCcMax(e.target.value)}
                min="0"
              />
            </div>
          </div>

          {(keyword || hargaMax || tahunMin || kmMax || ccMax) && (
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <button className="btn btn-sm btn-sekunder" onClick={resetFilter}>
                ✕ Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* LOADING & ERROR */}
        {loading && (
          <div className="loading">
            <div className="spinner"></div> Memuat daftar motor...
          </div>
        )}

        {error && (
          <div className="pesan pesan-error" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* LIST / GRID MOTOR */}
        {!loading && filteredList.length === 0 ? (
          <div className="kosong card">
            <h3>Tidak ada motor yang cocok</h3>
            <p>Coba sesuaikan kata kunci atau longgarkan filter pencarian Anda.</p>
            <button className="btn btn-sekunder" onClick={resetFilter} style={{ marginTop: 12 }}>
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filteredList.map((m) => (
              <div key={m.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--primer)' }}>
                      {m.merek} {m.model}
                    </h3>
                    <span className="badge badge-info">{m.tahun}</span>
                  </div>

                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--aksen)', marginBottom: 12 }}>
                    {formatHarga(m.harga)}
                  </div>

                  <div style={{ fontSize: 14, color: 'var(--teks-sekunder)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
                    <div>🛣️ Odometer: <strong>{formatKm(m.km)}</strong></div>
                    <div>⚙️ Mesin: <strong>{m.cc} CC</strong></div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      <span className="badge badge-sukses">Mesin {m.skor_mesin}/5</span>
                      <span className="badge badge-sukses">Body {m.skor_body}/5</span>
                      <span className="badge badge-sukses">Dokumen {m.skor_dokumen}/5</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <Link to={`/motor/${m.id}`} className="btn btn-sm btn-sekunder" style={{ flex: 1 }}>
                    Lihat Detail
                  </Link>
                  {m.tautan_iklan && (
                    <a
                      href={m.tautan_iklan}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-primer"
                    >
                      Iklan ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

