// Fungsi untuk beralih antara Mode Mobile dan Mode Desktop
function toggleDesktopView() {
    // Cek status saat ini (tersimpan di browser)
    let isDesktop = localStorage.getItem('isDesktopView') === 'true';
    
    // Balikkan statusnya (jika mobile jadi desktop, jika desktop jadi mobile)
    isDesktop = !isDesktop;
    localStorage.setItem('isDesktopView', isDesktop);

    // Terapkan perubahan pada meta viewport
    applyViewportMode(isDesktop);

    // Refresh halaman agar perubahan ukuran layar diterapkan sempurna
    window.location.reload();
}

// Fungsi pembantu untuk mengubah tag <meta>
function applyViewportMode(isDesktop) {
    const viewportMeta = document.getElementById('viewportMeta');
    if (viewportMeta) {
        if (isDesktop) {
            // Lebar dipaksa 1200px agar tampilan seperti di Laptop
            viewportMeta.setAttribute('content', 'width=1200');
        } else {
            // Kembali ke ukuran layar HP normal
            viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cek apakah pengguna sebelumnya sudah memilih mode Desktop
    const isDesktop = localStorage.getItem('isDesktopView') === 'true';
    applyViewportMode(isDesktop);

    // 2. Logika Buka/Tutup Sidebar
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    window.openSidebar = function() {
        if(sidebarMenu) sidebarMenu.classList.add('active');
        if(sidebarOverlay) sidebarOverlay.classList.add('active');
    }

    window.closeSidebar = function() {
        if(sidebarMenu) sidebarMenu.classList.remove('active');
        if(sidebarOverlay) sidebarOverlay.classList.remove('active');
    }

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', openSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', closeSidebar);
    });
});