// Test WP — jalankan: node lib/wp.test.js
import { hitungPangkat, hitungWP } from './wp.js';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

function assertClose(actual, expected, tolerance, label) {
  const diff = Math.abs(actual - expected);
  assert(diff <= tolerance, `${label}: ${actual.toFixed(6)} ≈ ${expected.toFixed(6)} (diff=${diff.toFixed(8)})`);
}

// Data 20 motor (urutan kolom: harga, tahun, km, cc, skor_mesin, skor_body, skor_dokumen)
const motorData = [
  { kode: 'A1', harga: 4000000, tahun: 2014, km: 65000, cc: 110, skor_mesin: 4, skor_body: 5, skor_dokumen: 5 },
  { kode: 'A2', harga: 5000000, tahun: 2014, km: 85000, cc: 125, skor_mesin: 4, skor_body: 4, skor_dokumen: 5 },
  { kode: 'A3', harga: 4000000, tahun: 2010, km: 30000, cc: 110, skor_mesin: 3, skor_body: 4, skor_dokumen: 5 },
  { kode: 'A4', harga: 20000000, tahun: 2024, km: 20000, cc: 160, skor_mesin: 5, skor_body: 5, skor_dokumen: 5 },
  { kode: 'A5', harga: 18000000, tahun: 2019, km: 65000, cc: 150, skor_mesin: 5, skor_body: 5, skor_dokumen: 5 },
  { kode: 'A6', harga: 25800000, tahun: 2025, km: 7000, cc: 160, skor_mesin: 5, skor_body: 5, skor_dokumen: 5 },
  { kode: 'A7', harga: 16500000, tahun: 2024, km: 10000, cc: 110, skor_mesin: 5, skor_body: 5, skor_dokumen: 5 },
  { kode: 'A8', harga: 21650000, tahun: 2019, km: 35000, cc: 250, skor_mesin: 5, skor_body: 4, skor_dokumen: 5 },
  { kode: 'A9', harga: 32800000, tahun: 2026, km: 5000, cc: 250, skor_mesin: 5, skor_body: 5, skor_dokumen: 5 },
  { kode: 'A10', harga: 6800000, tahun: 2009, km: 5000, cc: 113, skor_mesin: 5, skor_body: 5, skor_dokumen: 5 },
  { kode: 'A11', harga: 22000000, tahun: 2004, km: 105000, cc: 250, skor_mesin: 3, skor_body: 4, skor_dokumen: 5 },
  { kode: 'A12', harga: 30000000, tahun: 2019, km: 55000, cc: 250, skor_mesin: 4, skor_body: 4, skor_dokumen: 5 },
  { kode: 'A13', harga: 14500000, tahun: 2022, km: 25000, cc: 125, skor_mesin: 5, skor_body: 5, skor_dokumen: 5 },
  { kode: 'A14', harga: 4500000, tahun: 2009, km: 65000, cc: 125, skor_mesin: 3, skor_body: 4, skor_dokumen: 5 },
  { kode: 'A15', harga: 10500000, tahun: 2018, km: 55000, cc: 125, skor_mesin: 4, skor_body: 4, skor_dokumen: 1 },
  { kode: 'A16', harga: 23000000, tahun: 2022, km: 35000, cc: 250, skor_mesin: 5, skor_body: 5, skor_dokumen: 5 },
  { kode: 'A17', harga: 10000000, tahun: 2017, km: 120000, cc: 125, skor_mesin: 4, skor_body: 5, skor_dokumen: 5 },
  { kode: 'A18', harga: 6000000, tahun: 2012, km: 20000, cc: 125, skor_mesin: 3, skor_body: 3, skor_dokumen: 5 },
  { kode: 'A19', harga: 11500000, tahun: 2023, km: 15000, cc: 250, skor_mesin: 4, skor_body: 5, skor_dokumen: 5 },
  { kode: 'A20', harga: 7000000, tahun: 2015, km: 55000, cc: 125, skor_mesin: 4, skor_body: 4, skor_dokumen: 3 },
];

// Bobot AHP dari referensi Excel
const bobotAHP = [0.307231, 0.097996, 0.032495, 0.042246, 0.086177, 0.092281, 0.341573];

// Expected V (urutan peringkat)
const expectedV = [
  { kode: 'A1', v: 0.068463 },
  { kode: 'A3', v: 0.067077 },
  { kode: 'A10', v: 0.064504 },
  { kode: 'A14', v: 0.063426 },
  { kode: 'A2', v: 0.062416 },
  { kode: 'A18', v: 0.058756 },
  { kode: 'A19', v: 0.053764 },
  { kode: 'A17', v: 0.050927 },
  { kode: 'A13', v: 0.048749 },
  { kode: 'A7', v: 0.048012 },
  { kode: 'A20', v: 0.047950 },
  { kode: 'A4', v: 0.044955 },
  { kode: 'A5', v: 0.044557 },
  { kode: 'A16', v: 0.043090 },
  { kode: 'A6', v: 0.043017 },
  { kode: 'A8', v: 0.042998 },
  { kode: 'A9', v: 0.041169 },
  { kode: 'A11', v: 0.039479 },
  { kode: 'A12', v: 0.037600 },
  { kode: 'A15', v: 0.029092 },
];

console.log('\nTest 6: WP referensi 20 motor');
{
  const pangkat = hitungPangkat(bobotAHP);
  const hasil = hitungWP(motorData, pangkat);

  // Cek urutan
  for (let i = 0; i < expectedV.length; i++) {
    const actual = hasil[i];
    const expected = expectedV[i];
    assert(actual.motor.kode === expected.kode, `Peringkat ${i + 1}: ${actual.motor.kode} === ${expected.kode}`);
    assertClose(actual.nilaiV, expected.v, 0.000001, `V[${expected.kode}]`);
  }
}

console.log('\nTest 7: Skala satuan — harga juta vs rupiah');
{
  const motorJuta = motorData.map((m) => ({ ...m, harga: m.harga / 1000000 }));
  const pangkat = hitungPangkat(bobotAHP);
  const hasilRupiah = hitungWP(motorData, pangkat);
  const hasilJuta = hitungWP(motorJuta, pangkat);

  for (let i = 0; i < 20; i++) {
    assert(hasilRupiah[i].motor.kode === hasilJuta[i].motor.kode,
      `Urutan ${i + 1}: ${hasilRupiah[i].motor.kode} === ${hasilJuta[i].motor.kode}`);
    assertClose(hasilRupiah[i].nilaiV, hasilJuta[i].nilaiV, 0.000001,
      `V sama untuk ${hasilRupiah[i].motor.kode}`);
  }
}

console.log('\nTest 8: Filter kosong');
{
  const pangkat = hitungPangkat(bobotAHP);
  const hasil = hitungWP([], pangkat);
  assert(hasil.length === 0, 'Hasil kosong');
}

console.log(`\n========================================`);
console.log(`Total: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

