// Mengambil elemen HTML yang dibutuhkan
const modal = document.getElementById('modal3d');
const btnClose = document.getElementById('closeModal');
const viewerModel = document.getElementById('viewerModel');
const modalTitle = document.getElementById('modalTitle');
const btns3D = document.querySelectorAll('.btn-3d');

// Fungsi ketika tombol "Tampilkan 3D" diklik
btns3D.forEach(button => {
    button.addEventListener('click', function() {
        // Ambil data file 3D dan judul dari tombol yang diklik
        const modelSrc = this.getAttribute('data-src');
        const title = this.getAttribute('data-title');
        
        // Ubah sumber (src) model-viewer dan ubah judul teksnya
        viewerModel.src = modelSrc;
        modalTitle.textContent = title;
        
        // Tampilkan Modal (Ubah display dari 'none' menjadi 'flex')
        modal.style.display = 'flex';
    });
});

// Fungsi untuk menutup Modal
btnClose.addEventListener('click', function() {
    modal.style.display = 'none';
    viewerModel.src = ""; // Kosongkan src agar tidak membebani memori saat ditutup
});

// Fitur Ganti Background 3D Viewer
const bgButtons = document.querySelectorAll('.bg-btn');
bgButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        const bgValue = this.getAttribute('data-bg');
        viewerModel.style.backgroundColor = bgValue;
    });
});

// Tutup modal juga jika area gelap di luar kotak putih diklik
window.addEventListener('click', function(event) {
    if (event.target === modal) {
        modal.style.display = 'none';
        viewerModel.src = "";
    }
});