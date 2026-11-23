import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPertanyaan, kirimJawaban, lanjutkanSesi } from '../api/client.js';
import SkalaPilihan from '../components/SkalaPilihan.jsx';
import PasanganBermasalah from '../components/PasanganBermasalah.jsx';
import Stepper from '../components/Stepper.jsx';

export default function Kuesioner() {
  const navigate = useNavigate();
  const sesiId = sessionStorage.getItem('sesi_id');

  const [pertanyaan, setPertanyaan] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [jawaban, setJawaban] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // State untuk penyesuaian prioritas
  const [mode, setMode] = useState('kuesioner'); // 'kuesioner' | 'ulang' | 'tidak_konsisten'
  const [pasanganBermasalah, setPasanganBermasalah] = useState([]);
  const [jawabanUlang, setJawabanUlang] = useState({});

  useEffect(() => {
    if (!sesiId) {
      navigate('/');
      return;
    }
    loadPertanyaan();
  }, []);

  const loadPertanyaan = async () => {
    try {
      const data = await getPertanyaan();
      setPertanyaan(data);
    } catch (err) {
      setError(err.pesan || 'Gagal memuat pertanyaan kuesioner.');
    } finally {
      setLoading(false);
    }
  };

  const handlePilih = (val) => {
    setJawaban({ ...jawaban, [pertanyaan[currentIdx].id]: val });
  };

  const lanjut = () => {
    if (currentIdx < pertanyaan.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const kembali = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const kirim = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const jawabanArr = pertanyaan.map((p) => ({
        pertanyaan_id: p.id,
        arah: jawaban[p.id].arah,
        tingkat: jawaban[p.id].tingkat,
      }));

      const result = await kirimJawaban(sesiId, jawabanArr);

      if (result.status === 'konsisten') {
        sessionStorage.setItem('bobot', JSON.stringify(result.bobot));
        sessionStorage.setItem('cr', result.cr);
        navigate('/filter');
      } else if (result.status === 'perlu_ulang') {
        setMode('ulang');
        const enriched = result.pasangan_bermasalah.map((p) => {
          const q = pertanyaan.find((pt) => pt.id === p.pertanyaan_id);
          return { ...p, kiri: q?.kiri, kanan: q?.kanan };
        });
        setPasanganBermasalah(enriched);
        setJawabanUlang({});
      } else if (result.status === 'tidak_konsisten') {
        setMode('tidak_konsisten');
      }
    } catch (err) {
      setError(err.pesan || 'Gagal mengirim jawaban.');
    } finally {
      setSubmitting(false);
    }
  };

  const kirimUlang = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const jawabanArr = pasanganBermasalah.map((p) => ({
        pertanyaan_id: p.pertanyaan_id,
        arah: jawabanUlang[p.pertanyaan_id].arah,
        tingkat: jawabanUlang[p.pertanyaan_id].tingkat,
      }));

      const result = await kirimJawaban(sesiId, jawabanArr);

      if (result.status === 'konsisten') {
        sessionStorage.setItem('bobot', JSON.stringify(result.bobot));
        sessionStorage.setItem('cr', result.cr);
        navigate('/filter');
      } else if (result.status === 'perlu_ulang') {
        const enriched = result.pasangan_bermasalah.map((p) => {
          const q = pertanyaan.find((pt) => pt.id === p.pertanyaan_id);
          return { ...p, kiri: q?.kiri, kanan: q?.kanan };
        });
        setPasanganBermasalah(enriched);
        setJawabanUlang({});
      } else if (result.status === 'tidak_konsisten') {
        setMode('tidak_konsisten');
      }
    } catch (err) {
      setError(err.pesan || 'Gagal mengirim penyesuaian jawaban.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLanjutkan = async () => {
    setSubmitting(true);
    try {
      const result = await lanjutkanSesi(sesiId);
      sessionStorage.setItem('bobot', JSON.stringify(result.bobot));
      sessionStorage.setItem('cr', result.cr);
      navigate('/filter');
    } catch (err) {
      setError(err.pesan || 'Gagal melanjutkan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUlangi = () => {
    setMode('kuesioner');
    setCurrentIdx(0);
    setJawaban({});
    setPasanganBermasalah([]);
    setJawabanUlang({});
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <Stepper activeStep={1} />
          <div className="loading"><div className="spinner"></div> Memuat pertanyaan kuesioner...</div>
        </div>
      </div>
    );
  }

  if (error && pertanyaan.length === 0) {
    return (
      <div className="page">
        <div className="container">
          <Stepper activeStep={1} />
          <div className="pesan pesan-error">{error}</div>
        </div>
      </div>
    );
  }

  // Mode: Pilihan kombinasi beragam setelah 2 putaran
  if (mode === 'tidak_konsisten') {
    return (
      <div className="page">
        <div className="container">
          <Stepper activeStep={1} />
          <div className="card" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
            <h2 className="page-judul" style={{ fontSize: 24, marginBottom: 12 }}>
              Preferensi Anda Cukup Beragam
            </h2>
            <p style={{ marginBottom: 24, color: 'var(--teks-sekunder)', lineHeight: 1.6 }}>
              Kombinasi prioritas yang Anda pilih memiliki variasi yang cukup luas.
              Anda bisa langsung melanjutkan untuk melihat motor rekomendasi terbaik, atau mengulang kuesioner dari awal.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primer" onClick={handleLanjutkan} disabled={submitting}>
                Lanjutkan ke Filter Motor →
              </button>
              <button className="btn btn-sekunder" onClick={handleUlangi} disabled={submitting}>
                ↺ Ulangi Kuesioner
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mode: Penyesuaian preferensi yang bertolak belakang
  if (mode === 'ulang') {
    const semuaTerisi = pasanganBermasalah.every((p) => jawabanUlang[p.pertanyaan_id]);

    return (
      <div className="page">
        <div className="container">
          <Stepper activeStep={1} />
          <h1 className="page-judul">Penyesuaian Preferensi</h1>
          <p className="page-subjudul">
            Ada beberapa prioritas yang tampaknya saling bertolak belakang. Silakan sesuaikan kembali agar rekomendasi motor lebih akurat sesuai kebutuhan Anda.
          </p>

          {error && <div className="pesan pesan-error" style={{ marginBottom: 16 }}>{error}</div>}

          <PasanganBermasalah
            pasangan={pasanganBermasalah}
            jawaban={jawabanUlang}
            onChange={(id, val) => setJawabanUlang({ ...jawabanUlang, [id]: val })}
          />

          <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <button
              className="btn btn-primer btn-lg"
              disabled={!semuaTerisi || submitting}
              onClick={kirimUlang}
              style={{ minWidth: 280 }}
            >
              {submitting ? '⏳ Memproses...' : '📤 Simpan & Cek Hasil'}
            </button>
            <button
              type="button"
              className="btn btn-sekunder"
              disabled={submitting}
              onClick={handleLanjutkan}
              style={{ minWidth: 280 }}
            >
              ⏩ Lewati Perbaikan & Langsung ke Filter Motor
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mode: Kuesioner normal
  const p = pertanyaan[currentIdx];
  const sudahDipilih = jawaban[p?.id] != null;
  const semuaTerisi = pertanyaan.every((pt) => jawaban[pt.id] != null);
  const isLast = currentIdx === pertanyaan.length - 1;

  return (
    <div className="page">
      <div className="container">
        <Stepper activeStep={1} />

        <h1 className="page-judul">Kuesioner Preferensi Motor</h1>
        <p className="page-subjudul">Pilih mana yang lebih Anda utamakan di antara dua kriteria berikut</p>

        <div className="progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((currentIdx + 1) / pertanyaan.length) * 100}%` }}></div>
          </div>
          <span className="progress-teks">Pertanyaan {currentIdx + 1} dari {pertanyaan.length}</span>
        </div>

        {error && <div className="pesan pesan-error" style={{ marginBottom: 16 }}>{error}</div>}

        <div className="card" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, textAlign: 'center' }}>
            {p.teks}
          </p>

          <SkalaPilihan
            kiri={p.kiri}
            kanan={p.kanan}
            value={jawaban[p.id] || null}
            onChange={handlePilih}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <button className="btn btn-sekunder" onClick={kembali} disabled={currentIdx === 0}>
            ← Sebelumnya
          </button>

          {isLast ? (
            <button
              className="btn btn-primer"
              disabled={!semuaTerisi || submitting}
              onClick={kirim}
            >
              {submitting ? '⏳ Menganalisis...' : '📤 Selesai & Lanjut ke Filter'}
            </button>
          ) : (
            <button className="btn btn-primer" onClick={lanjut} disabled={!sudahDipilih}>
              Selanjutnya →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
