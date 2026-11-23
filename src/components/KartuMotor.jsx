import { Link } from 'react-router-dom';

/**
 * KartuMotor — tampilkan satu motor dalam daftar peringkat
 * Props:
 *   peringkat: number
 *   motor: { id, merek, model, tahun, harga, km, cc }
 *   persentase: number (misal 98 untuk 98% Cocok)
 */
export default function KartuMotor({ peringkat, motor, persentase }) {
  const formatHarga = (h) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(h);
  };

  const formatKm = (km) => {
    return new Intl.NumberFormat('id-ID').format(km) + ' km';
  };

  return (
    <div className="motor-card">
      <div className={`motor-peringkat${peringkat <= 3 ? ' top-3' : ''}`}>
        #{peringkat}
      </div>

      <div className="motor-info">
        <div className="motor-nama">
          {motor.merek} {motor.model}
        </div>
        <div className="motor-detail-row">
          <span>📅 Tahun {motor.tahun}</span>
          <span>💰 {formatHarga(motor.harga)}</span>
          <span>🛣️ {formatKm(motor.km)}</span>
          <span>⚙️ {motor.cc} CC</span>
        </div>
      </div>

      <div className="motor-nilai">
        <div className="label">Kesesuaian</div>
        <div className="value" style={{ color: 'var(--aksen)', fontWeight: 800 }}>
          {persentase}% Sesuai
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Link to={`/motor/${motor.id}`} className="btn btn-sm btn-sekunder">
          Detail Lengkap
        </Link>
        {motor.tautan_iklan && (
          <a
            href={motor.tautan_iklan}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-primer"
          >
            Iklan ↗
          </a>
        )}
      </div>
    </div>
  );
}
