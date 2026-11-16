// ============================================================
// BAGIAN 1: LOBI GAME (SOFTAGGREGATOR)
// ============================================================

// 1. Tampilkan Daftar Provider
window.loadLobby = async function() {
    document.getElementById('providerSection').style.display = 'block';
    document.getElementById('gameSection').style.display = 'none';
    
    const providerGrid = document.getElementById('providerGrid');
    providerGrid.innerHTML = '<p style="color: gray; grid-column: span 3; text-align: center;">Memuat provider...</p>';

    try {
        const response = await fetch(`https://nusa138.wispbyte.app/api/providers`);
        const data = await response.json();

        if (data.error) throw new Error(data.error);
        providerGrid.innerHTML = ''; 

        data.providers.forEach(prov => {
            const card = document.createElement('div');
            card.style.cssText = "background: #1a1a1a; border: 1px solid #333; border-radius: 8px; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; aspect-ratio: 1/1; transition: 0.2s;";
            card.onmouseover = () => card.style.borderColor = "#7b2cbf";
            card.onmouseout = () => card.style.borderColor = "#333";
            
            card.innerHTML = `
                <img src="${prov.logo || 'https://via.placeholder.com/100?text=Game'}" style="width: 80%; height: auto; object-fit: contain; margin-bottom: 8px;">
                <span style="color: white; font-size: 11px; text-align: center; font-weight: bold;">${prov.name}</span>
            `;
            card.onclick = () => window.loadProviderGames(prov.provider, prov.name);
            providerGrid.appendChild(card);
        });
    } catch (err) {
        providerGrid.innerHTML = '<p style="color: red; grid-column: span 3; text-align: center;">Gagal memuat provider.</p>';
    }
};

