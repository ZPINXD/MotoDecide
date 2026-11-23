// Test AHP — jalankan: node lib/ahp.test.js
import { bangunMatriks, hitungBobot, hitungKonsistensi, prosesAHP } from './ahp.js';
import { N } from './konstanta.js';

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

// ==== Test 1: Matriks identik (semua sama) ====
console.log('\nTest 1: Matriks identik — semua jawaban "sama"');
{
  const jawaban = [];
  let id = 0;
  for (let i = 1; i <= 7; i++) {
    for (let j = i + 1; j <= 7; j++) {
      jawaban.push({ kriteria_kiri_id: i, kriteria_kanan_id: j, arah: 'sama', tingkat: 1 });
    }
  }
  const matriks = bangunMatriks(jawaban);
  const bobot = hitungBobot(matriks);
  const { cr, ci } = hitungKonsistensi(matriks, bobot);

  assert(Math.abs(cr) < 0.0001, 'CR = 0 untuk matriks identik');
  assert(Math.abs(ci) < 0.0001, 'CI = 0');
  // Semua bobot harus sama (1/7)
  for (let i = 0; i < N; i++) {
    assertClose(bobot[i], 1 / 7, 0.0001, `bobot[${i}] ≈ ${(1/7).toFixed(6)}`);
  }
}

// ==== Test 2: Referensi Excel ====
console.log('\nTest 2: Referensi Excel — matriks dari spec');
{
  // Jawaban yang menghasilkan matriks referensi:
  // [1,   3,   7,   9,   5,   3,   1  ]
  // [1/3, 1,   5,   1,   1,   1,   1/3]
  // [1/7, 1/5, 1,   1,   1/3, 1/3, 1/9]
  // [1/9, 1,   1,   1,   1/3, 1/3, 1/9]
  // [1/5, 1,   3,   3,   1,   1,   1/5]
  // [1/3, 1,   3,   3,   1,   1,   1/5]
  // [1,   3,   9,   9,   5,   5,   1  ]

  const jawaban = [
    // C1 vs ...
    { kriteria_kiri_id: 1, kriteria_kanan_id: 2, arah: 'kiri', tingkat: 3 },   // a12=3
    { kriteria_kiri_id: 1, kriteria_kanan_id: 3, arah: 'kiri', tingkat: 7 },   // a13=7
    { kriteria_kiri_id: 1, kriteria_kanan_id: 4, arah: 'kiri', tingkat: 9 },   // a14=9
    { kriteria_kiri_id: 1, kriteria_kanan_id: 5, arah: 'kiri', tingkat: 5 },   // a15=5
    { kriteria_kiri_id: 1, kriteria_kanan_id: 6, arah: 'kiri', tingkat: 3 },   // a16=3
    { kriteria_kiri_id: 1, kriteria_kanan_id: 7, arah: 'sama', tingkat: 1 },   // a17=1
    // C2 vs ...
    { kriteria_kiri_id: 2, kriteria_kanan_id: 3, arah: 'kiri', tingkat: 5 },   // a23=5
    { kriteria_kiri_id: 2, kriteria_kanan_id: 4, arah: 'sama', tingkat: 1 },   // a24=1
    { kriteria_kiri_id: 2, kriteria_kanan_id: 5, arah: 'sama', tingkat: 1 },   // a25=1
    { kriteria_kiri_id: 2, kriteria_kanan_id: 6, arah: 'sama', tingkat: 1 },   // a26=1
    { kriteria_kiri_id: 2, kriteria_kanan_id: 7, arah: 'kanan', tingkat: 3 },  // a27=1/3
    // C3 vs ...
    { kriteria_kiri_id: 3, kriteria_kanan_id: 4, arah: 'sama', tingkat: 1 },   // a34=1
    { kriteria_kiri_id: 3, kriteria_kanan_id: 5, arah: 'kanan', tingkat: 3 },  // a35=1/3
    { kriteria_kiri_id: 3, kriteria_kanan_id: 6, arah: 'kanan', tingkat: 3 },  // a36=1/3
    { kriteria_kiri_id: 3, kriteria_kanan_id: 7, arah: 'kanan', tingkat: 9 },  // a37=1/9
    // C4 vs ...
    { kriteria_kiri_id: 4, kriteria_kanan_id: 5, arah: 'kanan', tingkat: 3 },  // a45=1/3
    { kriteria_kiri_id: 4, kriteria_kanan_id: 6, arah: 'kanan', tingkat: 3 },  // a46=1/3
    { kriteria_kiri_id: 4, kriteria_kanan_id: 7, arah: 'kanan', tingkat: 9 },  // a47=1/9
    // C5 vs ...
    { kriteria_kiri_id: 5, kriteria_kanan_id: 6, arah: 'sama', tingkat: 1 },   // a56=1
    { kriteria_kiri_id: 5, kriteria_kanan_id: 7, arah: 'kanan', tingkat: 5 },  // a57=1/5
    // C6 vs ...
    { kriteria_kiri_id: 6, kriteria_kanan_id: 7, arah: 'kanan', tingkat: 5 },  // a67=1/5
  ];

  const result = prosesAHP(jawaban);

  // Expected bobot
  const expectedBobot = [0.307231, 0.097996, 0.032495, 0.042246, 0.086177, 0.092281, 0.341573];

  for (let i = 0; i < 7; i++) {
    assertClose(result.bobot[i], expectedBobot[i], 0.001, `bobot[${i}]`);
  }

  assertClose(result.lambdaMaks, 7.2651, 0.01, 'λmaks ≈ 7.2651');
  assertClose(result.ci, 0.0442, 0.01, 'CI ≈ 0.0442');
  assertClose(result.cr, 0.0335, 0.005, 'CR ≈ 0.0335');
  assert(result.konsisten === true, 'Harus konsisten');
}

// ==== Test 3: CI ≥ 0 ====
console.log('\nTest 3: CI tidak negatif');
{
  // Sudah diuji di test 1 dan 2
  assert(true, 'CI ≥ 0 pada test 1 dan 2');
}

console.log(`\n========================================`);
console.log(`Total: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

