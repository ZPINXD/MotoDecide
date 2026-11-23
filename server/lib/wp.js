import { JENIS_KRITERIA, KOLOM_MOTOR } from './konstanta.js';

/**
 * Hitung pangkat bobot sesuai jenis kriteria.
 * Cost = negatif, benefit = positif.
 * bobot: array panjang 7 (urutan C1..C7)
 */
export function hitungPangkat(bobot) {
  return bobot.map((w, idx) => JENIS_KRITERIA[idx] === 'cost' ? -w : w);
}

/**
 * Hitung nilai S dan V untuk sekumpulan motor (kandidat).
 * motor: array of object (harus punya kolom sesuai KOLOM_MOTOR)
 * pangkat: array panjang 7
 *
 * Mengembalikan array of { motor, nilaiS, nilaiV, kontribusi }
 */
export function hitungWP(motor, pangkat) {
  if (motor.length === 0) return [];

  // Hitung ln(S) untuk setiap motor
  const hasilLnS = motor.map((m) => {
    const kontribusi = {};
    let lnS = 0;

    for (let j = 0; j < KOLOM_MOTOR.length; j++) {
      const kolom = KOLOM_MOTOR[j];
      const nilai = Number(m[kolom]);
      const k = pangkat[j] * Math.log(nilai);
      kontribusi[`C${j + 1}`] = k;
      lnS += k;
    }

    return { motor: m, lnS, kontribusi };
  });

  // Cari max lnS untuk stabilitas numerik
  const maxLnS = Math.max(...hasilLnS.map((h) => h.lnS));

  // Hitung exp(lnS - max) untuk setiap motor
  const expNorm = hasilLnS.map((h) => ({
    ...h,
    expNorm: Math.exp(h.lnS - maxLnS),
  }));

  // Jumlah semua exp normalized
  const sumExp = expNorm.reduce((acc, h) => acc + h.expNorm, 0);

  // Hitung V = expNorm / sumExp dan S = exp(lnS)
  const hasil = expNorm.map((h) => ({
    motor: h.motor,
    nilaiS: Math.exp(h.lnS),
    nilaiV: h.expNorm / sumExp,
    kontribusi: h.kontribusi,
  }));

  // Urutkan V dari terbesar. Jika sama, harga terkecil.
  hasil.sort((a, b) => {
    if (b.nilaiV !== a.nilaiV) return b.nilaiV - a.nilaiV;
    return Number(a.motor.harga) - Number(b.motor.harga);
  });

  return hasil;
}

