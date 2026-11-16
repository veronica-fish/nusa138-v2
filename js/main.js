// ============================================================
// BAGIAN 1: ROUTING HASH (#)
// ============================================================
window.navigateTo = function (path, pushState = true) {
    if (typeof showLoading === 'function') showLoading();
    
    if (pushState) {
        if (window.location.hash !== '#' + path) window.location.hash = path;
    }
    
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
    const parts = path.split('/').filter(p => p !== '');
    const mainRoute = parts[0] || 'home';

    if (mainRoute === 'home' || mainRoute === '') {
        document.getElementById('homeView')?.classList.add('active');
        document.getElementById('navHome')?.classList.add('active');
    } 
    else if (mainRoute === 'login') {
        document.getElementById('homeView')?.classList.add('active');
        if (typeof openLoginPanel === 'function') openLoginPanel();
    }
    else if (mainRoute === 'deposit') {
        document.getElementById('depositView')?.classList.add('active');
        document.getElementById('danaBtn')?.classList.add('active');
        if (typeof openDepositView === 'function') openDepositView();
    }
    else if (['slots', 'live', 'sportsbook', 'fishing', 'other'].includes(mainRoute)) {
        document.getElementById('lobbyView')?.classList.add('active');
        window.currentCategory = mainRoute;
        if (parts.length === 1) { if (typeof loadLobby === 'function') loadLobby(); }
        else if (parts.length === 2) { if (typeof loadProviderGamesByURL === 'function') loadProviderGamesByURL(mainRoute, parts[1]); }
        else if (parts.length === 3) { if (typeof loadGameByURL === 'function') loadGameByURL(mainRoute, parts[1], parts[2]); }
    }
    else {
        const viewId = mainRoute + 'View';
        document.getElementById(viewId)?.classList.add('active');
    }

    window.scrollTo(0, 0);
    if (typeof hideLoading === 'function') hideLoading();
};

window.handleRouting = function () { 
    let path = window.location.hash.replace('#', '') || '/home';
    navigateTo(path, false); 
};

// ============================================================
// BAGIAN 2: LOBI GAME, SORTIR POPULER & PENCARIAN
// ============================================================
const POPULAR_PROVIDERS = ['pgsoft', 'pragmaticplay', 'evolution', 'joker', 'cq9', 'habanero', 'playtech'];
const POPULAR_GAMES = ['mahjong', 'gates of olympus', 'fortune', 'sweet bonanza', 'starlight', 'aztec', 'wild bandito', 'olympus'];

window.currentCategory = 'slots';
window.allGamesData = [];
window.rawProvidersData = [];
window.rawGamesData = [];
window.currentGamesData = [];
window.currentGameIndex = 0;
window.gamesPerPage = 30;

