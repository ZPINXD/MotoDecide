import SkalaPilihan from './SkalaPilihan.jsx';

/**
 * PasanganBermasalah — tampilkan pertanyaan yang perlu dijawab ulang dengan petunjuk cerdas
 * Props:
 *   pasangan: array of { pertanyaan_id, teks, jawaban_saat_ini, kiri, kanan, saran }
 *   jawaban: object { [pertanyaan_id]: { arah, tingkat } }
 *   onChange: (pertanyaan_id, val) => void
 */
export default function PasanganBermasalah({ pasangan, jawaban, onChange }) {
  // Terapkan semua saran sekaligus
  const terapkanSemuaSaran = () => {
    pasangan.forEach((p) => {
      if (p.saran) {
        onChange(p.pertanyaan_id, {
          arah: p.saran.arah,
          tingkat: p.saran.tingkat,
        });
      }
    });
  };

  const getTeksSaran = (p) => {
    if (!p.saran) return null;
    const { arah, tingkat } = p.saran;
    if (arah === 'sama') {
      return (
        <span>
          Pilihan yang logis: <strong>Sama Penting (Skala 1)</strong> karena prioritas kedua kriteria relatif seimbang dari jawaban Anda yang lain.
        </span>
      );
    }
    const namaKriteria = arah === 'kiri' ? (p.kiri?.nama || 'Kiri') : (p.kanan?.nama || 'Kanan');
    return (
      <span>
        Agar konsisten, condongkan pilihan ke arah{' '}
        <strong style={{ color: arah === 'kiri' ? 'var(--aksen-kiri)' : 'var(--aksen-kanan)' }}>
          {namaKriteria}
        </strong>{' '}
        (disarankan tingkat <strong>{tingkat}</strong>).
      </span>
    );
  };

  return (
    <div>
      <div className="pesan pesan-peringatan" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <strong>⚠️ Terdeteksi Pilihan yang Bertolak Belakang</strong>
            <p style={{ fontSize: 14, marginTop: 4, marginBottom: 0 }}>
              Sistem menemukan beberapa perbandingan yang kontradiktif. Anda bisa mengikuti petunjuk logis di bawah atau langsung klik tombol bantu otomatis.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-primer"
            onClick={terapkanSemuaSaran}
            style={{ boxShadow: '0 2px 8px rgba(24, 188, 156, 0.3)' }}
          >
            ✨ Bantu Sesuaikan Semua Otomatis
          </button>
        </div>
      </div>

      {pasangan.map((p, idx) => {
        const saran = p.saran;
        const currentJawaban = jawaban[p.pertanyaan_id];
        const isSaranSelected =
          saran &&
          currentJawaban &&
          currentJawaban.arah === saran.arah &&
          currentJawaban.tingkat === saran.tingkat;

        return (
          <div key={p.pertanyaan_id} className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--primer)', margin: 0 }}>
                {idx + 1}. {p.teks}
              </p>
              {p.jawaban_saat_ini && (
                <span className="badge badge-peringatan" style={{ flexShrink: 0, marginLeft: 12 }}>
                  Pilihan sebelumnya:{' '}
                  {p.jawaban_saat_ini.arah === 'sama'
                    ? 'Sama Penting'
                    : `${p.jawaban_saat_ini.arah === 'kiri' ? p.kiri?.nama || 'Kiri' : p.kanan?.nama || 'Kanan'} (${p.jawaban_saat_ini.tingkat})`}
                </span>
              )}
            </div>

            {/* KOTAK PETUNJUK LOGIS */}
            {saran && (
              <div
                style={{
                  background: isSaranSelected ? '#f0fdf4' : '#eff6ff',
                  border: `1px solid ${isSaranSelected ? '#86efac' : '#bfdbfe'}`,
                  borderRadius: 'var(--radius)',
                  padding: '12px 16px',
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 14, color: isSaranSelected ? '#166534' : '#1e40af' }}>
                  <strong>💡 Petunjuk Logis:</strong> {getTeksSaran(p)}
                </div>
                {!isSaranSelected ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-sekunder"
                    onClick={() => onChange(p.pertanyaan_id, { arah: saran.arah, tingkat: saran.tingkat })}
                    style={{ fontSize: 12, padding: '4px 10px' }}
                  >
                    ✨ Pilih Sesuai Petunjuk
                  </button>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                    ✓ Rekomendasi Terpilih
                  </span>
                )}
              </div>
            )}

            <SkalaPilihan
              kiri={p.kiri || { kode: '', nama: 'Kiri' }}
              kanan={p.kanan || { kode: '', nama: 'Kanan' }}
              value={jawaban[p.pertanyaan_id] || null}
              onChange={(val) => onChange(p.pertanyaan_id, val)}
            />
          </div>
        );
      })}
    </div>
  );
}
