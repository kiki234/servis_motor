// GANTI DENGAN URL APLIKASI WEB DARI GOOGLE APPS SCRIPT ANDA
const API_URL = 'https://script.google.com/macros/s/AKfycbxXTPW2wCfYUwmpmPnpQTv1riLurWqzgVv5R0Rq9GXdk9Ri22XWmSZRHGZpDVFPhs3UPg/exec'; 

document.getElementById('tanggal').valueAsDate = new Date();

let tableData = [];

// Fungsi Pindah Tab Menu
function switchTab(tabId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + tabId).classList.add('active');
  document.getElementById('btn-' + tabId).classList.add('active');
  if(tabId === 'laporan') fetchData();
}

// Ambil data dari Sheets
async function fetchData() {
  document.querySelector('tbody').innerHTML = '<tr><td colspan="5">Memuat data...</td></tr>';
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    tableData = data;
    renderLaporan();
    setupEntryForm();
  } catch (err) {
    alert('Gagal memuat data');
  }
}

// Setup form (kunci Odo Awal & buat list pekerjaan)
function setupEntryForm() {
  if (tableData.length > 0) {
    const lastRow = tableData[tableData.length - 1];
    const odoAwalInput = document.getElementById('odo_awal');
    odoAwalInput.value = lastRow.odo_akhir;
    odoAwalInput.readOnly = true; // Kunci setelah ada entry pertama
    
    // Setup Datalist Pekerjaan unik
    const uniqueJobs = [...new Set(tableData.map(item => item.pekerjaan))];
    const dataList = document.getElementById('job-list');
    dataList.innerHTML = '';
    uniqueJobs.forEach(job => {
      const option = document.createElement('option');
      option.value = job;
      dataList.appendChild(option);
    });
  }
}

// Format Nilai Rupiah saat diketik
function formatRupiah(input) {
  let angka = input.value.replace(/[^,\d]/g, '').toString();
  let split = angka.split(',');
  let sisa = split[0].length % 3;
  let rupiah = split[0].substr(0, sisa);
  let ribuan = split[0].substr(sisa).match(/\d{3}/gi);
  if (ribuan) {
    let separator = sisa ? '.' : '';
    rupiah += separator + ribuan.join('.');
  }
  input.value = rupiah ? 'Rp ' + rupiah : '';
}

function hitungSelisih() {
  // Hanya visual, hitung aslinya ada di submit
}

// Kirim Data
document.getElementById('dataForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-form');
  btn.innerText = 'Menyimpan...';
  btn.disabled = true;

  const odo_awal = Number(document.getElementById('odo_awal').value);
  const odo_akhir = Number(document.getElementById('odo_akhir').value);
  
  const payload = {
    action: 'create',
    tanggal: document.getElementById('tanggal').value,
    pekerjaan: document.getElementById('pekerjaan').value,
    odo_awal: odo_awal,
    odo_akhir: odo_akhir,
    selisih: odo_akhir - odo_awal,
    biaya: document.getElementById('biaya').value.replace(/[^0-9]/g, '')
  };

  await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
    // Penting: Jangan gunakan header agar tidak memicu preflight error yang rumit di Apps Script tanpa setup tambahan
  });

  alert('Data berhasil disimpan!');
  document.getElementById('pekerjaan').value = '';
  document.getElementById('odo_akhir').value = '';
  document.getElementById('biaya').value = '';
  btn.innerText = 'Simpan Data';
  btn.disabled = false;
  fetchData(); // Refresh data
});

// Render Laporan & Fitur Delete
function renderLaporan() {
  const tbody = document.querySelector('tbody');
  tbody.innerHTML = '';
  tableData.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.tanggal.split('T')[0]}</td>
      <td>${row.pekerjaan}</td>
      <td>${row.selisih} km</td>
      <td>Rp ${Number(row.biaya).toLocaleString('id-ID')}</td>
      <td><button class="btn-delete" onclick="hapusData('${row.id}')">Hapus</button></td>
    `;
    tbody.appendChild(tr);
  });
}

async function hapusData(id) {
  if(confirm('Yakin ingin menghapus data ini?')) {
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', id: id })
    });
    alert('Data dihapus');
    fetchData();
  }
}

// Load awal
fetchData();
