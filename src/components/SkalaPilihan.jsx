/**
 * SkalaPilihan — 9 tombol skala AHP
 * Props:
 *   kiri: { kode, nama }
 *   kanan: { kode, nama }
 *   value: { arah, tingkat } atau null
 *   onChange: (val) => void, val = { arah, tingkat }
 */
export default function SkalaPilihan({ kiri, kanan, value, onChange }) {
  // Tombol dari kiri ke kanan: 9K, 7K, 5K, 3K, 1, 3A, 5A, 7A, 9A
  const buttons = [
    { label: '9', arah: 'kiri', tingkat: 9, side: 'kiri' },
    { label: '7', arah: 'kiri', tingkat: 7, side: 'kiri' },
    { label: '5', arah: 'kiri', tingkat: 5, side: 'kiri' },
    { label: '3', arah: 'kiri', tingkat: 3, side: 'kiri' },
    { label: '1', arah: 'sama', tingkat: 1, side: 'tengah' },
    { label: '3', arah: 'kanan', tingkat: 3, side: 'kanan' },
    { label: '5', arah: 'kanan', tingkat: 5, side: 'kanan' },
    { label: '7', arah: 'kanan', tingkat: 7, side: 'kanan' },
    { label: '9', arah: 'kanan', tingkat: 9, side: 'kanan' },
  ];

  const isSelected = (btn) => {
    if (!value) return false;
    return value.arah === btn.arah && value.tingkat === btn.tingkat;
  };

  return (
    <div>
      <div className="skala-label">
        <span>← {kiri.nama}</span>
        <span>{kanan.nama} →</span>
      </div>
      <div className="skala-container">
        {buttons.map((btn, idx) => (
          <button
            key={idx}
            type="button"
            className={`skala-btn ${btn.side}${isSelected(btn) ? ' selected' : ''}`}
            onClick={() => onChange({ arah: btn.arah, tingkat: btn.tingkat })}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

