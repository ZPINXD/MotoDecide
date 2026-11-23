const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(url, options = {}) {
  try {
    const res = await fetch(`${API_URL}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    const data = await res.json();

    if (!res.ok) {
      throw { status: res.status, ...data.error };
    }

    return data;
  } catch (err) {
    if (err.kode) throw err;
    throw { kode: 'NETWORK_ERROR', pesan: 'Server sedang tidak dapat dihubungi. Coba lagi beberapa saat.' };
  }
}

// Pertanyaan
export function getPertanyaan() {
  return request('/pertanyaan');
}

// Sesi
export function buatSesi() {
  return request('/sesi', { method: 'POST' });
}

export function getSesi(sesiId) {
  return request(`/sesi/${sesiId}`);
}

export function kirimJawaban(sesiId, jawaban) {
  return request(`/sesi/${sesiId}/jawaban`, {
    method: 'PUT',
    body: JSON.stringify({ jawaban }),
  });
}

export function lanjutkanSesi(sesiId) {
  return request(`/sesi/${sesiId}/lanjutkan`, { method: 'POST' });
}

// Motor
export function getMotor(filter = {}) {
  const params = new URLSearchParams();
  if (filter.harga_max) params.set('harga_max', filter.harga_max);
  if (filter.tahun_min) params.set('tahun_min', filter.tahun_min);
  if (filter.km_max) params.set('km_max', filter.km_max);
  if (filter.cc_max) params.set('cc_max', filter.cc_max);
  const qs = params.toString();
  return request(`/motor${qs ? '?' + qs : ''}`);
}

export function getMotorDetail(id) {
  return request(`/motor/${id}`);
}

// Peringkat
export function hitungPeringkat(sesiId, filter = {}) {
  return request(`/sesi/${sesiId}/peringkat`, {
    method: 'POST',
    body: JSON.stringify(filter),
  });
}

// Metodologi
export function getMetodologi(sesiId) {
  const qs = sesiId ? `?sesi_id=${sesiId}` : '';
  return request(`/metodologi${qs}`);
}