// 2. Tampilkan Game dari Provider yang Dipilih
window.loadProviderGames = async function(providerCode, providerName) {
    document.getElementById('providerSection').style.display = 'none';
    document.getElementById('gameSection').style.display = 'block';
    document.getElementById('currentProviderName').innerText = providerName;
    
    const gameGrid = document.getElementById('gameGrid');
    gameGrid.innerHTML = '<p style="color: gray; grid-column: span 3; text-align: center;">Memuat game...</p>';

    try {
        const response = await fetch(`https://nusa138.wispbyte.app/api/games`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const filteredGames = data.games.filter(game => game.provider === providerCode);
        gameGrid.innerHTML = '';

        if (filteredGames.length === 0) {
            gameGrid.innerHTML = '<p style="color: gray; grid-column: span 3; text-align: center;">Belum ada game untuk provider ini.</p>';
            return;
        }

        filteredGames.slice(0, 50).forEach(game => {
            const card = document.createElement('div');
            card.style.cssText = "background: #222; border-radius: 8px; overflow: hidden; cursor: pointer; text-align: center; transition: transform 0.2s;";
            card.onmouseover = () => card.style.transform = "scale(1.05)";
            card.onmouseout = () => card.style.transform = "scale(1)";
            
            const imgUrl = game.image || 'https://via.placeholder.com/150';
            card.innerHTML = `
                <img src="${imgUrl}" style="width: 100%; aspect-ratio: 1/1; object-fit: cover; display: block;">
                <div style="padding: 6px 4px; font-size: 10px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${game.name}</div>
            `;
            card.onclick = () => window.bukaGame(game.id_hash);
            gameGrid.appendChild(card);
        });

    } catch (err) {
        gameGrid.innerHTML = '<p style="color: red; grid-column: span 3; text-align: center;">Gagal memuat daftar game.</p>';
    }
};

// 3. Kembali ke Provider
window.backToProviders = function() {
    document.getElementById('gameSection').style.display = 'none';
    document.getElementById('providerSection').style.display = 'block';
};

// 4. Buka Game Spesifik
window.bukaGame = async function(idHash) {
    if (typeof currentSession === 'undefined' || !currentSession || !currentSession.user) {
        alert("Silakan login terlebih dahulu!");
        return;
    }
    const username = currentSession.user.user_metadata.username;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (typeof showLoading === 'function') showLoading();

    try {
        const response = await fetch(`https://nusa138.wispbyte.app/api/get-game`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: username, 
                gameCode: idHash,
                device: isMobile ? 'mobile' : 'desktop' 
            })
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
// BAGIAN 2: WITHDRAW & FORMAT ANGKA (ANTI-HACK RPC)
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
    const selectedBankValue = withdrawBankSelect.value;

    withdrawErrorMsg.style.display = 'none';
    withdrawAmountInput.style.borderColor = '#555';
    withdrawBankSelect.style.borderColor = '#555';

    if (!amount || isNaN(amount) || amount < 50000) {
        withdrawErrorMsg.textContent = 'Minimal penarikan adalah Rp 50.000';
        withdrawErrorMsg.style.display = 'block';
        withdrawAmountInput.style.borderColor = '#ff3333'; return;
    }
    if (!selectedBankValue) {
        withdrawErrorMsg.textContent = 'Pilih akun bank terdaftar!';
        withdrawErrorMsg.style.display = 'block';
        withdrawBankSelect.style.borderColor = '#ff3333'; return;
    }

    const selectedOption = withdrawBankSelect.options[withdrawBankSelect.selectedIndex];
    const bankName = selectedOption.dataset.bankName;
    const accountNumber = selectedOption.dataset.accountNumber;
    const accountName = selectedOption.dataset.accountName;

    btn.disabled = true;
    btn.innerText = 'MEMPROSES...';

    try {
        const { data: isSuccess, error } = await supabaseClient.rpc('request_withdraw', {
            payload: { amount, bank_name: bankName, account_number: accountNumber, account_name: accountName }
        });

        if (error) throw new Error(error.message);

        if (!isSuccess) {
            withdrawErrorMsg.textContent = 'Saldo tidak cukup!';
            withdrawErrorMsg.style.display = 'block';
            withdrawAmountInput.style.borderColor = '#ff3333';
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
// BAGIAN 3: LOGIKA UI LAINNYA (ROUTING, DEPOSIT, DLL)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabaseClient === 'undefined') return;

    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (typeof checkAuthState === 'function') checkAuthState(session);
        if (typeof handleRouting === 'function') handleRouting();
    });

    const routes = {
        '/home': 'homeView', '/': 'homeView', '/promo': 'promoView', '/memo': 'memoView',
        '/deposit': 'depositView', '/about': 'aboutView', '/banking': 'bankingView', '/lobby': 'lobbyView'
    };

    window.showLoading = function () { document.getElementById('loadingOverlay')?.classList.add('active'); };
    window.hideLoading = function () { document.getElementById('loadingOverlay')?.classList.remove('active'); };

    window.navigateTo = function (path, pushState = true) {
        showLoading();
        setTimeout(() => {
            document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
            let targetViewId = routes[path] || 'homeView';
            
            if (!currentSession && targetViewId !== 'homeView') {
                hideLoading(); if (typeof openLoginPanel === 'function') openLoginPanel(); return;
            }

            const targetView = document.getElementById(targetViewId);
            if (targetView) { targetView.classList.add('active'); window.scrollTo(0, 0); }

            if (targetViewId === 'depositView' && typeof openDepositView === 'function') openDepositView(); 
            if (targetViewId === 'lobbyView' && typeof loadLobby === 'function') loadLobby();

            if (pushState) history.pushState({ path: path }, '', path);
            hideLoading();
        }, 300);
    };

    window.handleRouting = function () { navigateTo(window.location.pathname, false); };
    window.addEventListener('popstate', () => handleRouting());

    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-link]');
        if (link) { e.preventDefault(); navigateTo(link.getAttribute('href'), true); }
    });

    // Login
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            const usernameOrEmail = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            if (!usernameOrEmail || !password) return alert("Isi data login!");

            btnLogin.innerText = "MEMPROSES...";
            let emailToLogin = usernameOrEmail;
            if (!usernameOrEmail.includes('@')) {
                const { data: profileData } = await supabaseClient.from('profiles').select('email').eq('username', usernameOrEmail).single();
                if (!profileData) { alert("Username tidak ada!"); btnLogin.innerText = "Login"; return; }
                emailToLogin = profileData.email;
            }
            const { error } = await supabaseClient.auth.signInWithPassword({ email: emailToLogin, password });
            if (error) { alert("Login Gagal."); btnLogin.innerText = "Login"; } 
            else { alert("Login Berhasil!"); btnLogin.innerText = "Login"; }
        });
    }

    // Deposit & QRIS
    window.openDepositView = async function () {
        if (!currentSession) { if(typeof openLoginPanel === 'function') openLoginPanel(); return; }
        document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
        document.getElementById('depositView')?.classList.add('active');
        
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
                opt.text = `${profile.bank_name} (****${profile.account_number.slice(-4)})`;
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
    
    // Tabs Deposit
    document.querySelectorAll('.deposit-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.deposit-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.deposit-pane').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(this.getAttribute('data-target'))?.classList.add('active');
        });
    });
});