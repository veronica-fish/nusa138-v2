function toggleDesktopView() { let isDesktop = localStorage.getItem('isDesktopView') === 'true'; isDesktop = !isDesktop; localStorage.setItem('isDesktopView', isDesktop); applyViewportMode(isDesktop); window.location.reload(); }
function applyViewportMode(isDesktop) { const viewportMeta = document.getElementById('viewportMeta'); if (viewportMeta) { if (isDesktop) viewportMeta.setAttribute('content', 'width=1200'); else viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'); } }
document.addEventListener('DOMContentLoaded', () => {
    applyViewportMode(localStorage.getItem('isDesktopView') === 'true');
    const hamburgerBtn = document.getElementById('hamburgerBtn'); const sidebarMenu = document.getElementById('sidebarMenu'); const sidebarOverlay = document.getElementById('sidebarOverlay');
    window.openSidebar = function() { sidebarMenu?.classList.add('active'); sidebarOverlay?.classList.add('active'); }
    window.closeSidebar = function() { sidebarMenu?.classList.remove('active'); sidebarOverlay?.classList.remove('active'); }
    if (hamburgerBtn) hamburgerBtn.addEventListener('click', openSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
    document.querySelectorAll('.sidebar-item').forEach(item => item.addEventListener('click', closeSidebar));
});