window.loadLobby = async function() {
    document.getElementById('providerSection').style.display = 'block';
    document.getElementById('gameSection').style.display = 'none';
    document.getElementById('searchLobbyInput').placeholder = "Cari Provider...";
    
    const categoryNames = { 'slots': 'Slots', 'live': 'Live Casino', 'sportsbook': 'Sports', 'fishing': 'Tembak Ikan', 'other': 'Games' };
    document.getElementById('providerSectionTitle').innerText = `Pilih Provider - ${categoryNames[window.currentCategory] || 'Games'}`;
    
    const providerGrid = document.getElementById('providerGrid');
    providerGrid.innerHTML = '<p style="color: gray; grid-column: span 3; text-align: center;">Memuat provider...</p>';

    try {
        const response = await fetch(`https://nusa138.wispbyte.app/api/games`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        window.allGamesData = data.games;
        const gamesInCategory = data.games.filter(g => g.game_type === window.currentCategory);
        const uniqueProviders = [];
        const map = new Map();
        
        for (const item of gamesInCategory) {
            if(!map.has(item.provider)){
                map.set(item.provider, true);
                uniqueProviders.push({ provider: item.provider, name: item.provider_name || item.provider, logo: item.provider_logo });
            }
        }

        uniqueProviders.sort((a, b) => {
            const aPop = POPULAR_PROVIDERS.includes(a.provider.toLowerCase());
            const bPop = POPULAR_PROVIDERS.includes(b.provider.toLowerCase());
            return (aPop && !bPop) ? -1 : (!aPop && bPop) ? 1 : 0;
        });

        window.rawProvidersData = uniqueProviders;
        window.renderProviders(window.rawProvidersData);
    } catch (err) {
        providerGrid.innerHTML = '<p style="color: red; grid-column: span 3; text-align: center;">Gagal memuat provider.</p>';
    }
};

window.renderProviders = function(providersList) {
    const providerGrid = document.getElementById('providerGrid');
    providerGrid.innerHTML = ''; 
    if (providersList.length === 0) {
        providerGrid.innerHTML = `<p style="color: gray; grid-column: span 3; text-align: center;">Provider tidak ditemukan.</p>`;
        return;
    }

    providersList.forEach(prov => {
        const card = document.createElement('div');
        card.style.cssText = "background: linear-gradient(145deg, #2a2a2a, #1a1a1a); box-shadow: 0 4px 8px rgba(0,0,0,0.5); border: 1px solid #444; border-radius: 12px; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 15px 10px; aspect-ratio: 1/1; transition: all 0.3s ease;";
        card.onmouseover = () => { card.style.transform = "translateY(-5px)"; card.style.borderColor = "#a855f7"; };
        card.onmouseout = () => { card.style.transform = "translateY(0)"; card.style.borderColor = "#444"; };
        
        card.innerHTML = `
            <img src="${prov.logo || 'https://via.placeholder.com/150/222/FFF?text='+prov.name}" style="width: 90%; height: 60%; object-fit: contain; margin-bottom: 10px;">
            <span style="color: #fff; font-size: 12px; text-align: center; font-weight: 600; text-shadow: 1px 1px 2px #000;">${prov.name}</span>
        `;
        card.onclick = () => window.navigateTo(`/${window.currentCategory}/${prov.provider}`, true);
        providerGrid.appendChild(card);
    });
};

window.loadProviderGamesByURL = async function(category, providerCode) {
    if (window.allGamesData.length === 0) await window.loadLobby();
    document.getElementById('providerSection').style.display = 'none';
    document.getElementById('gameSection').style.display = 'block';
    document.getElementById('searchLobbyInput').placeholder = "Cari Game...";
    
    const provObj = window.rawProvidersData.find(p => p.provider === providerCode);
    document.getElementById('currentProviderName').innerText = provObj ? provObj.name : providerCode;
    
    let filteredGames = window.allGamesData.filter(game => game.provider === providerCode && game.game_type === category);
    
    filteredGames.sort((a, b) => {
        const aPop = POPULAR_GAMES.some(kw => a.name.toLowerCase().includes(kw));
        const bPop = POPULAR_GAMES.some(kw => b.name.toLowerCase().includes(kw));
        return (aPop && !bPop) ? -1 : (!aPop && bPop) ? 1 : 0;
    });

    window.rawGamesData = filteredGames;
    window.currentGamesData = filteredGames;
    window.currentGameIndex = 0;
    window.renderGames();
};

window.loadGameByURL = async function(category, providerCode, gameSlug) {
    if (window.allGamesData.length === 0) await window.loadLobby();
    await window.loadProviderGamesByURL(category, providerCode);
    
    const gameData = window.allGamesData.find(g => g.id_hash.replace(/[^a-zA-Z0-9]/g, '-') === gameSlug);
    if (gameData) window.executeBukaGame(gameData.id_hash);
    else { alert("Game tidak ditemukan."); window.navigateTo(`/${category}/${providerCode}`, true); }
};

window.renderGames = function() {
    const gameGrid = document.getElementById('gameGrid');
    if (window.currentGameIndex === 0) {
        gameGrid.innerHTML = '';
        document.getElementById('btnLoadMoreGames')?.remove();
    }
    if (window.currentGamesData.length === 0) {
        gameGrid.innerHTML = '<p style="color: gray; grid-column: span 3; text-align: center;">Game tidak ditemukan.</p>';
        return;
    }

    const endIndex = window.currentGameIndex + window.gamesPerPage;
    const gamesToRender = window.currentGamesData.slice(window.currentGameIndex, endIndex);

    gamesToRender.forEach(game => {
        const card = document.createElement('div');
        card.style.cssText = "background: #222; border-radius: 8px; overflow: hidden; cursor: pointer; text-align: center; transition: transform 0.2s;";
        card.onmouseover = () => card.style.transform = "scale(1.05)";
        card.onmouseout = () => card.style.transform = "scale(1)";
        
        card.innerHTML = `
            <img src="${game.image || 'https://via.placeholder.com/150'}" style="width: 100%; aspect-ratio: 1/1; object-fit: cover; display: block;">
            <div style="padding: 6px 4px; font-size: 10px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${game.name}</div>
        `;
        
        card.onclick = () => {
            const slug = game.id_hash.replace(/[^a-zA-Z0-9]/g, '-');
            window.navigateTo(`/${window.currentCategory}/${game.provider}/${slug}`, true);
            window.executeBukaGame(game.id_hash);
        };
        gameGrid.appendChild(card);
    });

    window.currentGameIndex = endIndex;

    let btnLoadMore = document.getElementById('btnLoadMoreGames');
    if (window.currentGameIndex < window.currentGamesData.length) {
        if (!btnLoadMore) {
            btnLoadMore = document.createElement('button');
            btnLoadMore.id = 'btnLoadMoreGames';
            btnLoadMore.innerText = 'MUAT LEBIH BANYAK';
            btnLoadMore.style.cssText = "grid-column: span 3; padding: 12px; margin-top: 15px; background: #7b2cbf; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;";
            btnLoadMore.onclick = () => { btnLoadMore.innerText = 'MEMUAT...'; setTimeout(() => window.renderGames(), 100); };
            gameGrid.after(btnLoadMore);
        } else { btnLoadMore.style.display = 'block'; }
    } else { if (btnLoadMore) btnLoadMore.style.display = 'none'; }
};

window.backToProviders = function() { window.navigateTo(`/${window.currentCategory}`, true); };

document.getElementById('searchLobbyInput')?.addEventListener('input', function(e) {
    const keyword = e.target.value.toLowerCase();
    if (document.getElementById('providerSection').style.display === 'block') {
        const filtered = window.rawProvidersData.filter(p => p.name.toLowerCase().includes(keyword));
        window.renderProviders(filtered);
    } else {
        const filtered = window.rawGamesData.filter(g => g.name.toLowerCase().includes(keyword));
        window.currentGamesData = filtered;
        window.currentGameIndex = 0;
        window.renderGames();
    }
});

window.executeBukaGame = async function(idHash) {
    if (typeof currentSession === 'undefined' || !currentSession || !currentSession.user) {
        alert("Silakan login terlebih dahulu!"); window.navigateTo('/login', true); return;
    }
    const username = currentSession.user.user_metadata.username;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (typeof showLoading === 'function') showLoading();
    try {
        const response = await fetch(`https://nusa138.wispbyte.app/api/get-game`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, gameCode: idHash, device: isMobile ? 'mobile' : 'desktop' })
        });
        const data = await response.json();
        if (typeof hideLoading === 'function') hideLoading();
        if (data.error) alert("Gagal membuka game: " + data.error);
        else window.open(data.url, '_blank');
    } catch (err) {
        if (typeof hideLoading === 'function') hideLoading();
        alert("Koneksi ke server game gagal.");
    }
};

