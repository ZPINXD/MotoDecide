import { useNavigate } from 'react-router-dom';
import { buatSesi, getMetodologi } from '../api/client.js';
import { useState, useEffect } from 'react';

export default function Beranda() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metodologiData, setMetodologiData] = useState(null);

  useEffect(() => {
    getMetodologi()
      .then((data) => setMetodologiData(data))
      .catch(() => {});
  }, []);

  const mulai = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await buatSesi();
      sessionStorage.setItem('sesi_id', data.sesi_id);
      navigate('/kuesioner');
    } catch (err) {
      setError(err.pesan || 'Gagal memulai sesi. Pastikan server backend sedang berjalan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        {/* HERO SECTION */}
        <div className="hero">
          <h1>Sistem Pendukung Keputusan<br />Pemilihan Motor Bekas</h1>
          <p>
            Bingung memilih motor bekas yang pas untuk kebutuhan dan budget Anda?
            Sistem ini menggunakan metode <strong>AHP</strong> untuk memahami prioritas pribadi Anda dan <strong>Weighted Product (WP)</strong> untuk mencari rekomendasi motor paling cocok secara objektif.
          </p>

          <div className="langkah-grid">
            <div className="langkah-item card">
              <div className="langkah-nomor">1</div>
              <h3>Tentukan Prioritas</h3>
              <p>Jawab perbandingan sederhana kriteria motor idaman Anda (harga, tahun, kondisi, dll).</p>
            </div>
            <div className="langkah-item card">
              <div className="langkah-nomor">2</div>
              <h3>Sesuaikan Budget</h3>
              <p>Atur batas maksimal harga, jarak tempuh, atau kapasitas mesin sesuai kebutuhan Anda.</p>
            </div>
            <div className="langkah-item card">
              <div className="langkah-nomor">3</div>
              <h3>Dapatkan Rekomendasi</h3>
              <p>Lihat peringkat motor bekas terbaik lengkap dengan persentase tingkat kecocokannya.</p>
            </div>
          </div>

          {error && <div className="pesan pesan-error" style={{ marginBottom: 16 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primer btn-lg" onClick={mulai} disabled={loading}>
              {loading ? '⏳ Menyiapkan Sesi...' : '🚀 Mulai Cari Rekomendasi Sekarang'}
            </button>
            <button
              className="btn btn-sekunder btn-lg"
              onClick={() => navigate('/katalog')}
            >
              🏍️ Lihat Semua Motor Bekas
            </button>
          </div>
        </div>

        {/* METODOLOGI & TRANSPARANSI SISTEM SECTION */}
        <div style={{ marginTop: 60 }}>
          <h2 className="page-judul" style={{ textAlign: 'center', marginBottom: 8 }}>
            🧠 Bagaimana Sistem Kami Bekerja?
          </h2>
          <p className="page-subjudul" style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 32px' }}>
            Transparansi algoritma pengambilan keputusan menggunakan kombinasi metode ilmiah AHP dan Weighted Product.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card">
              <h3 className="card-judul">1. Analisis Prioritas Pribadi (AHP)</h3>
              <p style={{ marginBottom: 12 }}>
                Setiap orang memiliki preferensi unik. Ada yang lebih mementingkan harga murah, ada pula yang mengutamakan kelengkapan surat dan kondisi mesin yang prima. Metode <em>Analytical Hierarchy Process</em> (AHP) mengubah perbandingan prioritas Anda menjadi bobot matematis yang presisi dan menguji konsistensi pilihan Anda.
              </p>
            </div>

            <div className="card">
              <h3 className="card-judul">2. Perhitungan Skor Kecocokan Motor (Weighted Product)</h3>
              <p style={{ marginBottom: 12 }}>
                Metode <em>Weighted Product</em> (WP) mengevaluasi seluruh alternatif motor di database dengan memangkatkan nilai atribut motor terhadap bobot preferensi Anda:
              </p>
              <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
                <li><strong>Kriteria Cost (Biaya):</strong> Semakin rendah nilainya semakin bagus (contoh: Harga murah dan Kilometer rendah).</li>
                <li><strong>Kriteria Benefit (Keuntungan):</strong> Semakin tinggi nilainya semakin bagus (contoh: Tahun lebih muda, CC lebih besar, dan Skor Kondisi mesin/body/dokumen).</li>
                <li>Hasil akhir dikonversi menjadi <strong>Persentase Kecocokan</strong> untuk mempermudah Anda memilih motor yang paling sesuai.</li>
              </ul>
            </div>

            <div className="card">
              <h3 className="card-judul">📋 7 Kriteria yang Digunakan dalam Penilaian</h3>
              <div style={{ overflowX: 'auto', marginTop: 12 }}>
                <table className="tabel">
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Kriteria</th>
                      <th>Jenis Sifat</th>
                      <th>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(metodologiData?.kriteria || [
                      { kode: 'C1', nama: 'Harga', jenis: 'cost' },
                      { kode: 'C2', nama: 'Tahun Produksi', jenis: 'benefit' },
                      { kode: 'C3', nama: 'Kilometer (Jarak Tempuh)', jenis: 'cost' },
                      { kode: 'C4', nama: 'Kapasitas Mesin (CC)', jenis: 'benefit' },
                      { kode: 'C5', nama: 'Kondisi Mesin', jenis: 'benefit' },
                      { kode: 'C6', nama: 'Kondisi Body Motor', jenis: 'benefit' },
                      { kode: 'C7', nama: 'Kelengkapan Dokumen & Pajak', jenis: 'benefit' },
                    ]).map((k) => (
                      <tr key={k.kode}>
                        <td><strong>{k.kode}</strong></td>
                        <td>{k.nama}</td>
                        <td>
                          <span className={`badge ${k.jenis === 'cost' ? 'badge-bahaya' : 'badge-sukses'}`}>
                            {k.jenis.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontSize: 14, color: 'var(--teks-sekunder)' }}>
                          {k.jenis === 'cost' ? 'Semakin rendah nilainya, semakin diprioritaskan' : 'Semakin tinggi nilainya, semakin diprioritaskan'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
