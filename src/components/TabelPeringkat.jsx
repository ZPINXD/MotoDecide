/**
 * TabelPeringkat — tabel alternatif untuk menampilkan hasil peringkat
 * Props:
 *   hasil: array of { peringkat, motor, persentase }
 */
export default function TabelPeringkat({ hasil }) {
  const formatHarga = (h) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(h);

  const formatKm = (km) =>
    new Intl.NumberFormat('id-ID').format(km) + ' km';

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="tabel">
        <thead>
          <tr>
            <th>Peringkat</th>
            <th>Motor</th>
            <th>Tahun</th>
            <th>Harga</th>
            <th>Kilometer</th>
            <th>CC</th>
            <th>Tingkat Kesesuaian</th>
          </tr>
        </thead>
        <tbody>
          {hasil.map((h) => (
            <tr key={h.motor.id}>
              <td>
                <span className={`badge ${h.peringkat <= 3 ? 'badge-sukses' : 'badge-info'}`}>
                  #{h.peringkat}
                </span>
              </td>
              <td><strong>{h.motor.merek} {h.motor.model}</strong></td>
              <td>{h.motor.tahun}</td>
              <td>{formatHarga(h.motor.harga)}</td>
              <td>{formatKm(h.motor.km)}</td>
              <td>{h.motor.cc} CC</td>
              <td>
                <span style={{ fontWeight: 700, color: 'var(--aksen)' }}>
                  {h.persentase}% Sesuai
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
