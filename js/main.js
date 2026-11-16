// ============================================================
// BAGIAN 0: FUNGSI INTEGRASI GAME SOFTAGGREGATOR
// ============================================================
window.bukaGame = async function(gameCode) {
    if (typeof currentSession === 'undefined' || !currentSession || !currentSession.user) {
        alert("Silakan login terlebih dahulu untuk bermain!");
        if (typeof openLoginPanel === 'function') openLoginPanel();
        return;
    }

    // Ambil username dari metadata Supabase
    const username = currentSession.user.user_metadata.username;
    
    // GANTI URL INI dengan URL Wispbyte Anda
    const BACKEND_URL = 'https://nusa138.wispbyte.app'; 

    if (typeof showLoading === 'function') showLoading();

    try {
        const response = await fetch(`${BACKEND_URL}/api/get-game`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                gameCode: gameCode 
            })
        });

        const data = await response.json();

        if (data.error) {
            alert("Gagal membuka game: " + data.error);
        } else {
            // Set URL game ke dalam iframe
            const iframe = document.getElementById('gameIframe');
            if (iframe) iframe.src = data.url;
            
            // Pindah ke halaman gameView
            if (typeof navigateTo === 'function') {
                navigateTo('/game', false);
            }
        }
    } catch (err) {
        console.error("Error koneksi ke server:", err);
        alert("Koneksi ke server game gagal. Pastikan server Wispbyte menyala.");
    } finally {
        if (typeof hideLoading === 'function') hideLoading();
    }
};

// Fungsi untuk menutup game dan kembali ke Home
window.closeGame = function() {
    const iframe = document.getElementById('gameIframe');
    if (iframe) iframe.src = ''; // Kosongkan iframe agar game berhenti
    
    if (typeof navigateTo === 'function') {
        navigateTo('/home', true);
    }
    
    // Refresh saldo
    if (typeof openDepositView === 'function') openDepositView();
};


// ============================================================
// BAGIAN 1: WITHDRAW & FORMAT ANGKA (ANTI-HACK RPC)
// Diletakkan paling atas agar selalu berfungsi
// ============================================================

// Format angka otomatis (titik ribuan) di input withdraw
document.body.addEventListener('input', function (e) {
    if (e.target.id !== 'withdrawAmount') return;

    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value) {
        e.target.value = parseInt(value, 10).toLocaleString('en-US');
    } else {
        e.target.value = '';
    }

    const errMsg = document.getElementById('withdrawErrorMsg');
    if (errMsg) errMsg.style.display = 'none';
    e.target.style.borderColor = '#555';
});

// Reset border merah & update nama rekening saat bank dipilih
document.body.addEventListener('change', function (e) {
    if (e.target.id !== 'withdrawBankSelect') return;
    e.target.style.borderColor = '#555';
    
    const errMsg = document.getElementById('withdrawErrorMsg');
    if (errMsg) errMsg.style.display = 'none';

    const opt = e.target.options[e.target.selectedIndex];
    const nameEl = document.getElementById('withdrawAccountName');
    if (nameEl && opt && opt.dataset.accountName) {
        nameEl.value = opt.dataset.accountName;
    }
});

