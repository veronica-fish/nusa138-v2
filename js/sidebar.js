document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    // Fungsi Buka Sidebar
    window.openSidebar = function() {
        if(sidebarMenu) sidebarMenu.classList.add('active');
        if(sidebarOverlay) sidebarOverlay.classList.add('active');
    }

    // Fungsi Tutup Sidebar
    window.closeSidebar = function() {
        if(sidebarMenu) sidebarMenu.classList.remove('active');
        if(sidebarOverlay) sidebarOverlay.classList.remove('active');
    }

    // Event Listener Klik Garis 3
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', openSidebar);
    }

    // Event Listener Klik Area Gelap (Overlay)
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Menutup sidebar saat salah satu menu diklik
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', closeSidebar);
    });
});

// Fungsi untuk Desktop View
function toggleDesktopView() {
    alert("Fitur Desktop View akan segera hadir!");
    // Jika ingin benar-benar berfungsi, Anda bisa menambahkan logika meta viewport di sini
}