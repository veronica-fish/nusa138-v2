const POPULAR_PROVIDERS = ['pgsoft', 'pragmaticplay', 'evolution', 'joker', 'cq9', 'habanero', 'playtech'];
const POPULAR_GAMES = ['mahjong', 'gates of olympus', 'fortune', 'sweet bonanza', 'starlight', 'aztec', 'wild bandito', 'olympus'];
window.currentCategory = 'slots'; window.allGamesData = []; window.rawProvidersData = []; window.rawGamesData = []; window.currentGamesData = []; window.currentGameIndex = 0; window.gamesPerPage = 30;
window.loadLobby = async function() {
    document.getElementById('providerSection').style.display = 'block'; document.getElementById('gameSection').style.display = 'none'; document.getElementById('searchLobbyInput').placeholder = "Cari Provider...";
    const categoryNames = { 'slots': 'Slots', 'live': 'Live Casino', 'sportsbook': 'Sports', 'fishing': 'Tembak Ikan', 'other': 'Games' }; document.getElementById('providerSectionTitle').innerText = `Pilih Provider - ${categoryNames[window.currentCategory] || 'Games'}`;
    const providerGrid = document.getElementById('providerGrid'); providerGrid.innerHTML = '<p style="color: gray; grid-column: span 3; text-align: center;">Memuat provider...</p>';
    try {
        const response = await fetch(`https://nusa138.wispbyte.app/api/games`); const data = await response.json(); if (data.error) throw new Error(data.error);
        window.allGamesData = data.games; const gamesInCategory = data.games.filter(g => g.game_type === window.currentCategory); const uniqueProviders = []; const map = new Map();
        for (const item of gamesInCategory) { if(!map.has(item.provider)){ map.set(item.provider, true); uniqueProviders.push({ provider: item.provider, name: item.provider_name || item.provider, logo: item.provider_logo }); } }
        uniqueProviders.sort((a, b) => { const aPop = POPULAR_PROVIDERS.includes(a.provider.toLowerCase()); const bPop = POPULAR_PROVIDERS.includes(b.provider.toLowerCase()); return (aPop && !bPop) ? -1 : (!aPop && bPop) ? 1 : 0; });
        window.rawProvidersData = uniqueProviders; window.renderProviders(window.rawProvidersData);
    } catch (err) { providerGrid.innerHTML = '<p style="color: red; grid-column: span 3; text-align: center;">Gagal memuat provider.</p>'; }
};
window.renderProviders = function(providersList) {
    const providerGrid = document.getElementById('providerGrid'); providerGrid.innerHTML = ''; if (providersList.length === 0) { providerGrid.innerHTML = `<p style="color: gray; grid-column: span 3; text-align: center; margin-top: 20px;">Provider tidak ditemukan.</p>`; return; }
    providersList.forEach(prov => {
        const card = document.createElement('div'); card.style.cssText = "background: linear-gradient(180deg, #1f1f1f 0%, #0d0d0d 100%); box-shadow: 0 4px 15px rgba(0,0,0,0.6), inset 0 0 0 1px #333; border-radius: 12px; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px 8px; aspect-ratio: 1/1; transition: all 0.3s ease;";
        card.onmouseover = () => { card.style.transform = "translateY(-5px)"; card.style.boxShadow = "0 8px 20px rgba(123, 44, 191, 0.6), inset 0 0 0 1px #a855f7"; card.style.background = "linear-gradient(180deg, #2a2a2a 0%, #111 100%)"; };
        card.onmouseout = () => { card.style.transform = "translateY(0)"; card.style.boxShadow = "0 4px 15px rgba(0,0,0,0.6), inset 0 0 0 1px #333"; card.style.background = "linear-gradient(180deg, #1f1f1f 0%, #0d0d0d 100%)"; };
        card.innerHTML = `<div style="width: 90%; height: 60%; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;"><img src="${prov.logo || 'https://via.placeholder.com/150/111/FFF?text='+prov.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;"></div><span style="color: #e0e0e0; font-size: 12px; text-align: center; font-weight: 700; letter-spacing: 0.5px; text-shadow: 1px 1px 3px rgba(0,0,0,0.8);">${prov.name}</span>`;
        card.onclick = () => window.navigateTo(`/${window.currentCategory}/${prov.provider}`, true); providerGrid.appendChild(card);
    });
};
window.loadProviderGamesByURL = async function(category, providerCode) {
    if (window.allGamesData.length === 0) await window.loadLobby();
    document.getElementById('providerSection').style.display = 'none'; document.getElementById('gameSection').style.display = 'block'; document.getElementById('searchLobbyInput').placeholder = "Cari Game...";
    const provObj = window.rawProvidersData.find(p => p.provider === providerCode); document.getElementById('currentProviderName').innerText = provObj ? provObj.name : providerCode;
    let filteredGames = window.allGamesData.filter(game => game.provider === providerCode && game.game_type === category);
    filteredGames.sort((a, b) => { const aPop = POPULAR_GAMES.some(kw => a.name.toLowerCase().includes(kw)); const bPop = POPULAR_GAMES.some(kw => b.name.toLowerCase().includes(kw)); return (aPop && !bPop) ? -1 : (!aPop && bPop) ? 1 : 0; });
    window.rawGamesData = filteredGames; window.currentGamesData = filteredGames; window.currentGameIndex = 0; window.renderGames();
};
window.loadGameByURL = async function(category, providerCode, gameSlug) { if (window.allGamesData.length === 0) await window.loadLobby(); await window.loadProviderGamesByURL(category, providerCode); const gameData = window.allGamesData.find(g => g.id_hash.replace(/[^a-zA-Z0-9]/g, '-') === gameSlug); if (gameData) window.executeBukaGame(gameData.id_hash); else { alert("Game tidak ditemukan."); window.navigateTo(`/${category}/${providerCode}`, true); } };
window.renderGames = function() {
    const gameGrid = document.getElementById('gameGrid'); if (window.currentGameIndex === 0) { gameGrid.innerHTML = ''; document.getElementById('btnLoadMoreGames')?.remove(); }
    if (window.currentGamesData.length === 0) { gameGrid.innerHTML = '<p style="color: gray; grid-column: span 3; text-align: center;">Game tidak ditemukan.</p>'; return; }
    const endIndex = window.currentGameIndex + window.gamesPerPage; const gamesToRender = window.currentGamesData.slice(window.currentGameIndex, endIndex);
    gamesToRender.forEach(game => {
        const card = document.createElement('div'); card.style.cssText = "background: #222; border-radius: 8px; overflow: hidden; cursor: pointer; text-align: center; transition: transform 0.2s;";
        card.onmouseover = () => card.style.transform = "scale(1.05)"; card.onmouseout = () => card.style.transform = "scale(1)";
        card.innerHTML = `<img src="${game.image || 'https://via.placeholder.com/150'}" style="width: 100%; aspect-ratio: 1/1; object-fit: cover; display: block;"><div style="padding: 6px 4px; font-size: 10px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${game.name}</div>`;
        card.onclick = () => { const slug = game.id_hash.replace(/[^a-zA-Z0-9]/g, '-'); window.navigateTo(`/${window.currentCategory}/${game.provider}/${slug}`, true); window.executeBukaGame(game.id_hash); }; gameGrid.appendChild(card);
    });
    window.currentGameIndex = endIndex;
    let btnLoadMore = document.getElementById('btnLoadMoreGames');
    if (window.currentGameIndex < window.currentGamesData.length) { if (!btnLoadMore) { btnLoadMore = document.createElement('button'); btnLoadMore.id = 'btnLoadMoreGames'; btnLoadMore.innerText = 'MUAT LEBIH BANYAK'; btnLoadMore.style.cssText = "grid-column: span 3; padding: 12px; margin-top: 15px; background: #7b2cbf; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;"; btnLoadMore.onclick = () => { btnLoadMore.innerText = 'MEMUAT...'; setTimeout(() => window.renderGames(), 100); }; gameGrid.after(btnLoadMore); } else { btnLoadMore.style.display = 'block'; } } else { if (btnLoadMore) btnLoadMore.style.display = 'none'; }
};
window.backToProviders = function() { window.navigateTo(`/${window.currentCategory}`, true); };
document.getElementById('searchLobbyInput')?.addEventListener('input', function(e) { const keyword = e.target.value.toLowerCase(); if (document.getElementById('providerSection').style.display === 'block') { window.renderProviders(window.rawProvidersData.filter(p => p.name.toLowerCase().includes(keyword))); } else { window.currentGamesData = window.rawGamesData.filter(g => g.name.toLowerCase().includes(keyword)); window.currentGameIndex = 0; window.renderGames(); } });
window.executeBukaGame = async function(idHash) { if (typeof currentSession === 'undefined' || !currentSession || !currentSession.user) { alert("Silakan login terlebih dahulu!"); window.navigateTo('/login', true); return; } const username = currentSession.user.user_metadata.username; const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); if (typeof showLoading === 'function') showLoading(); try { const response = await fetch(`https://nusa138.wispbyte.app/api/get-game`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username, gameCode: idHash, device: isMobile ? 'mobile' : 'desktop' }) }); const data = await response.json(); if (typeof hideLoading === 'function') hideLoading(); if (data.error) alert("Gagal membuka game: " + data.error); else window.open(data.url, '_blank'); } catch (err) { if (typeof hideLoading === 'function') hideLoading(); alert("Koneksi ke server game gagal."); } };