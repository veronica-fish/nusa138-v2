document.addEventListener('DOMContentLoaded', () => {
    generateCaptcha();
    supabaseClient.auth.getSession().then(({ data: { session } }) => { checkAuthState(session); });
    supabaseClient.auth.onAuthStateChange((_event, session) => { checkAuthState(session); });

    // Ikon Profil di Header
    const headerUserBtn = document.getElementById('headerUserBtn');
    if (headerUserBtn) {
        headerUserBtn.addEventListener('click', () => {
            if (currentSession) openProfilePanel();
            else openLoginPanel();
        });
    }

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

    // --- NAVIGASI BAWAH ---
    const navHome = document.getElementById('navHome');
    const navPromo = document.getElementById('navPromo');
    const navMemo = document.getElementById('navMemo');
    const danaBtn = document.getElementById('danaBtn');
    const danaPopup = document.getElementById('danaPopup');
    const homeView = document.getElementById('homeView');
    const promoView = document.getElementById('promoView');
    const memoView = document.getElementById('memoView');

    function switchView(targetView, targetNav) {
        if (!currentSession && targetView !== homeView) { openLoginPanel(); return; }
        homeView.classList.remove('active'); promoView.classList.remove('active'); memoView.classList.remove('active');
        document.querySelectorAll('.bottom-nav .nav-item').forEach(n => n.classList.remove('active'));
        targetView.classList.add('active'); targetNav.classList.add('active');
    }

    if(navHome) navHome.addEventListener('click', (e) => { e.preventDefault(); closeRegisterView(); switchView(homeView, navHome); });
    if(navPromo) navPromo.addEventListener('click', (e) => { e.preventDefault(); switchView(promoView, navPromo); });
    if(navMemo) navMemo.addEventListener('click', (e) => { e.preventDefault(); switchView(memoView, navMemo); });
    if(navLiveChat) navLiveChat.addEventListener('click', (e) => { e.preventDefault(); /* Logika Live Chat */ });

    if (danaBtn && danaPopup) {
        danaBtn.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            if (!currentSession) { openLoginPanel(); return; }
            danaPopup.classList.toggle('active');
        });
        document.addEventListener('click', function(e) { if (!danaBtn.contains(e.target)) danaPopup.classList.remove('active'); });
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
});