// ============================================================
// BAGIAN 3: WITHDRAW (ANTI-HACK RPC)
// ============================================================
document.body.addEventListener('input', function (e) {
    if (e.target.id !== 'withdrawAmount') return;
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value) { e.target.value = parseInt(value, 10).toLocaleString('en-US'); } else { e.target.value = ''; }
    document.getElementById('withdrawErrorMsg').style.display = 'none';
    e.target.style.borderColor = '#555';
});

document.body.addEventListener('change', function (e) {
    if (e.target.id !== 'withdrawBankSelect') return;
    e.target.style.borderColor = '#555';
    document.getElementById('withdrawErrorMsg').style.display = 'none';
    const opt = e.target.options[e.target.selectedIndex];
    const nameEl = document.getElementById('withdrawAccountName');
    if (nameEl && opt && opt.dataset.accountName) nameEl.value = opt.dataset.accountName;
});

document.body.addEventListener('click', async function (e) {
    const btn = e.target.closest('#btnWithdraw');
    if (!btn) return;
    e.preventDefault();
    
    if (typeof currentSession === 'undefined' || !currentSession || !currentSession.user) {
        alert('Silakan login terlebih dahulu.'); return;
    }

    const withdrawAmountInput = document.getElementById('withdrawAmount');
    const withdrawErrorMsg = document.getElementById('withdrawErrorMsg');
    const withdrawBankSelect = document.getElementById('withdrawBankSelect');
    const amount = parseInt(withdrawAmountInput.value.replace(/[.,\s]/g, ''), 10);
    
    withdrawErrorMsg.style.display = 'none';
    withdrawAmountInput.style.borderColor = '#555';
    withdrawBankSelect.style.borderColor = '#555';

    if (!amount || isNaN(amount) || amount < 50000) {
        withdrawErrorMsg.textContent = 'Minimal penarikan Rp 50.000';
        withdrawErrorMsg.style.display = 'block'; withdrawAmountInput.style.borderColor = '#ff3333'; return;
    }
    if (!withdrawBankSelect.value) {
        withdrawErrorMsg.textContent = 'Pilih akun bank terdaftar!';
        withdrawErrorMsg.style.display = 'block'; withdrawBankSelect.style.borderColor = '#ff3333'; return;
    }

    const selectedOption = withdrawBankSelect.options[withdrawBankSelect.selectedIndex];
    btn.disabled = true; btn.innerText = 'MEMPROSES...';

    try {
        const { data: isSuccess, error } = await supabaseClient.rpc('request_withdraw', {
            payload: { amount: amount, bank_name: selectedOption.dataset.bankName, account_number: selectedOption.dataset.accountNumber, account_name: selectedOption.dataset.accountName }
        });
        if (error) throw new Error(error.message);
        if (!isSuccess) {
            withdrawErrorMsg.textContent = 'Saldo tidak cukup!';
            withdrawErrorMsg.style.display = 'block'; withdrawAmountInput.style.borderColor = '#ff3333';
        } else {
            alert(`✅ Penarikan Rp ${amount.toLocaleString('id-ID')} berhasil!`);
            withdrawAmountInput.value = ''; withdrawBankSelect.value = '';
            if (typeof openDepositView === 'function') openDepositView(); 
        }
    } catch (err) {
        withdrawErrorMsg.textContent = 'Kesalahan sistem: ' + err.message;
        withdrawErrorMsg.style.display = 'block';
    } finally {
        btn.innerText = 'Withdraw'; btn.disabled = false;
    }
});

