document.addEventListener('DOMContentLoaded', () => {
    generateCaptcha();
    
    supabaseClient.auth.getSession().then(({ data: { session } }) => { 
        checkAuthState(session); 
        handleRouting(); 
    });
    supabaseClient.auth.onAuthStateChange((_event, session) => { 
        checkAuthState(session); 
    });

    // Ikon Profil di Header
    const headerUserBtn = document.getElementById('headerUserBtn');
    if (headerUserBtn) {
        headerUserBtn.addEventListener('click', () => {
            if (currentSession) openProfilePanel();
            else openLoginPanel();
        });
    }

    // ==========================================
    // FUNGSI ROUTING & LOADING
    // ==========================================
    
    const routes = {
        '/home': 'homeView',
        '/': 'homeView',
        '/promo': 'promoView',
        '/memo': 'memoView',
        '/deposit': 'depositView',
        '/about': 'aboutView',
        '/banking': 'bankingView'
    };

    window.showLoading = function() {
        document.getElementById('loadingOverlay').classList.add('active');
    };

    window.hideLoading = function() {
        document.getElementById('loadingOverlay').classList.remove('active');
    };

    window.navigateTo = function(path, pushState = true) {
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
                openLoginPanel(); 
                return;
            }

            const targetView = document.getElementById(targetViewId);
            if (targetView) {
                targetView.classList.add('active');
                window.scrollTo(0, 0);
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

    window.handleRouting = function() {
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
    // LOGIKA UI LAINNYA
    // ==========================================

    // --- FORM DAFTAR ---
    const btnRegister = document.getElementById('btnRegister');
    if (btnRegister) {
        btnRegister.addEventListener('click', async () => {
            const username = document.getElementById('regUsername').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            const email = document.getElementById('regEmail').value.trim();
            const phone = document.getElementById('regPhone').value.trim();
            const accountName = document.getElementById('regAccountName').value.trim();
            const bankName = document.getElementById('regBankName').value;
            const accountNumber = document.getElementById('regAccountNumber').value.trim();
            const termsChecked = document.getElementById('regTerms').checked;
            const captchaInput = document.getElementById('regCaptchaInput').value.trim();

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

    // --- FORM LOGIN ---
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            const usernameOrEmail = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
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

    // --- UBAH PASSWORD ---
    const btnChangePassword = document.getElementById('btnChangePassword');
    if (btnChangePassword) {
        btnChangePassword.addEventListener('click', async () => {
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;
            if (!newPassword || !confirmNewPassword) { alert("Mohon isi semua kolom kata sandi baru!"); return; }
            if (newPassword.length < 8) { alert("Kata sandi baru minimal harus 8 karakter!"); return; }
            if (newPassword !== confirmNewPassword) { alert("Konfirmasi kata sandi baru tidak cocok!"); return; }

            btnChangePassword.innerText = "MEMPROSES...";
            const { data, error } = await supabaseClient.auth.updateUser({ password: newPassword });
            if (error) { alert("Gagal mengubah kata sandi: " + error.message); } 
            else { alert("Kata sandi berhasil diubah!"); document.getElementById('currentPassword').value = ''; document.getElementById('newPassword').value = ''; document.getElementById('confirmNewPassword').value = ''; switchProfileTab('detail'); }
            btnChangePassword.innerText = "Simpan Perubahan";
        });
    }

    // --- TABS PROMO & MEMO ---
    document.querySelectorAll('.promo-tab').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.promo-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.promo-content .tab-pane').forEach(p => p.classList.remove('active'));
            this.classList.add('active'); document.getElementById(this.getAttribute('data-target')).classList.add('active');
        });
    });

    document.querySelectorAll('.memo-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.memo-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.memo-content .tab-pane').forEach(p => p.classList.remove('active'));
            this.classList.add('active'); document.getElementById(this.getAttribute('data-target')).classList.add('active');
        });
    });

    // --- TABS HALAMAN DEPOSIT / WITHDRAW / HISTORY (TAMBAHAN BARU) ---
    document.querySelectorAll('.deposit-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.deposit-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.deposit-pane').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            const targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- REFRESH SALDO ---
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.style.transform = 'rotate(360deg)'; refreshBtn.style.transition = 'transform 0.4s ease';
            setTimeout(() => { refreshBtn.style.transform = 'rotate(0deg)'; refreshBtn.style.transition = 'none'; }, 400);
        });
    }

    // --- BANNER SLIDER ---
    const track = document.getElementById('bannerTrack');
    const dots = document.querySelectorAll('.dot');
    if (track) {
        let currentIndex = 0; const totalSlides = 3; let autoSlideInterval;
        function goToSlide(index) {
            currentIndex = index; track.style.transform = `translateX(${currentIndex * -33.3333}%)`;
            dots.forEach(dot => dot.classList.remove('active')); if(dots[currentIndex]) dots[currentIndex].classList.add('active');
        }
        function startAutoSlide() { clearInterval(autoSlideInterval); autoSlideInterval = setInterval(() => { goToSlide((currentIndex + 1) % totalSlides); }, 5000); }
        startAutoSlide();
    }

    // --- LIVE TRANSAKSI ---
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
                document.getElementById(`name${i}`).innerText = data.name;
                document.getElementById(`amount${i}`).innerText = data.amount;
                document.getElementById(`type${i}`).innerText = data.date;
            }
        }
        function goToTransSlide(index) {
            transTrack.style.transform = `translateX(calc(-${index * 50}% - ${index * 6}px))`;
            transDots.forEach(dot => dot.classList.remove('active')); if(transDots[index]) transDots[index].classList.add('active');
        }
        function startTransSlider() {
            clearInterval(transInterval);
            transInterval = setInterval(() => { transIndex++; if (transIndex >= totalPages) { transIndex = 0; populateCards(); } goToTransSlide(transIndex); }, 4000); 
        }
        populateCards(); startTransSlider();
    }

    // --- LOGIKA FAQ ACCORDION ---
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const icon = this.querySelector('i');
            
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
    // LOGIKA HALAMAN DEPOSIT & KASERAPAY
    // ==========================================
    
    window.openDepositView = function() {
        if (!currentSession) { openLoginPanel(); return; }
        
        document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
        document.getElementById('depositView').classList.add('active');
        
        const danaPopup = document.getElementById('danaPopup');
        if(danaPopup) danaPopup.classList.remove('active'); 
        window.scrollTo(0, 0); 

        document.getElementById('formInputArea').style.display = 'block';
        document.getElementById('qrisArea').style.display = 'none';

        if (currentSession && currentSession.user) {
            const metadata = currentSession.user.user_metadata;
            
            let usernameTeks = metadata.username || currentSession.user.email.split('@')[0] || "-";
            document.getElementById('depositUsername').value = usernameTeks;

            let accName = metadata.account_name || "-";
            document.getElementById('withdrawAccountName').value = accName;

            const bankSelect = document.getElementById('withdrawBankSelect');
            bankSelect.innerHTML = '<option value="">- Silahkan pilih -</option>';
            if (metadata.bank_name && metadata.account_number) {
                let opt = document.createElement('option');
                opt.value = metadata.bank_name;
                let maskedAcc = metadata.account_number.length > 4 ? '****' + metadata.account_number.slice(-4) : metadata.account_number;
                opt.text = `${metadata.bank_name} (${maskedAcc})`;
                bankSelect.appendChild(opt);
            }
        }
    };

    // Tombol Tampilkan QRIS
    const btnShowQris = document.getElementById('btnShowQris');
    if (btnShowQris) {
        btnShowQris.addEventListener('click', async () => {
            const amount = parseInt(document.getElementById('depositAmount').value);
            if (!amount || amount < 20000) { alert("Minimal deposit adalah Rp 20.000!"); return; }

            btnShowQris.innerText = "MEMPROSES...";
            btnShowQris.disabled = true;

            try {
                const BACKEND_URL = 'https://nusa138.wispbyte.app/api/create-qris'; 

                const response = await fetch(BACKEND_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        amount: amount, 
                        username: document.getElementById('depositUsername').value 
                    })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Gagal membuat QRIS');

                document.getElementById('qrisImage').src = data.qr_url;
                document.getElementById('qrisNominal').innerText = ": Rp " + amount.toLocaleString('id-ID');
                document.getElementById('btnDownloadQris').href = data.qr_url;

                document.getElementById('formInputArea').style.display = 'none';
                document.getElementById('qrisArea').style.display = 'block';

            } catch (error) {
                alert("Gagal menampilkan QRIS: " + error.message);
            } finally {
                btnShowQris.innerText = "TAMPILKAN QRIS";
                btnShowQris.disabled = false;
            }
        });
    }

    const btnBackToForm = document.getElementById('btnBackToForm');
    if (btnBackToForm) {
        btnBackToForm.addEventListener('click', () => {
            document.getElementById('qrisArea').style.display = 'none';
            document.getElementById('formInputArea').style.display = 'block';
            document.getElementById('depositAmount').value = ''; 
        });
    }

    // --- FORMAT ANGKA OTOMATIS (Koma) DI INPUT WITHDRAW ---
    const withdrawInput = document.getElementById('withdrawAmount');
    if (withdrawInput) {
        withdrawInput.addEventListener('input', function(e) {
            let value = this.value.replace(/[^0-9]/g, '');
            if (value) {
                this.value = parseInt(value, 10).toLocaleString('en-US');
            } else {
                this.value = '';
            }
        });
    }

    // --- LOGIKA TOMBOL WITHDRAW & VALIDASI MINIMAL ---
    const btnWithdraw = document.getElementById('btnWithdraw');
    const withdrawErrorMsg = document.getElementById('withdrawErrorMsg');
    const withdrawAmountInput = document.getElementById('withdrawAmount');

    if (btnWithdraw) {
        btnWithdraw.addEventListener('click', () => {
            const amountStr = withdrawAmountInput.value.replace(/,/g, '');
            const amount = parseInt(amountStr);
            const bank = document.getElementById('withdrawBankSelect').value;

            withdrawErrorMsg.style.display = 'none';
            withdrawAmountInput.style.borderColor = '#555'; 

            // Validasi Minimal Rp 50.000
            if (!amount || amount < 50000) {
                withdrawErrorMsg.style.display = 'block';
                withdrawAmountInput.style.borderColor = '#ff3333'; 
                return;
            }

            if (!bank) {
                alert("Silakan pilih akun bank yang terdaftar!");
                return;
            }

            alert(`Permintaan penarikan sebesar Rp ${amount.toLocaleString('id-ID')} sedang diproses.`);
            withdrawAmountInput.value = '';
        });
    }

    if (withdrawAmountInput) {
        withdrawAmountInput.addEventListener('input', () => {
            withdrawErrorMsg.style.display = 'none';
            withdrawAmountInput.style.borderColor = '#555';
        });
    }
});