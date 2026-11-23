import { useState, useEffect } from 'react';
import { getMetodologi } from '../api/client.js';

export default function Metodologi() {
  const sesiId = sessionStorage.getItem('sesi_id');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await getMetodologi(sesiId);
      setData(result);
    } catch (err) {
      setError(err.pesan || 'Gagal memuat data metodologi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <div className="loading"><div className="spinner"></div> Memuat metodologi...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="container">
          <div className="pesan pesan-error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <h1 className="page-judul">Metodologi</h1>
        <p className="page-subjudul">
          Website ini menggunakan metode <strong>AHP</strong> (Analytical Hierarchy Process) untuk menentukan bobot kriteria
          dan <strong>WP</strong> (Weighted Product) untuk menghitung peringkat motor.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* AHP */}
          <div className="card">
            <h3 className="card-judul">📐 AHP — Analytical Hierarchy Process</h3>
            <p style={{ marginBottom: 12 }}>
              AHP digunakan untuk menghitung bobot setiap kriteria berdasarkan perbandingan berpasangan
              yang Anda berikan melalui kuesioner.
            </p>
            <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              <li>Setiap pasangan kriteria dibandingkan dengan skala 1–9</li>
              <li>Jawaban membentuk matriks perbandingan 7×7</li>
              <li>Bobot dihitung dari rata-rata baris matriks ternormalisasi</li>
              <li>Consistency Ratio (CR) dihitung untuk memvalidasi konsistensi</li>
              <li>CR ≤ {data?.batas_cr || 0.1} dianggap konsisten (RI = {data?.ri || 1.32})</li>
            </ul>
          </div>

          {/* WP */}
          <div className="card">
            <h3 className="card-judul">📊 WP — Weighted Product</h3>
            <p style={{ marginBottom: 12 }}>
              Metode WP menghitung nilai setiap motor menggunakan bobot yang telah didapat dari AHP.
            </p>
            <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
              <li>Kriteria <strong>cost</strong> menggunakan pangkat negatif (harga rendah lebih baik)</li>
              <li>Kriteria <strong>benefit</strong> menggunakan pangkat positif (nilai tinggi lebih baik)</li>
              <li>Nilai S = Π (xᵢⱼ)^(pangkatⱼ) untuk setiap kriteria</li>
              <li>Nilai V = Sᵢ / Σ Sₖ</li>
              <li>Motor diurutkan berdasarkan nilai V dari terbesar ke terkecil</li>
            </ul>
          </div>

          {/* Kriteria */}
          <div className="card">
            <h3 className="card-judul">📋 Tujuh Kriteria Penilaian</h3>
            <table className="tabel" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Kriteria</th>
                  <th>Jenis</th>
                </tr>
              </thead>
              <tbody>
                {data?.kriteria?.map((k) => (
                  <tr key={k.id}>
                    <td><strong>{k.kode}</strong></td>
                    <td>{k.nama}</td>
                    <td>
                      <span className={`badge ${k.jenis === 'cost' ? 'badge-bahaya' : 'badge-sukses'}`}>
                        {k.jenis}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bobot pengguna */}
          {data?.bobot && (
            <div className="card">
              <h3 className="card-judul">⚖️ Bobot Anda</h3>
              <p style={{ marginBottom: 8, fontSize: 14, color: 'var(--teks-sekunder)' }}>
                CR = {data.cr?.toFixed(4)} {data.cr <= 0.1 ?
                  <span className="badge badge-sukses" style={{ marginLeft: 8 }}>Konsisten</span> :
                  <span className="badge badge-peringatan" style={{ marginLeft: 8 }}>Tidak Konsisten</span>
                }
              </p>
              <table className="tabel" style={{ marginTop: 8 }}>
                <thead>
                  <tr>
                    <th>Kriteria</th>
                    <th>Bobot</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.bobot).map(([kode, bobot]) => {
                    const kriteria = data.kriteria?.find((k) => k.kode === kode);
                    return (
                      <tr key={kode}>
                        <td>{kriteria?.nama || kode}</td>
                        <td style={{ fontFamily: 'var(--mono)' }}>{bobot.toFixed(6)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

