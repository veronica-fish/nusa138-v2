document.addEventListener('DOMContentLoaded', () => {
    generateCaptcha();
    
    // Inisialisasi Sesi Supabase
    supabaseClient.auth.getSession().then(({ data: { session } }) => { 
        checkAuthState(session); 
        handleRouting(); // Panggil routing setelah cek sesi
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
        // 1. Tampilkan Efek Loading
        showLoading();

        // 2. Tunggu sebentar agar efek loading terlihat (misal 300ms)
        setTimeout(() => {
            // 3. Sembunyikan semua view
            document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));

            // 4. Tentukan view yang akan ditampilkan berdasarkan URL
            let targetViewId = routes[path];
            
            // Jika route tidak ditemukan, default ke home
            if (!targetViewId) {
                targetViewId = 'homeView';
                path = '/home';
            }

            // Proteksi: Jika belum login dan mencoba akses halaman selain home
            if (!currentSession && targetViewId !== 'homeView') {
                hideLoading();
                openLoginPanel(); // Munculkan login
                return;
            }

            // 5. Tampilkan view yang dituju
            const targetView = document.getElementById(targetViewId);
            if (targetView) {
                targetView.classList.add('active');
                window.scrollTo(0, 0);
            }

            // 6. Ubah URL di browser (tanpa reload)
            if (pushState) {
                history.pushState({ path: path }, '', path);
            }

            // 7. Update status aktif di navigasi bawah
            updateNavActiveState(targetViewId);

            // 8. Sembunyikan Efek Loading
            hideLoading();
        }, 300); // Delay 300ms
    };

    // Fungsi untuk mengupdate class 'active' di navigasi bawah
    function updateNavActiveState(viewId) {
        document.querySelectorAll('.bottom-nav .nav-item').forEach(n => n.classList.remove('active'));
        
        if (viewId === 'homeView') document.getElementById('navHome')?.classList.add('active');
        if (viewId === 'promoView') document.getElementById('navPromo')?.classList.add('active');
        if (viewId === 'memoView') document.getElementById('navMemo')?.classList.add('active');
        if (viewId === 'depositView') document.getElementById('danaBtn')?.classList.add('active');
    }

    // Fungsi untuk membaca URL saat ini dan menampilkan halaman yang tepat
    window.handleRouting = function() {
        const path = window.location.pathname;
        navigateTo(path, false); // false = jangan push state lagi
    };

    // Tangani tombol Back/Forward browser
    window.addEventListener('popstate', () => {
        handleRouting();
    });

    // Tangkap klik pada semua link yang memiliki atribut `data-link`
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
            // ... (Logika validasi dan pendaftaran Supabase tetap sama) ...
            // SALIN KODE VALIDASI DARI JAWABAN SEBELUMNYA
        });
    }

    // --- FORM LOGIN ---
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            // ... (Logika login Supabase tetap sama) ...
            // SALIN KODE LOGIN DARI JAWABAN SEBELUMNYA
        });
    }

    // --- UBAH PASSWORD ---
    const btnChangePassword = document.getElementById('btnChangePassword');
    if (btnChangePassword) {
        btnChangePassword.addEventListener('click', async () => {
            // ... (Logika ubah password tetap sama) ...
            // SALIN KODE UBAH PASSWORD DARI JAWABAN SEBELUMNYA
        });
    }

    // --- LOGIKA TABS PROMO & MEMO ---
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
    
    // Buka Halaman Deposit via Router
    window.openDepositView = function() {
        navigateTo('/deposit');
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
                // ========================================================
                // PENTING: GANTI URL DI BAWAH DENGAN URL BACKEND WISPBYPE ANDA
                // ========================================================
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

                // Tampilkan data QRIS
                document.getElementById('qrisImage').src = data.qr_url;
                document.getElementById('qrisNominal').innerText = ": Rp " + amount.toLocaleString('id-ID');
                document.getElementById('btnDownloadQris').href = data.qr_url;

                // TRIK UTAMA: Tukar tampilan (Form hilang, QRIS muncul)
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

    // Tombol Kembali ke Form (Jika ingin deposit lagi)
    const btnBackToForm = document.getElementById('btnBackToForm');
    if (btnBackToForm) {
        btnBackToForm.addEventListener('click', () => {
            document.getElementById('qrisArea').style.display = 'none';
            document.getElementById('formInputArea').style.display = 'block';
            document.getElementById('depositAmount').value = ''; 
        });
    }
});