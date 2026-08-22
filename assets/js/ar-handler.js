// Menyimpan referensi ke model yang sedang aktif dan skala saat ini
let activeModel = null;
let currentScale = 0.5; // Skala default sesuai yang ada di HTML (0.5 0.5 0.5)

// Membuat komponen khusus bernama 'marker-handler' untuk A-Frame
AFRAME.registerComponent('marker-handler', {
    schema: {
        name: { type: 'string', default: 'Perangkat Keras' }
    },
    init: function () {
        const marker = this.el; // Menargetkan elemen <a-marker>
        const modelEntity = marker.querySelector('[gltf-model]'); // Menargetkan entitas model 3D di dalamnya
        const markerName = this.data.name;

        // Event listener: Normalisasi Skala Model (Auto-fit)
        // Fungsi ini sangat penting agar model 3D (baik yang ukurannya raksasa atau sangat kecil) 
        // akan di-resize otomatis agar pas dengan ukuran marker AR.
        if (modelEntity) {
            modelEntity.addEventListener('model-loaded', () => {
                const obj = modelEntity.getObject3D('mesh');
                if (!obj) return;
                
                // Hitung ukuran asli dari model 3D
                const box = new THREE.Box3().setFromObject(obj);
                const size = new THREE.Vector3();
                box.getSize(size);
                
                // Cari dimensi terpanjang (X, Y, atau Z)
                const maxDim = Math.max(size.x, size.y, size.z);
                
                // Hitung skala baru agar dimensi terpanjang menjadi maksimal 1.5 unit (pas di marker)
                const targetSize = 1.5;
                const newScale = targetSize / maxDim;
                
                // Terapkan skala baru
                modelEntity.setAttribute('scale', `${newScale} ${newScale} ${newScale}`);
                
                // Geser posisi Y agar model berada tepat di atas marker (tidak tenggelam)
                const center = new THREE.Vector3();
                box.getCenter(center);
                modelEntity.setAttribute('position', `0 ${(-box.min.y * newScale) + 0.1} 0`);
                
                console.log(`Model dinormalisasi. Skala asli terlalu besar/kecil. Skala baru: ${newScale}`);
            });
        }

        // Event listener: Ketika marker berhasil dideteksi oleh kamera
        marker.addEventListener('markerFound', function () {
            console.log('Marker ditemukan oleh kamera!');
            
            // Set model aktif saat marker ini terdeteksi
            activeModel = modelEntity;
            
            // Ambil skala awal dari HTML atau setelah di-resize otomatis
            if (activeModel) {
                const scale = activeModel.getAttribute('scale');
                currentScale = scale.x || 0.5; 
            }
            
            // Ubah teks instruksi di layar
            const instruction = document.querySelector('.instructions p');
            if(instruction) {
                instruction.innerHTML = `<strong>${markerName}</strong><br><span style="font-size: 0.9em; font-weight: normal;">Cubit untuk Zoom. Geser jari untuk Memutar 3D.</span>`;
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
        if (e.touches.length === 0) {
            isDragging = false;
        }
    });

    // 3. Logika Geser (Drag) untuk Memutar Model 3D
    let isDragging = false;
    let previousX = 0;
    let previousY = 0;

    // Untuk Touchscreen (Satu Jari)
    document.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1 && activeModel) {
            isDragging = true;
            previousX = e.touches[0].clientX;
            previousY = e.touches[0].clientY;
        }
    });

    document.addEventListener("touchmove", (e) => {
        if (isDragging && e.touches.length === 1 && activeModel) {
            const deltaX = e.touches[0].clientX - previousX;
            const deltaY = e.touches[0].clientY - previousY;

            let rotation = activeModel.getAttribute('rotation');
            rotation.y += deltaX * 0.8; // Putar sumbu Y (kiri-kanan)
            rotation.x += deltaY * 0.8; // Putar sumbu X (atas-bawah)
            
            activeModel.setAttribute('rotation', `${rotation.x} ${rotation.y} ${rotation.z}`);

            previousX = e.touches[0].clientX;
            previousY = e.touches[0].clientY;
        }
    }, { passive: false });

    // Untuk Desktop (Mouse)
    let isMouseDown = false;
    document.addEventListener("mousedown", (e) => {
        // Abaikan jika klik tombol UI
        if (e.target.closest('.ui-container') || e.target.closest('.zoom-controls') || e.target.closest('.instructions')) return;
        
        if (activeModel) {
            isMouseDown = true;
            previousX = e.clientX;
            previousY = e.clientY;
        }
    });

    document.addEventListener("mousemove", (e) => {
        if (isMouseDown && activeModel) {
            const deltaX = e.clientX - previousX;
            const deltaY = e.clientY - previousY;

            let rotation = activeModel.getAttribute('rotation');
            rotation.y += deltaX * 0.8;
            rotation.x += deltaY * 0.8;
            
            activeModel.setAttribute('rotation', `${rotation.x} ${rotation.y} ${rotation.z}`);

            previousX = e.clientX;
            previousY = e.clientY;
        }
    });

    document.addEventListener("mouseup", () => {
        isMouseDown = false;
    });

    // 3. Logika Mode Diagnostik (Tes Marker)
    const btnDebug = document.getElementById("btn-debug");
    let isDebugMode = false;

    if (btnDebug) {
        // Buat elemen visualizer sederhana pada semua marker saat halaman dimuat
        const markers = document.querySelectorAll('a-marker');
        markers.forEach(marker => {
            // Kotak hijau solid
            const debugBox = document.createElement('a-box');
            debugBox.setAttribute('color', '#10B981');
            debugBox.setAttribute('opacity', '0.7');
            debugBox.setAttribute('position', '0 0.5 0');
            debugBox.setAttribute('scale', '1 1 1');
            debugBox.setAttribute('visible', 'false');
            debugBox.classList.add('debug-visual');
            
            // Teks penanda
            const debugText = document.createElement('a-text');
            debugText.setAttribute('value', 'MARKER TERBACA');
            debugText.setAttribute('align', 'center');
            debugText.setAttribute('position', '0 1.2 0');
            debugText.setAttribute('rotation', '-90 0 0');
            debugText.setAttribute('color', '#000000');
            debugText.setAttribute('scale', '1.5 1.5 1.5');
            debugText.setAttribute('visible', 'false');
            debugText.classList.add('debug-visual');

            marker.appendChild(debugBox);
            marker.appendChild(debugText);
        });

        btnDebug.addEventListener("click", () => {
            isDebugMode = !isDebugMode;
            const models = document.querySelectorAll('[gltf-model]');
            const debugVisuals = document.querySelectorAll('.debug-visual');
            
            if (isDebugMode) {
                // Aktifkan mode tes: Sembunyikan semua 3D, tampilkan kotak hijau
                btnDebug.style.background = '#10B981'; // Hijau
                btnDebug.innerHTML = '<i class="ph ph-check-circle"></i> Tes Aktif';
                
                models.forEach(m => m.setAttribute('visible', 'false'));
                debugVisuals.forEach(v => v.setAttribute('visible', 'true'));
            } else {
                // Matikan mode tes: Kembalikan seperti semula
                btnDebug.style.background = 'rgba(245, 158, 11, 0.9)'; // Oranye
                btnDebug.innerHTML = '<i class="ph ph-bug"></i> Tes Marker';
                
                models.forEach(m => m.setAttribute('visible', 'true'));
                debugVisuals.forEach(v => v.setAttribute('visible', 'false'));
            }
        });
    }
});