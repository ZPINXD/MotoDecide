import { N, RI, BATAS_CR } from './konstanta.js';

/**
 * Bangun matriks perbandingan berpasangan 7x7 dari 21 jawaban.
 * jawaban: array of { kriteria_kiri_id, kriteria_kanan_id, arah, tingkat }
 */
export function bangunMatriks(jawaban) {
  // Inisialisasi matriks 7x7 dengan diagonal = 1
  const m = Array.from({ length: N }, () => Array(N).fill(1));

  for (const j of jawaban) {
    const i = j.kriteria_kiri_id - 1; // 0-indexed
    const k = j.kriteria_kanan_id - 1;

    let nilai;
    if (j.arah === 'sama') {
      nilai = 1;
    } else if (j.arah === 'kiri') {
      nilai = j.tingkat;
    } else {
      // arah === 'kanan'
      nilai = 1 / j.tingkat;
    }

    m[i][k] = nilai;
    m[k][i] = 1 / nilai;
  }

  return m;
}

/**
 * Hitung bobot AHP dari matriks perbandingan berpasangan.
 * Mengembalikan array bobot (panjang N).
 */
export function hitungBobot(matriks) {
  // 1. Jumlah tiap kolom
  const colSum = Array(N).fill(0);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      colSum[j] += matriks[i][j];
    }
  }

  // 2. Normalisasi
  const norm = Array.from({ length: N }, () => Array(N).fill(0));
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      norm[i][j] = matriks[i][j] / colSum[j];
    }
  }

  // 3. Bobot = rata-rata baris dari matriks ternormalisasi
  const bobot = Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    let sum = 0;
    for (let j = 0; j < N; j++) {
      sum += norm[i][j];
    }
    bobot[i] = sum / N;
  }

  return bobot;
}

/**
 * Hitung Consistency Ratio (CR).
 * Mengembalikan { lambdaMaks, ci, cr, konsisten }
 */
export function hitungKonsistensi(matriks, bobot) {
  // 1. Weighted Sum: WS_i = Σ_j a_ij × w_j
  const ws = Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      ws[i] += matriks[i][j] * bobot[j];
    }
  }

  // 2. CV_i = WS_i / w_i
  const cv = Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    cv[i] = ws[i] / bobot[i];
  }

  // 3. λmaks = rata-rata CV
  const lambdaMaks = cv.reduce((a, b) => a + b, 0) / N;

  // 4. CI = (λmaks − n) / (n − 1)
  const ci = (lambdaMaks - N) / (N - 1);

  // 5. CR = CI / RI
  const cr = ci / RI;

  return {
    lambdaMaks,
    ci,
    cr,
    konsisten: cr <= BATAS_CR,
  };
}

/**
 * Cari skala Saaty (1, 3, 5, 7, 9) yang paling dekat dengan nilai rasio
 */
function cariSkalaTerdekat(val) {
  const skala = [1, 3, 5, 7, 9];
  let terdekat = 1;
  let minDiff = Math.abs(val - 1);
  for (const s of skala) {
    const diff = Math.abs(val - s);
    if (diff < minDiff) {
      minDiff = diff;
      terdekat = s;
    }
  }
  return terdekat;
}

/**
 * Cari pasangan yang paling bertentangan (error terbesar) beserta rekomendasi logisnya.
 * Mengembalikan array { i, j, err, saran } diurutkan dari err terbesar, maksimal `maks` buah.
 */
export function cariPasanganBermasalah(matriks, bobot, maks = 3) {
  const errors = [];

  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const aij = matriks[i][j];
      const rasio = bobot[i] / bobot[j];
      const err = Math.abs(aij - rasio) / aij;

      // Hitung rekomendasi logis berdasarkan rasio bobot keseluruhan
      let saranArah = 'sama';
      let saranTingkat = 1;

      if (rasio >= 1.35) {
        saranArah = 'kiri';
        saranTingkat = cariSkalaTerdekat(rasio);
      } else if (rasio <= 0.74) {
        saranArah = 'kanan';
        saranTingkat = cariSkalaTerdekat(1 / rasio);
      } else {
        saranArah = 'sama';
        saranTingkat = 1;
      }

      errors.push({
        i,
        j,
        err,
        saran: {
          arah: saranArah,
          tingkat: saranTingkat,
        },
      });
    }
  }

  // Urutkan dari error terbesar
  errors.sort((a, b) => b.err - a.err);

  return errors.slice(0, maks);
}

/**
 * Proses AHP lengkap: dari jawaban ke bobot, CR, dan pasangan bermasalah.
 */
export function prosesAHP(jawaban) {
  const matriks = bangunMatriks(jawaban);
  const bobot = hitungBobot(matriks);
  const { lambdaMaks, ci, cr, konsisten } = hitungKonsistensi(matriks, bobot);
  const pasanganBermasalah = konsisten ? [] : cariPasanganBermasalah(matriks, bobot, 3);

  return {
    matriks,
    bobot,
    lambdaMaks,
    ci,
    cr,
    konsisten,
    pasanganBermasalah,
  };
}
