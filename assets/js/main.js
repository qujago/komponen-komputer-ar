// Menunggu sampai seluruh elemen HTML selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    
    // Pesan sapaan di console browser (berguna saat Anda melakukan proses debugging)
    console.log("🚀 Aplikasi Pengenalan Hardware Komputer Berhasil Dimuat!");
    console.log("✨ Siap untuk belajar sambil bermain!");

    // Mengambil semua elemen kartu menu
    const menuCards = document.querySelectorAll('.menu-card');

    // Menambahkan efek saat kartu diklik (khususnya untuk pengguna HP/Touchscreen)
    menuCards.forEach(card => {
        
        // Saat kartu disentuh/diklik, buat sedikit mengecil agar terasa seperti tombol fisik
        card.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.95)';
            this.style.boxShadow = '0 5px 10px rgba(0,0,0,0.1)';
        });

        card.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
            this.style.boxShadow = '0 5px 10px rgba(0,0,0,0.1)';
        });

        // Saat sentuhan dilepas, kembalikan ke ukuran normal (efek memantul)
        card.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 15px 30px rgba(0,0,0,0.08)';
        });

        card.addEventListener('touchend', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 15px 30px rgba(0,0,0,0.08)';
        });
    });

});