// ============================================================
// BAGIAN 4: UI LAINNYA (ANIMASI & INIT)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabaseClient === 'undefined') return;

    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (typeof checkAuthState === 'function') checkAuthState(session);
        window.handleRouting(); 
    });
    
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        if (typeof checkAuthState === 'function') checkAuthState(session);
    });

    window.showLoading = function () { document.getElementById('loadingOverlay')?.classList.add('active'); };
    window.hideLoading = function () { document.getElementById('loadingOverlay')?.classList.remove('active'); };
    
    window.addEventListener('hashchange', () => window.handleRouting());

    const headerUserBtn = document.getElementById('headerUserBtn');
    if (headerUserBtn) {
        headerUserBtn.addEventListener('click', () => {
            if (currentSession) openProfilePanel(); else window.navigateTo('/login', true);
        });
    }

    // Banner Slider
    const track = document.getElementById('bannerTrack');
    if (track) {
        let currentIndex = 0;
        setInterval(() => { currentIndex = (currentIndex + 1) % 3; track.style.transform = `translateX(${currentIndex * -33.3333}%)`; }, 5000);
    }

    // Live Transaksi Palsu (Dikembalikan)
    const transTrack = document.getElementById('transTrack');
    const transDots = document.querySelectorAll('.t-dot');
    if (transTrack) {
        let transIndex = 0; let transInterval; const totalTransCards = 4; const totalPages = 3;

        function formatRupiah(amount) {
            let formatted = (amount / 1000).toFixed(2); let parts = formatted.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            return "IDR " + parts.join('.');
        }
        function generateRandomData() {
            const prefixes = ['DEW', 'SIG', 'ABD', 'BUD', 'AGU', 'RIN', 'JOK', 'BAM', 'SUP', 'ADI', 'DEN', 'PUT', 'WAY', 'KOM'];
            const maskedName = prefixes[Math.floor(Math.random() * prefixes.length)] + '*'.repeat(Math.floor(Math.random() * 7) + 4);
            let amountK; const rand = Math.random();
            if (rand < 0.8) amountK = Math.floor(Math.random() * 451) + 50;
            else { if (Math.random() > 0.5) amountK = Math.floor(Math.random() * 40) + 10; else amountK = Math.floor(Math.random() * 9500) + 501; }
            const type = Math.random() > 0.5 ? 'DEPOSIT' : 'WITHDRAW';
            const now = new Date(); now.setMinutes(now.getMinutes() - Math.floor(Math.random() * 60)); 
            const formattedDate = `${type}, ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            return { name: maskedName, amount: formatRupiah(amountK * 1000), date: formattedDate };
        }
        function populateCards() {
            for (let i = 1; i <= totalTransCards; i++) {
                const data = generateRandomData();
                const nameEl = document.getElementById(`name${i}`);
                const amountEl = document.getElementById(`amount${i}`);
                const typeEl = document.getElementById(`type${i}`);
                if (nameEl) nameEl.innerText = data.name;
                if (amountEl) amountEl.innerText = data.amount;
                if (typeEl) typeEl.innerText = data.date;
            }
        }
        function goToTransSlide(index) {
            transTrack.style.transform = `translateX(calc(-${index * 50}% - ${index * 6}px))`;
            transDots.forEach(dot => dot.classList.remove('active'));
            if (transDots[index]) transDots[index].classList.add('active');
        }
        function startTransSlider() {
            clearInterval(transInterval);
            transInterval = setInterval(() => {
                transIndex++;
                if (transIndex >= totalPages) { transIndex = 0; populateCards(); }
                goToTransSlide(transIndex);
            }, 4000);
        }
        populateCards(); startTransSlider();
    }

    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            if (!email || !password) return alert("Isi email dan password!");
            btnLogin.innerText = "MEMPROSES...";
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) alert("Login Gagal: " + error.message);
            else { alert("Login Berhasil!"); window.navigateTo('/home', true); }
            btnLogin.innerText = "Login";
        });
    }

    window.openDepositView = async function () {
        if (!currentSession) { window.navigateTo('/login', true); return; }
        document.getElementById('formInputArea').style.display = 'block';
        document.getElementById('qrisArea').style.display = 'none';

        const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', currentSession.user.id).single();
        if (profile) {
            document.getElementById('depositUsername').value = profile.username || '-';
            document.getElementById('withdrawAccountName').value = profile.account_name || '-';
            const bankSelect = document.getElementById('withdrawBankSelect');
            bankSelect.innerHTML = '<option value="">- Silahkan pilih -</option>';
            if (profile.bank_name) {
                const opt = document.createElement('option');
                opt.value = profile.bank_name;
                opt.text = `${profile.bank_name} (****${profile.account_number?.slice(-4) || ''})`;
                opt.dataset.bankName = profile.bank_name;
                opt.dataset.accountNumber = profile.account_number;
                opt.dataset.accountName = profile.account_name;
                bankSelect.appendChild(opt);
            }
            document.getElementById('withdrawBalance').innerText = 'IDR ' + (parseFloat(profile.balance) || 0).toLocaleString('id-ID');
        }
    };

    const btnShowQris = document.getElementById('btnShowQris');
    if (btnShowQris) {
        btnShowQris.addEventListener('click', async () => {
            const amount = parseInt(document.getElementById('depositAmount').value);
            if (!amount || amount < 20000) return alert("Minimal Rp 20.000!");
            btnShowQris.innerText = "MEMPROSES..."; btnShowQris.disabled = true;
            try {
                const res = await fetch('https://nusa138.wispbyte.app/api/create-qris', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount, username: document.getElementById('depositUsername').value })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                document.getElementById('qrisImage').src = data.qr_url;
                document.getElementById('qrisNominal').innerText = ": Rp " + amount.toLocaleString('id-ID');
                document.getElementById('btnDownloadQris').href = data.qr_url;
                document.getElementById('formInputArea').style.display = 'none';
                document.getElementById('qrisArea').style.display = 'block';
            } catch (error) { alert("Gagal: " + error.message); } 
            finally { btnShowQris.innerText = "TAMPILKAN QRIS"; btnShowQris.disabled = false; }
        });
    }

    if (document.getElementById('btnBackToForm')) {
        document.getElementById('btnBackToForm').addEventListener('click', () => {
            document.getElementById('qrisArea').style.display = 'none';
            document.getElementById('formInputArea').style.display = 'block';
        });
    }
    
    document.querySelectorAll('.deposit-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.deposit-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.deposit-pane').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(this.getAttribute('data-target'))?.classList.add('active');
        });
    });

    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function () {
            const answer = this.nextElementSibling;
            const icon = this.querySelector('i');
            if (!answer || !icon) return;
            if (answer.style.maxHeight) {
                answer.style.maxHeight = null; icon.classList.replace('fa-minus', 'fa-plus');
            } else {
                document.querySelectorAll('.faq-answer').forEach(ans => ans.style.maxHeight = null);
                document.querySelectorAll('.faq-question i').forEach(ic => ic.classList.replace('fa-minus', 'fa-plus'));
                answer.style.maxHeight = answer.scrollHeight + "px"; icon.classList.replace('fa-plus', 'fa-minus');
            }
        });
    });
});