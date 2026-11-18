function startAutoScroll(trackId, speed = 1) {
    const track = document.getElementById(trackId); if (!track) return;
    let isHovered = false;
    track.addEventListener('mouseenter', () => isHovered = true); track.addEventListener('mouseleave', () => isHovered = false);
    track.addEventListener('touchstart', () => isHovered = true, { passive: true }); track.addEventListener('touchend', () => isHovered = false, { passive: true });
    function scrollStep() { if (!isHovered && track.scrollWidth > track.clientWidth) { track.scrollLeft += speed; if (track.scrollLeft >= (track.scrollWidth - track.clientWidth - 1)) { setTimeout(() => { if(!isHovered) track.scrollLeft = 0; }, 1000); } } requestAnimationFrame(scrollStep); }
    requestAnimationFrame(scrollStep);
}
document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('bannerTrack');
    if (track) { let currentIndex = 0; setInterval(() => { currentIndex = (currentIndex + 1) % 3; track.style.transform = `translateX(${currentIndex * -33.3333}%)`; }, 5000); }
    const transTrack = document.getElementById('transTrack');
    if (transTrack) {
        let transIndex = 0; const transDots = document.querySelectorAll('.t-dot'); const totalPages = 3;
        function populateCards() { for (let i = 1; i <= 4; i++) { const prefixes = ['DEW', 'SIG', 'ABD', 'BUD', 'AGU', 'RIN', 'JOK']; const maskedName = prefixes[Math.floor(Math.random() * prefixes.length)] + '*'.repeat(Math.floor(Math.random() * 7) + 4); const amount = Math.floor(Math.random() * 500000) + 50000; const formattedDate = `${Math.random() > 0.5 ? 'DEPOSIT' : 'WITHDRAW'}, 2026-11-18 20:00`; if(document.getElementById(`name${i}`)) { document.getElementById(`name${i}`).innerText = maskedName; document.getElementById(`amount${i}`).innerText = "IDR " + (amount / 1000).toFixed(2); document.getElementById(`type${i}`).innerText = formattedDate; } } }
        function goToTransSlide(index) { transTrack.style.transform = `translateX(calc(-${index * 50}% - ${index * 6}px))`; transDots.forEach(dot => dot.classList.remove('active')); if (transDots[index]) transDots[index].classList.add('active'); }
        populateCards(); setInterval(() => { transIndex++; if (transIndex >= totalPages) { transIndex = 0; populateCards(); } goToTransSlide(transIndex); }, 4000);
    }
    async function loadHomeGames() {
        const popTrack = document.getElementById('popularGamesTrack'); const newTrack = document.getElementById('newGamesTrack'); if (!popTrack || !newTrack) return;
        const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), 10000); 
        try {
            const response = await fetch(`https://nusa138.wispbyte.app/api/games`, { signal: controller.signal }); clearTimeout(timeoutId);
            const data = await response.json(); if (data.error) throw new Error(data.error);
            const games = data.games || []; const topProviders = ['pgsoft', 'pragmaticplay', 'spadegaming', 'joker', 'habanero', 'cq9', 'playtech'];
            let popularGames = games.filter(g => g.status === 1 && topProviders.includes(g.provider.toLowerCase())).sort(() => 0.5 - Math.random()).slice(0, 15);
            let newGames = games.filter(g => g.status === 1 && g.image).sort(() => 0.5 - Math.random()).slice(0, 15);
            popTrack.innerHTML = ''; popularGames.forEach(game => { const card = document.createElement('div'); card.className = 'home-game-card'; card.innerHTML = `<img src="${game.image || 'https://via.placeholder.com/100'}" alt="${game.name}"><span>${game.name}</span>`; card.onclick = () => window.executeBukaGame(game.id_hash); popTrack.appendChild(card); }); if(popularGames.length > 0) startAutoScroll('popularGamesTrack', 1.5);
            newTrack.innerHTML = ''; newGames.forEach(game => { const card = document.createElement('div'); card.className = 'home-game-card'; card.innerHTML = `<img src="${game.image || 'https://via.placeholder.com/100'}" alt="${game.name}"><span>${game.name}</span>`; card.onclick = () => window.executeBukaGame(game.id_hash); newTrack.appendChild(card); }); if(newGames.length > 0) startAutoScroll('newGamesTrack', 1.5);
        } catch (err) { if(popTrack) popTrack.innerHTML = '<p style="color: red; font-size: 12px; text-align: center; width: 100%;">Gagal memuat.</p>'; if(newTrack) newTrack.innerHTML = '<p style="color: red; font-size: 12px; text-align: center; width: 100%;">Gagal memuat.</p>'; }
    }
    loadHomeGames();
});