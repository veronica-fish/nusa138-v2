// ============================================================
// BAGIAN 1: FUNGSI LOBI & GAME (SOFTAGGREGATOR)
// ============================================================

// Tampilkan Lobi Game
window.loadLobby = async function() {
    const gameGrid = document.getElementById('gameGrid');
    if(!gameGrid) return;
    gameGrid.innerHTML = '<p style="color: gray; grid-column: span 3; text-align: center;">Memuat game...</p>';

    try {
        const response = await fetch(`https://nusa138.wispbyte.app/api/games`);
        const data = await response.json();

        if (data.error) throw new Error(data.error);
        gameGrid.innerHTML = ''; 

        // Tampilkan maksimal 30 game pertama
        const gamesToShow = data.games.slice(0, 30);

        gamesToShow.forEach(game => {
            const card = document.createElement('div');
            card.style.cssText = "background: #222; border-radius: 8px; overflow: hidden; cursor: pointer; text-align: center; transition: transform 0.2s;";
            card.onmouseover = () => card.style.transform = "scale(1.05)";
            card.onmouseout = () => card.style.transform = "scale(1)";
            
            const imgUrl = game.image || 'https://via.placeholder.com/150';
            card.innerHTML = `
                <img src="${imgUrl}" style="width: 100%; aspect-ratio: 1/1; object-fit: cover; display: block;">
                <div style="padding: 8px 4px; font-size: 11px; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${game.name}</div>
            `;
            card.onclick = () => window.bukaGame(game.id_hash);
            gameGrid.appendChild(card);
        });
    } catch (err) {
        console.error("Gagal load lobby:", err);
        gameGrid.innerHTML = '<p style="color: red; grid-column: span 3; text-align: center;">Gagal memuat daftar game.</p>';
    }
};

// Buka Game Spesifik
window.bukaGame = async function(idHash) {
    if (typeof currentSession === 'undefined' || !currentSession || !currentSession.user) {
        alert("Silakan login terlebih dahulu untuk bermain!");
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

        if (data.error) {
            alert("Gagal membuka game: " + data.error);
        } else {
            // Buka di tab baru
            window.open(data.url, '_blank');
        }
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
    const errMsg = document.getElementById('withdrawErrorMsg');
    if (errMsg) errMsg.style.display = 'none';
    e.target.style.borderColor = '#555';
});

document.body.addEventListener('change', function (e) {
    if (e.target.id !== 'withdrawBankSelect') return;
    e.target.style.borderColor = '#555';
    const errMsg = document.getElementById('withdrawErrorMsg');
    if (errMsg) errMsg.style.display = 'none';
    const opt = e.target.options[e.target.selectedIndex];
    const nameEl = document.getElementById('withdrawAccountName');
    if (nameEl && opt && opt.dataset.accountName) nameEl.value = opt.dataset.accountName;
});