// Handler klik tombol Withdraw (Verifikasi Saldo di Server)
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
            payload: {
                amount: amount,
                bank_name: bankName,
                account_number: accountNumber,
                account_name: accountName
            }
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
            
            // Panggil ulang untuk update saldo
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
// BAGIAN 2: LOGIKA UI LAINNYA
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    
    if (typeof generateCaptcha === 'function') {
        generateCaptcha();
    }
    if (typeof supabaseClient === 'undefined') {
        console.error('❌ supabaseClient tidak terdefinisi! Cek config.js');
        return;
    }

    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (typeof checkAuthState === 'function') checkAuthState(session);
        if (typeof handleRouting === 'function') handleRouting();
    });

    supabaseClient.auth.onAuthStateChange((_event, session) => {
        if (typeof checkAuthState === 'function') checkAuthState(session);
    });

    // --- Ikon Profil di Header ---
    const headerUserBtn = document.getElementById('headerUserBtn');
    if (headerUserBtn) {
        headerUserBtn.addEventListener('click', () => {
            if (currentSession) openProfilePanel();
            else openLoginPanel();
        });
    }

    // ==========================================
    // FUNGSI ROUTING & LOADING (DIPERBAIKI)
    // ==========================================
    const routes = {
        '/home': 'homeView',
        '/': 'homeView',
        '/promo': 'promoView',
        '/memo': 'memoView',
        '/deposit': 'depositView',
        '/about': 'aboutView',
        '/banking': 'bankingView',
        '/game': 'gameView' // <--- RUTE GAME DITAMBAHKAN
    };

    window.showLoading = function () {
        const el = document.getElementById('loadingOverlay');
        if (el) el.classList.add('active');
    };

    window.hideLoading = function () {
        const el = document.getElementById('loadingOverlay');
        if (el) el.classList.remove('active');
    };

    window.navigateTo = function (path, pushState = true) {
        showLoading();

        setTimeout(() => {
            document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));

            let targetViewId = routes[path];
            if (!targetViewId) {
                targetViewId = 'homeView';
                path = '/home';
            }

            if (!currentSession && targetViewId !== 'homeView') {
                hideLoading();
                if (typeof openLoginPanel === 'function') openLoginPanel();
                return;
            }

            const targetView = document.getElementById(targetViewId);
            if (targetView) {
                targetView.classList.add('active');
                window.scrollTo(0, 0);
                
                // Sembunyikan bottom nav jika masuk ke game
                const bottomNav = document.querySelector('.bottom-nav');
                if (targetViewId === 'gameView') {
                    if (bottomNav) bottomNav.style.display = 'none';
                } else {
                    if (bottomNav) bottomNav.style.display = 'flex';
                }
            }

            if (targetViewId === 'depositView') {
                if (typeof openDepositView === 'function') {
                    openDepositView(); 
                }
            }

            if (pushState) {
                history.pushState({ path: path }, '', path);
            }

            updateNavActiveState(targetViewId);
            hideLoading();
        }, 300);
    };

    function updateNavActiveState(viewId) {
        document.querySelectorAll('.bottom-nav .nav-item').forEach(n => n.classList.remove('active'));
        if (viewId === 'homeView') document.getElementById('navHome')?.classList.add('active');
        if (viewId === 'promoView') document.getElementById('navPromo')?.classList.add('active');
        if (viewId === 'memoView') document.getElementById('navMemo')?.classList.add('active');
        if (viewId === 'depositView') document.getElementById('danaBtn')?.classList.add('active');
    }

    window.handleRouting = function () {
        const path = window.location.pathname;
        navigateTo(path, false);
    };

    window.addEventListener('popstate', () => {
        handleRouting();
    });

    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-link]');
        if (link) {
            e.preventDefault();
            const path = link.getAttribute('href');
            navigateTo(path, true);
        }
    });

    // ==========================================
    // FORM DAFTAR
    // ==========================================
    const btnRegister = document.getElementById('btnRegister');
    if (btnRegister) {
        btnRegister.addEventListener('click', async () => {
            const username = document.getElementById('regUsername')?.value.trim();
            const password = document.getElementById('regPassword')?.value;
            const confirmPassword = document.getElementById('regConfirmPassword')?.value;
            const email = document.getElementById('regEmail')?.value.trim();
            const phone = document.getElementById('regPhone')?.value.trim();
            const accountName = document.getElementById('regAccountName')?.value.trim();
            const bankName = document.getElementById('regBankName')?.value;
            const accountNumber = document.getElementById('regAccountNumber')?.value.trim();
            const termsChecked = document.getElementById('regTerms')?.checked;
            const captchaInput = document.getElementById('regCaptchaInput')?.value.trim();

            if (!username || !password || !email || !phone || !accountName || !bankName || !accountNumber || !captchaInput) { alert("Mohon isi semua kolom yang wajib!"); return; }
            if (!/^[a-zA-Z0-9]+$/.test(username)) { alert("Nama pengguna tidak boleh mengandung simbol! Hanya huruf dan angka."); return; }
            if (password.length < 8) { alert("Kata sandi minimal harus 8 karakter!"); return; }
            if (password !== confirmPassword) { alert("Konfirmasi kata sandi tidak cocok!"); return; }
            if (!/^[a-zA-Z\s]+$/.test(accountName)) { alert("Nama Sesuai Rekening tidak boleh mengandung angka atau simbol!"); return; }
            if (!termsChecked) { alert("Anda harus menyetujui Syarat & Ketentuan!"); return; }
            if (captchaInput !== generatedCaptcha) { alert("Kode Captcha salah! Silakan coba lagi."); generateCaptcha(); document.getElementById('regCaptchaInput').value = ''; return; }

            btnRegister.innerText = "MEMPROSES...";
            const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                email: email, password: password,
                options: { data: { username, phone, bank_name: bankName, account_number: accountNumber, account_name: accountName } }
            });

            if (authError) { alert("Gagal Daftar: " + authError.message); }
            else { alert("Pendaftaran Berhasil! Silakan Login."); closeRegisterView(); openLoginPanel(); }
            btnRegister.innerText = "Submit";
        });
    }

    // ==========================================
    // FORM LOGIN
    // ==========================================
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            const usernameOrEmail = document.getElementById('loginEmail')?.value.trim();
            const password = document.getElementById('loginPassword')?.value;
            if (!usernameOrEmail || !password) { alert("Mohon isi nama pengguna/email dan password!"); return; }

            btnLogin.innerText = "MEMPROSES...";
            let emailToLogin = usernameOrEmail;

            if (!usernameOrEmail.includes('@')) {
                const { data: profileData, error: profileError } = await supabaseClient.from('profiles').select('email').eq('username', usernameOrEmail).single();
                if (profileError || !profileData) { alert("Nama pengguna tidak ditemukan!"); btnLogin.innerText = "Login"; return; }
                emailToLogin = profileData.email;
            }

            const { data, error } = await supabaseClient.auth.signInWithPassword({ email: emailToLogin, password: password });
            if (error) { alert("Login Gagal: Email/Username atau Password salah."); btnLogin.innerText = "Login"; }
            else { alert("Login Berhasil! Selamat datang."); btnLogin.innerText = "Login"; }
        });
    }

    // ==========================================
    // UBAH PASSWORD
    // ==========================================
    const btnChangePassword = document.getElementById('btnChangePassword');
    if (btnChangePassword) {
        btnChangePassword.addEventListener('click', async () => {
            const newPassword = document.getElementById('newPassword')?.value;
            const confirmNewPassword = document.getElementById('confirmNewPassword')?.value;
            if (!newPassword || !confirmNewPassword) { alert("Mohon isi semua kolom kata sandi baru!"); return; }
            if (newPassword.length < 8) { alert("Kata sandi baru minimal harus 8 karakter!"); return; }
            if (newPassword !== confirmNewPassword) { alert("Konfirmasi kata sandi baru tidak cocok!"); return; }

            btnChangePassword.innerText = "MEMPROSES...";
            const { data, error } = await supabaseClient.auth.updateUser({ password: newPassword });
            if (error) { alert("Gagal mengubah kata sandi: " + error.message); }
            else {
                alert("Kata sandi berhasil diubah!");
                const currEl = document.getElementById('currentPassword');
                const newEl = document.getElementById('newPassword');
                const confEl = document.getElementById('confirmNewPassword');
                if (currEl) currEl.value = '';
                if (newEl) newEl.value = '';
                if (confEl) confEl.value = '';
                if (typeof switchProfileTab === 'function') switchProfileTab('detail');
            }
            btnChangePassword.innerText = "Simpan Perubahan";
        });
    }

    // ==========================================
    // TABS PROMO & MEMO
    // ==========================================
    document.querySelectorAll('.promo-tab').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.promo-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.promo-content .tab-pane').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            const target = document.getElementById(this.getAttribute('data-target'));
            if (target) target.classList.add('active');
        });
    });

    document.querySelectorAll('.memo-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.memo-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.memo-content .tab-pane').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            const target = document.getElementById(this.getAttribute('data-target'));
            if (target) target.classList.add('active');
        });
    });

    // ==========================================
    // TABS DEPOSIT / WITHDRAW / HISTORY
    // ==========================================
    document.querySelectorAll('.deposit-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.deposit-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.deposit-pane').forEach(p => p.classList.remove('active'));
            this.classList.add('active');

            const targetId = this.getAttribute('data-target');
            const targetPane = targetId ? document.getElementById(targetId) : null;
            if (targetPane) targetPane.classList.add('active');
        });
    });

    // ==========================================
    // REFRESH SALDO
    // ==========================================
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.style.transform = 'rotate(360deg)';
            refreshBtn.style.transition = 'transform 0.4s ease';
            setTimeout(() => {
                refreshBtn.style.transform = 'rotate(0deg)';
                refreshBtn.style.transition = 'none';
            }, 400);
            if (typeof openDepositView === 'function') openDepositView();
        });
    }

    // ==========================================
    // BANNER SLIDER
    // ==========================================
    const track = document.getElementById('bannerTrack');
    const dots = document.querySelectorAll('.dot');
    if (track) {
        let currentIndex = 0;
        const totalSlides = 3;
        let autoSlideInterval;
        function goToSlide(index) {
            currentIndex = index;
            track.style.transform = `translateX(${currentIndex * -33.3333}%)`;
            dots.forEach(dot => dot.classList.remove('active'));
            if (dots[currentIndex]) dots[currentIndex].classList.add('active');
        }
        function startAutoSlide() {
            clearInterval(autoSlideInterval);
            autoSlideInterval = setInterval(() => { goToSlide((currentIndex + 1) % totalSlides); }, 5000);
        }
        startAutoSlide();
    }

    // ==========================================
    // LIVE TRANSAKSI
    // ==========================================
    const transTrack = document.getElementById('transTrack');
    const transDots = document.querySelectorAll('.t-dot');
    if (transTrack) {
        let transIndex = 0;
        let transInterval;
        const totalTransCards = 4;
        const totalPages = 3;

        function formatRupiah(amount) {
            let formatted = (amount / 1000).toFixed(2);
            let parts = formatted.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            return "IDR " + parts.join('.');
        }
        function generateRandomData() {
            const prefixes = ['DEW', 'SIG', 'ABD', 'BUD', 'AGU', 'RIN', 'JOK', 'BAM', 'SUP', 'ADI', 'DEN', 'PUT', 'WAY', 'KOM'];
            const maskedName = prefixes[Math.floor(Math.random() * prefixes.length)] + '*'.repeat(Math.floor(Math.random() * 7) + 4);
            let amountK;
            const rand = Math.random();
            if (rand < 0.8) amountK = Math.floor(Math.random() * 451) + 50;
            else { if (Math.random() > 0.5) amountK = Math.floor(Math.random() * 40) + 10; else amountK = Math.floor(Math.random() * 9500) + 501; }
            const type = Math.random() > 0.5 ? 'DEPOSIT' : 'WITHDRAW';
            const now = new Date();
            now.setMinutes(now.getMinutes() - Math.floor(Math.random() * 60));
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
        populateCards();
        startTransSlider();
    }

    // ==========================================
    // FAQ ACCORDION
    // ==========================================
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function () {
            const answer = this.nextElementSibling;
            const icon = this.querySelector('i');
            if (!answer || !icon) return;

            if (answer.style.maxHeight) {
                answer.style.maxHeight = null;
                icon.classList.remove('fa-minus');
                icon.classList.add('fa-plus');
            } else {
                document.querySelectorAll('.faq-answer').forEach(ans => ans.style.maxHeight = null);
                document.querySelectorAll('.faq-question i').forEach(ic => {
                    ic.classList.remove('fa-minus');
                    ic.classList.add('fa-plus');
                });
                answer.style.maxHeight = answer.scrollHeight + "px";
                icon.classList.remove('fa-plus');
                icon.classList.add('fa-minus');
            }
        });
    });

    // ==========================================
    // HALAMAN DEPOSIT & QRIS (SINKRONISASI DATABASE)
    // ==========================================
    window.openDepositView = async function () {
        if (!currentSession) { openLoginPanel(); return; }

        document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
        const depositViewEl = document.getElementById('depositView');
        if (depositViewEl) depositViewEl.classList.add('active');

        const danaPopup = document.getElementById('danaPopup');
        if (danaPopup) danaPopup.classList.remove('active');
        window.scrollTo(0, 0);

        const formInputArea = document.getElementById('formInputArea');
        const qrisArea = document.getElementById('qrisArea');
        if (formInputArea) formInputArea.style.display = 'block';
        if (qrisArea) qrisArea.style.display = 'none';

        if (!currentSession || !currentSession.user) return;

        const userId = currentSession.user.id;

        try {
            const { data: profile, error: profileErr } = await supabaseClient
                .from('profiles')
                .select('username, email, account_name, bank_name, account_number, balance')
                .eq('id', userId)
                .single();

            if (profileErr || !profile) {
                console.error('❌ Gagal ambil profil:', profileErr);
                return;
            }

            const depositUsernameEl = document.getElementById('depositUsername');
            if (depositUsernameEl) depositUsernameEl.value = profile.username || '-';

            const withdrawAccountNameEl = document.getElementById('withdrawAccountName');
            if (withdrawAccountNameEl) withdrawAccountNameEl.value = profile.account_name || '-';

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
                } else {
                    const opt = document.createElement('option');
                    opt.text = '⚠️ Belum ada rekening terdaftar';
                    opt.disabled = true;
                    bankSelect.appendChild(opt);
                }
            }

            const withdrawBalanceEl = document.getElementById('withdrawBalance');
            if (withdrawBalanceEl) {
                const saldo = parseFloat(profile.balance) || 0;
                withdrawBalanceEl.innerText = 'IDR ' + saldo.toLocaleString('id-ID', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }

        } catch (err) {
            console.error('❌ Error openDepositView:', err);
        }
    };

    // Tombol Tampilkan QRIS
    const btnShowQris = document.getElementById('btnShowQris');
    if (btnShowQris) {
        btnShowQris.addEventListener('click', async () => {
            const amountInput = document.getElementById('depositAmount');
            const amount = amountInput ? parseInt(amountInput.value) : NaN;
            if (!amount || amount < 20000) { alert("Minimal deposit adalah Rp 20.000!"); return; }

            btnShowQris.innerText = "MEMPROSES...";
            btnShowQris.disabled = true;

            try {
                const BACKEND_URL = 'https://nusa138.wispbyte.app/api/create-qris';
                const depositUsernameEl = document.getElementById('depositUsername');

                const response = await fetch(BACKEND_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: amount,
                        username: depositUsernameEl ? depositUsernameEl.value : ''
                    })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Gagal membuat QRIS');

                const qrisImage = document.getElementById('qrisImage');
                const qrisNominal = document.getElementById('qrisNominal');
                const btnDownloadQris = document.getElementById('btnDownloadQris');
                if (qrisImage) qrisImage.src = data.qr_url;
                if (qrisNominal) qrisNominal.innerText = ": Rp " + amount.toLocaleString('id-ID');
                if (btnDownloadQris) btnDownloadQris.href = data.qr_url;

                const formInputArea = document.getElementById('formInputArea');
                const qrisArea = document.getElementById('qrisArea');
                if (formInputArea) formInputArea.style.display = 'none';
                if (qrisArea) qrisArea.style.display = 'block';

            } catch (error) {
                alert("Gagal menampilkan QRIS: " + error.message);
            } finally {
                btnShowQris.innerText = "TAMPILKAN QRIS";
                btnShowQris.disabled = false;
            }
        });
    }

    // Tombol Kembali dari QRIS
    const btnBackToForm = document.getElementById('btnBackToForm');
    if (btnBackToForm) {
        btnBackToForm.addEventListener('click', () => {
            const qrisArea = document.getElementById('qrisArea');
            const formInputArea = document.getElementById('formInputArea');
            const depositAmountEl = document.getElementById('depositAmount');
            if (qrisArea) qrisArea.style.display = 'none';
            if (formInputArea) formInputArea.style.display = 'block';
            if (depositAmountEl) depositAmountEl.value = '';
        });
    }

});