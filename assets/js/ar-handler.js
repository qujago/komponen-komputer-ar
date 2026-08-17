// Menyimpan referensi ke model yang sedang aktif dan skala saat ini
let activeModel = null;
let currentScale = 0.5; // Skala default sesuai yang ada di HTML (0.5 0.5 0.5)

// Membuat komponen khusus bernama 'marker-handler' untuk A-Frame
AFRAME.registerComponent('marker-handler', {
    init: function () {
        const marker = this.el; // Menargetkan elemen <a-marker>
        const modelEntity = marker.querySelector('[gltf-model]'); // Menargetkan entitas model 3D di dalamnya

        // Event listener: Ketika marker berhasil dideteksi oleh kamera
        marker.addEventListener('markerFound', function () {
            console.log('Marker ditemukan oleh kamera!');
            
            // Set model aktif saat marker ini terdeteksi
            activeModel = modelEntity;
            
            // Ambil skala awal dari HTML
            if (activeModel) {
                const scale = activeModel.getAttribute('scale');
                currentScale = scale.x; 
            }
            
            // Ubah teks instruksi di layar
            const instruction = document.querySelector('.instructions p');
            if(instruction) {
                // Ambil nama dari elemen a-text
                const textEl = marker.querySelector('a-text');
                const markerName = textEl ? textEl.getAttribute('value') : "Perangkat Keras";
                
                instruction.innerHTML = `<strong>${markerName}</strong><br><span style="font-size: 0.9em; font-weight: normal;">Gunakan tombol + / - atau cubit layar untuk Zoom.</span>`;
                instruction.style.background = "#E4F8ED"; // Ubah latar belakang jadi hijau pastel
                instruction.style.color = "#2B3674";
            }
        });

        // Event listener: Ketika marker hilang dari jangkauan kamera
        marker.addEventListener('markerLost', function () {
            console.log('Marker hilang dari kamera!');
            
            // Jika marker ini yang hilang, kosongkan activeModel
            if (activeModel === modelEntity) {
                activeModel = null;
            }
            
            // Kembalikan teks instruksi seperti semula
            const instruction = document.querySelector('.instructions p');
            if(instruction) {
                instruction.innerText = "Arahkan kamera ke Marker untuk melihat 3D!";
                instruction.style.background = "rgba(255, 255, 255, 0.9)"; // Kembali ke putih transparan
            }
        });
    }
});

// Setup Logika Tombol Zoom (Untuk Desktop) & Pinch Zoom (Untuk Touchscreen)
document.addEventListener("DOMContentLoaded", () => {
    const btnZoomIn = document.getElementById("btn-zoom-in");
    const btnZoomOut = document.getElementById("btn-zoom-out");

    // 1. Logika Tombol Zoom (+ / -)
    if (btnZoomIn && btnZoomOut) {
        btnZoomIn.addEventListener("click", () => {
            if (activeModel) {
                currentScale += 0.1;
                activeModel.setAttribute("scale", `${currentScale} ${currentScale} ${currentScale}`);
            }
        });

        btnZoomOut.addEventListener("click", () => {
            if (activeModel) {
                currentScale = Math.max(0.1, currentScale - 0.1); // Minimal skala 0.1 agar tidak tembus/hilang
                activeModel.setAttribute("scale", `${currentScale} ${currentScale} ${currentScale}`);
            }
        });
    }

    // 2. Logika Pinch to Zoom (Cubit Layar)
    let initialPinchDistance = null;
    let pinchStartScale = 1;

    // Saat dua jari menyentuh layar
    document.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2 && activeModel) {
            // Hitung jarak awal antara dua jari
            initialPinchDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            pinchStartScale = currentScale;
        }
    });

    // Saat dua jari digerakkan (mencubit / melebar)
    document.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2 && activeModel && initialPinchDistance) {
            e.preventDefault(); // Mencegah layar tertarik / browser zoom default
            
            // Hitung jarak baru antara dua jari
            const currentDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            
            // Hitung rasio perubahan jarak (besar/kecil)
            const distanceRatio = currentDistance / initialPinchDistance;
            
            // Terapkan ke skala saat ini (maksimum dan minimum bisa diatur di sini jika perlu)
            currentScale = Math.max(0.1, pinchStartScale * distanceRatio);
            activeModel.setAttribute("scale", `${currentScale} ${currentScale} ${currentScale}`);
        }
    }, { passive: false }); // passive: false diperlukan agar e.preventDefault() bekerja di Safari/Chrome

    // Saat jari diangkat
    document.addEventListener("touchend", (e) => {
        if (e.touches.length < 2) {
            initialPinchDistance = null; // Reset perhitungan pinch
        }
    });
});