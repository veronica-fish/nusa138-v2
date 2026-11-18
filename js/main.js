window.navigateTo = function (path, pushState = true) {
    if (typeof path !== 'string') path = '/home'; 
    if (typeof showLoading === 'function') showLoading();
    if (pushState && window.location.hash !== '#' + path) window.location.hash = path;
    
    setTimeout(() => {
        document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
        const parts = path.split('/').filter(p => p !== '');
        const mainRoute = parts[0] || 'home';

        if (mainRoute === 'home' || mainRoute === '') {
            document.getElementById('homeView')?.classList.add('active');
            document.getElementById('navHome')?.classList.add('active');
        } else if (mainRoute === 'login') {
            document.getElementById('homeView')?.classList.add('active');
            if (typeof openLoginPanel === 'function') openLoginPanel();
        } else if (mainRoute === 'deposit') {
            document.getElementById('depositView')?.classList.add('active');
            document.getElementById('danaBtn')?.classList.add('active');
            if (typeof window.openDepositView === 'function') window.openDepositView();
        } else if (mainRoute === 'contact') {
            document.getElementById('contactView')?.classList.add('active');
        } else if (mainRoute === 'pengaduan') {
            document.getElementById('pengaduanView')?.classList.add('active');
        } else if (['slots', 'live', 'sportsbook', 'fishing', 'other'].includes(mainRoute)) {
            document.getElementById('lobbyView')?.classList.add('active');
            window.currentCategory = mainRoute;
            if (parts.length === 1) { if (typeof loadLobby === 'function') loadLobby(); }
            else if (parts.length === 2) { if (typeof loadProviderGamesByURL === 'function') loadProviderGamesByURL(mainRoute, parts[1]); }
            else if (parts.length === 3) { if (typeof loadGameByURL === 'function') loadGameByURL(mainRoute, parts[1], parts[2]); }
        } else {
            document.getElementById(mainRoute + 'View')?.classList.add('active');
        }
        window.scrollTo(0, 0);
        if (typeof hideLoading === 'function') hideLoading();
    }, 800); 
};
window.handleRouting = function () { navigateTo(window.location.hash.replace('#', '') || '/home', false); };
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabaseClient === 'undefined') return;
    window.showLoading = function () { document.getElementById('loadingOverlay')?.classList.add('active'); };
    window.hideLoading = function () { document.getElementById('loadingOverlay')?.classList.remove('active'); };
    window.addEventListener('hashchange', () => window.handleRouting());
    document.getElementById('headerUserBtn')?.addEventListener('click', () => {
        if (currentSession) openProfilePanel(); else window.navigateTo('/login', true);
    });
    document.getElementById('headerSearchBtn')?.addEventListener('click', () => {
        window.navigateTo('/slots', true);
        setTimeout(() => document.getElementById('searchLobbyInput')?.focus(), 400);
    });
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            const icon = refreshBtn.querySelector('i');
            if(icon) { icon.style.transition = 'transform 0.5s ease'; icon.style.transform = 'rotate(360deg)'; setTimeout(() => { icon.style.transform = 'rotate(0deg)'; icon.style.transition = 'none'; }, 500); }
            if (currentSession && currentSession.user) { if (typeof fetchUserBalance === 'function') fetchUserBalance(currentSession.user); }
        });
    }
});