document.body.addEventListener('click', async function (e) {
    const btn = e.target.closest('#btnWithdraw');
    if (!btn) return;
    e.preventDefault();
    
    if (typeof currentSession === 'undefined' || !currentSession || !currentSession.user) {
        alert('Silakan login terlebih dahulu.');
        if (typeof openLoginPanel === 'function') openLoginPanel();
        return;
    }

    const withdrawAmountInput = document.getElementById('withdrawAmount');
    const withdrawErrorMsg = document.getElementById('withdrawErrorMsg');
    const withdrawBankSelect = document.getElementById('withdrawBankSelect');

    if (!withdrawAmountInput || !withdrawErrorMsg || !withdrawBankSelect) return;

    const amountStr = withdrawAmountInput.value.replace(/[.,\s]/g, '');
    const amount = parseInt(amountStr, 10);
    const selectedBankValue = withdrawBankSelect.value;

    withdrawErrorMsg.style.display = 'none';
    withdrawAmountInput.style.borderColor = '#555';
    withdrawBankSelect.style.borderColor = '#555';

    if (!amount || isNaN(amount) || amount < 50000) {
        withdrawErrorMsg.textContent = 'Minimal penarikan adalah Rp 50.000';
        withdrawErrorMsg.style.display = 'block';
        withdrawAmountInput.style.borderColor = '#ff3333';
        return;
    }

    if (!selectedBankValue) {
        withdrawErrorMsg.textContent = 'Silakan pilih akun bank yang terdaftar!';
        withdrawErrorMsg.style.display = 'block';
        withdrawBankSelect.style.borderColor = '#ff3333';
        return;
    }

    const selectedOption = withdrawBankSelect.options[withdrawBankSelect.selectedIndex];
    const bankName = selectedOption.dataset.bankName || selectedBankValue;
    const accountNumber = selectedOption.dataset.accountNumber || '';
    const accountName = selectedOption.dataset.accountName || '';

    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = 'MEMPROSES...';

    try {
        const { data: isSuccess, error } = await supabaseClient.rpc('request_withdraw', {
            payload: { amount: amount, bank_name: bankName, account_number: accountNumber, account_name: accountName }
        });

        if (error) throw new Error(error.message);

        if (!isSuccess) {
            withdrawErrorMsg.textContent = 'Saldo tidak cukup untuk melakukan penarikan ini.';
            withdrawErrorMsg.style.display = 'block';
            withdrawAmountInput.style.borderColor = '#ff3333';
        } else {
            alert(`✅ Penarikan Rp ${amount.toLocaleString('id-ID')} berhasil diajukan!`);
            withdrawAmountInput.value = '';
            withdrawBankSelect.value = '';
            if (typeof openDepositView === 'function') openDepositView(); 
        }
    } catch (err) {
        console.error('❌ Error withdraw:', err);
        withdrawErrorMsg.textContent = 'Terjadi kesalahan sistem: ' + err.message;
        withdrawErrorMsg.style.display = 'block';
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
});


// ============================================================
// BAGIAN 3: LOGIKA UI LAINNYA
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    
    if (typeof generateCaptcha === 'function') generateCaptcha();
    if (typeof supabaseClient === 'undefined') return;

    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (typeof checkAuthState === 'function') checkAuthState(session);
        if (typeof handleRouting === 'function') handleRouting();
    });

    supabaseClient.auth.onAuthStateChange((_event, session) => {
        if (typeof checkAuthState === 'function') checkAuthState(session);
    });

    const headerUserBtn = document.getElementById('headerUserBtn');
    if (headerUserBtn) {
        headerUserBtn.addEventListener('click', () => {
            if (currentSession) openProfilePanel();
            else openLoginPanel();
        });
    }

    // ROUTING
    const routes = {
        '/home': 'homeView', '/': 'homeView', '/promo': 'promoView', '/memo': 'memoView',
        '/deposit': 'depositView', '/about': 'aboutView', '/banking': 'bankingView',
        '/lobby': 'lobbyView' // Rute Lobi
    };

    window.showLoading = function () { const el = document.getElementById('loadingOverlay'); if (el) el.classList.add('active'); };
    window.hideLoading = function () { const el = document.getElementById('loadingOverlay'); if (el) el.classList.remove('active'); };

    window.navigateTo = function (path, pushState = true) {
        showLoading();
        setTimeout(() => {
            document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
            let targetViewId = routes[path] || 'homeView';
            
            if (!currentSession && targetViewId !== 'homeView') {
                hideLoading();
                if (typeof openLoginPanel === 'function') openLoginPanel();
                return;
            }

            const targetView = document.getElementById(targetViewId);
            if (targetView) {
                targetView.classList.add('active');
                window.scrollTo(0, 0);
                const bottomNav = document.querySelector('.bottom-nav');
                if (targetViewId === 'gameView') { if (bottomNav) bottomNav.style.display = 'none'; } 
                else { if (bottomNav) bottomNav.style.display = 'flex'; }
            }

            if (targetViewId === 'depositView' && typeof openDepositView === 'function') openDepositView(); 
            if (targetViewId === 'lobbyView' && typeof loadLobby === 'function') loadLobby(); // Panggil Load Lobi

            if (pushState) history.pushState({ path: path }, '', path);
            
            document.querySelectorAll('.bottom-nav .nav-item').forEach(n => n.classList.remove('active'));
            if (targetViewId === 'homeView') document.getElementById('navHome')?.classList.add('active');
            if (targetViewId === 'promoView') document.getElementById('navPromo')?.classList.add('active');
            if (targetViewId === 'memoView') document.getElementById('navMemo')?.classList.add('active');
            if (targetViewId === 'depositView') document.getElementById('danaBtn')?.classList.add('active');

            hideLoading();
        }, 300);
    };

    window.handleRouting = function () { navigateTo(window.location.pathname, false); };
    window.addEventListener('popstate', () => handleRouting());

    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-link]');
        if (link) { e.preventDefault(); navigateTo(link.getAttribute('href'), true); }
    });

    // LOGIN & DAFTAR
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            const usernameOrEmail = document.getElementById('loginEmail')?.value.trim();
            const password = document.getElementById('loginPassword')?.value;
            if (!usernameOrEmail || !password) return alert("Mohon isi data login!");

            btnLogin.innerText = "MEMPROSES...";
            let emailToLogin = usernameOrEmail;

            if (!usernameOrEmail.includes('@')) {
                const { data: profileData } = await supabaseClient.from('profiles').select('email').eq('username', usernameOrEmail).single();
                if (!profileData) { alert("Username tidak ditemukan!"); btnLogin.innerText = "Login"; return; }
                emailToLogin = profileData.email;
            }

            const { error } = await supabaseClient.auth.signInWithPassword({ email: emailToLogin, password: password });
            if (error) { alert("Login Gagal."); btnLogin.innerText = "Login"; } 
            else { alert("Login Berhasil!"); btnLogin.innerText = "Login"; }
        });
    }

    // TABS
    document.querySelectorAll('.deposit-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.deposit-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.deposit-pane').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            const targetId = this.getAttribute('data-target');
            if (targetId) document.getElementById(targetId)?.classList.add('active');
        });
    });

    // FAQ ACCORDION
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function () {
            const answer = this.nextElementSibling;
            const icon = this.querySelector('i');
            if (!answer || !icon) return;
            if (answer.style.maxHeight) {
                answer.style.maxHeight = null;
                icon.classList.replace('fa-minus', 'fa-plus');
            } else {
                document.querySelectorAll('.faq-answer').forEach(ans => ans.style.maxHeight = null);
                document.querySelectorAll('.faq-question i').forEach(ic => ic.classList.replace('fa-minus', 'fa-plus'));
                answer.style.maxHeight = answer.scrollHeight + "px";
                icon.classList.replace('fa-plus', 'fa-minus');
            }
        });
    });

    // HALAMAN DEPOSIT
    window.openDepositView = async function () {
        if (!currentSession) { if(typeof openLoginPanel === 'function') openLoginPanel(); return; }
        document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
        document.getElementById('depositView')?.classList.add('active');
        window.scrollTo(0, 0);

        const formInputArea = document.getElementById('formInputArea');
        const qrisArea = document.getElementById('qrisArea');
        if (formInputArea) formInputArea.style.display = 'block';
        if (qrisArea) qrisArea.style.display = 'none';

        const userId = currentSession.user.id;
        try {
            const { data: profile, error: profileErr } = await supabaseClient.from('profiles').select('*').eq('id', userId).single();
            if (profileErr || !profile) return;

            if (document.getElementById('depositUsername')) document.getElementById('depositUsername').value = profile.username || '-';
            if (document.getElementById('withdrawAccountName')) document.getElementById('withdrawAccountName').value = profile.account_name || '-';

            const bankSelect = document.getElementById('withdrawBankSelect');
            if (bankSelect) {
                bankSelect.innerHTML = '<option value="">- Silahkan pilih -</option>';
                if (profile.bank_name && profile.account_number) {
                    const opt = document.createElement('option');
                    opt.value = profile.bank_name;
                    let maskedAcc = profile.account_number.length > 4 ? '****' + profile.account_number.slice(-4) : profile.account_number;
                    opt.text = `${profile.bank_name} (${maskedAcc}) - ${profile.account_name || ''}`;
                    opt.dataset.bankName = profile.bank_name;
                    opt.dataset.accountNumber = profile.account_number;
                    opt.dataset.accountName = profile.account_name || '';
                    bankSelect.appendChild(opt);
                }
            }

            if (document.getElementById('withdrawBalance')) {
                const saldo = parseFloat(profile.balance) || 0;
                document.getElementById('withdrawBalance').innerText = 'IDR ' + saldo.toLocaleString('id-ID', { minimumFractionDigits: 2 });
            }
        } catch (err) { console.error(err); }
    };

    // QRIS
    const btnShowQris = document.getElementById('btnShowQris');
    if (btnShowQris) {
        btnShowQris.addEventListener('click', async () => {
            const amount = parseInt(document.getElementById('depositAmount')?.value);
            if (!amount || amount < 20000) return alert("Minimal deposit Rp 20.000!");

            btnShowQris.innerText = "MEMPROSES...";
            btnShowQris.disabled = true;

            try {
                const response = await fetch('https://nusa138.wispbyte.app/api/create-qris', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: amount, username: document.getElementById('depositUsername').value })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);

                document.getElementById('qrisImage').src = data.qr_url;
                document.getElementById('qrisNominal').innerText = ": Rp " + amount.toLocaleString('id-ID');
                document.getElementById('btnDownloadQris').href = data.qr_url;
                document.getElementById('formInputArea').style.display = 'none';
                document.getElementById('qrisArea').style.display = 'block';
            } catch (error) {
                alert("Gagal: " + error.message);
            } finally {
                btnShowQris.innerText = "TAMPILKAN QRIS";
                btnShowQris.disabled = false;
            }
        });
    }

    // Kembali QRIS
    if (document.getElementById('btnBackToForm')) {
        document.getElementById('btnBackToForm').addEventListener('click', () => {
            document.getElementById('qrisArea').style.display = 'none';
            document.getElementById('formInputArea').style.display = 'block';
            document.getElementById('depositAmount').value = '';
        });
    }
});