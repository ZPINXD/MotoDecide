import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hitungPeringkat } from '../api/client.js';
import KartuMotor from '../components/KartuMotor.jsx';
import TabelPeringkat from '../components/TabelPeringkat.jsx';
import Stepper from '../components/Stepper.jsx';

export default function Hasil() {
  const navigate = useNavigate();
  const sesiId = sessionStorage.getItem('sesi_id');

  const [hasil, setHasil] = useState([]);
  const [totalKandidat, setTotalKandidat] = useState(0);
  const [jumlah, setJumlah] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('kartu'); // 'kartu' | 'tabel'

  useEffect(() => {
    let isMounted = true;

    if (!sesiId) {
      navigate('/kuesioner');
      return;
    }

    const fetchPeringkat = async () => {
      setLoading(true);
      try {
        const filter = JSON.parse(sessionStorage.getItem('filter') || '{}');
        const data = await hitungPeringkat(sesiId, { ...filter, jumlah });

        if (!isMounted) return;

        const rawHasil = data.hasil || [];
        const maxV = rawHasil[0]?.nilai_v || 1;

        // Konversi nilai V ke persentase kesesuaian pengguna (top rank ~98%)
        const formattedHasil = rawHasil.map((h) => {
          const persentase = Math.min(99, Math.max(40, Math.round((h.nilai_v / maxV) * 98)));
          return {
            ...h,
            persentase,
          };
        });

        setHasil(formattedHasil);
        setTotalKandidat(data.total_kandidat);
        setError(null); // Clear previous error

        // Simpan kontribusi & persentase ke sessionStorage untuk halaman detail
        for (const h of formattedHasil) {
          if (h.kontribusi) {
            sessionStorage.setItem('kontribusi_' + h.motor.id, JSON.stringify(h.kontribusi));
          }
          sessionStorage.setItem('persentase_' + h.motor.id, h.persentase.toString());
        }
      } catch (err) {
        if (!isMounted) return;

        if (err.kode === 'SESI_TIDAK_DITEMUKAN') {
          sessionStorage.clear();
          navigate('/');
          return;
        }
        if (err.kode === 'BELUM_KONSISTEN') {
          navigate('/kuesioner');
          return;
        }
        setError(err.pesan || 'Gagal memuat hasil rekomendasi motor.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPeringkat();

    return () => {
      isMounted = false;
    };
  }, [jumlah, sesiId, navigate]);

  const handleJumlahChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setJumlah(val);
  };

  if (loading && hasil.length === 0) {
    return (
      <div className="page">
        <div className="container">
          <Stepper activeStep={3} />
          <div className="loading">
            <div className="spinner"></div> Menghitung kesesuaian motor dengan preferensi Anda...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <Stepper activeStep={3} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-judul" style={{ marginBottom: 4 }}>Rekomendasi Motor Bekas Terbaik</h1>
            <p className="page-subjudul" style={{ marginBottom: 0 }}>
              Ditemukan {totalKandidat} motor yang sesuai dengan preferensi dan filter Anda
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className={`btn btn-sm ${viewMode === 'kartu' ? 'btn-primer' : 'btn-sekunder'}`}
                onClick={() => setViewMode('kartu')}
              >
                Kartu
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'tabel' ? 'btn-primer' : 'btn-sekunder'}`}
                onClick={() => setViewMode('tabel')}
              >
                Tabel
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>Tampilkan:</label>
              <select className="form-select" value={jumlah} onChange={handleJumlahChange} style={{ width: 'auto' }}>
                <option value={5}>5 Motor</option>
                <option value={10}>10 Motor</option>
                <option value={20}>20 Motor</option>
              </select>
            </div>
          </div>
        </div>

        {error && <div className="pesan pesan-error" style={{ marginBottom: 16 }}>{error}</div>}

        {hasil.length === 0 && !loading ? (
          <div className="kosong card">
            <h3>Tidak ada motor yang sesuai</h3>
            <p>Kriteria filter Anda terlalu ketat. Coba longgarkan batasan harga, kilometer, atau tahun.</p>
            <button className="btn btn-primer" onClick={() => navigate('/filter')} style={{ marginTop: 16 }}>
              ← Ubah Filter Pencarian
            </button>
          </div>
        ) : (
          <div>
            {viewMode === 'kartu' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {hasil.map((h) => (
                  <KartuMotor
                    key={h.motor.id}
                    peringkat={h.peringkat}
                    motor={h.motor}
                    persentase={h.persentase}
                  />
                ))}
              </div>
            ) : (
              <TabelPeringkat hasil={hasil} />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
              <button className="btn btn-sekunder" onClick={() => navigate('/filter')}>
                ← Sesuaikan Filter
              </button>
              <button className="btn btn-sekunder" onClick={() => navigate('/kuesioner')}>
                ↺ Atur Ulang Prioritas
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
