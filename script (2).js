document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // FUNGSI FORMAT MATA UANG (Aturan Custom)
    // Rp10.000 -> IDR 10.00
    // Rp100.000 -> IDR 100.00
    // Rp1.000.000 -> IDR 1.000.00
    // ==========================================
    function formatRupiah(amount) {
        // Bagi 1000 sesuai logika Anda
        let divided = amount / 1000;
        // Format ke 2 desimal
        let formatted = divided.toFixed(2);
        // Pisahkan angka bulat dan desimal
        let parts = formatted.split('.');
        // Tambahkan titik sebagai pemisah ribuan pada angka bulat
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        // Gabungkan kembali
        return "IDR " + parts.join('.');
    }
    
    // --- 1. Logika Navigasi Bawah & Pindah Halaman ---
    const navHome = document.getElementById('navHome');
    const navPromo = document.getElementById('navPromo');
    const navMemo = document.getElementById('navMemo');
    
    const homeView = document.getElementById('homeView');
    const promoView = document.getElementById('promoView');
    const memoView = document.getElementById('memoView');
    
    function switchView(targetView, targetNav) {
        homeView.style.display = 'none';
        promoView.classList.remove('active');
        memoView.classList.remove('active');
        
        navHome.classList.remove('active');
        navPromo.classList.remove('active');
        navMemo.classList.remove('active');
        
        if (targetView === homeView) {
            homeView.style.display = 'block';
        } else {
            targetView.classList.add('active');
        }
        targetNav.classList.add('active');
    }
    
    if (navHome && navPromo && navMemo) {
        navHome.addEventListener('click', function(e) {
            e.preventDefault();
            switchView(homeView, navHome);
        });
        
        navPromo.addEventListener('click', function(e) {
            e.preventDefault();
            switchView(promoView, navPromo);
        });
        
        navMemo.addEventListener('click', function(e) {
            e.preventDefault();
            switchView(memoView, navMemo);
        });
    }
    
    // --- 2. Logika Tab Halaman Promo ---
    const promoBtns = document.querySelectorAll('.promo-tab');
    const tabPanes = document.querySelectorAll('.promo-content .tab-pane');
    
    promoBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            promoBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            
            const targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
    
    // --- 3. Logika Tab Halaman MEMO ---
    const memoTabs = document.querySelectorAll('.memo-tab');
    const memoTabPanes = document.querySelectorAll('.memo-content .tab-pane');
    
    memoTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            memoTabs.forEach(t => t.classList.remove('active'));
            memoTabPanes.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            
            const targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
    
    // --- 4. Logika Popup Menu DANA ---
    const danaBtn = document.getElementById('danaBtn');
    const danaPopup = document.getElementById('danaPopup');
    
    if (danaBtn && danaPopup) {
        danaBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            danaPopup.classList.toggle('active');
        });
        
        document.addEventListener('click', function(e) {
            if (!danaBtn.contains(e.target)) {
                danaPopup.classList.remove('active');
            }
        });
    }
    
    // --- 5. Logika Refresh Saldo ---
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.style.transform = 'rotate(360deg)';
            refreshBtn.style.transition = 'transform 0.4s ease';
            setTimeout(() => {
                refreshBtn.style.transform = 'rotate(0deg)';
                refreshBtn.style.transition = 'none';
            }, 400);
        });
    }
    
    // --- 6. Logika Banner Slider ---
    const track = document.getElementById('bannerTrack');
    const dots = document.querySelectorAll('.dot');
    
    if (track) {
        let currentIndex = 0;
        const totalSlides = 3;
        let startX = 0;
        let currentTranslate = 0;
        let isDragging = false;
        let autoSlideInterval;
        
        function goToSlide(index) {
            currentIndex = index;
            currentTranslate = currentIndex * -33.3333;
            track.style.transition = 'transform 0.4s ease-in-out';
            track.style.transform = `translateX(${currentTranslate}%)`;
            
            dots.forEach(dot => dot.classList.remove('active'));
            if (dots[currentIndex]) dots[currentIndex].classList.add('active');
        }
        
        function startAutoSlide() {
            clearInterval(autoSlideInterval);
            autoSlideInterval = setInterval(() => {
                let nextIndex = (currentIndex + 1) % totalSlides;
                goToSlide(nextIndex);
            }, 5000);
        }
        
        function stopAutoSlide() { clearInterval(autoSlideInterval); }
        
        function getPositionX(event) {
            return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
        }
        
        function dragStart(event) {
            isDragging = true;
            startX = getPositionX(event);
            stopAutoSlide();
            track.style.transition = 'none';
        }
        
        function dragMove(event) {
            if (!isDragging) return;
            if (event.cancelable) event.preventDefault();
            const currentX = getPositionX(event);
            const diff = currentX - startX;
            const movePercent = (diff / track.clientWidth) * 100;
            track.style.transform = `translateX(${currentTranslate + movePercent}%)`;
        }
        
        function dragEnd(event) {
            if (!isDragging) return;
            isDragging = false;
            
            const endX = event.type.includes('mouse') ? event.pageX : (event.changedTouches ? event.changedTouches[0].clientX : startX);
            const diff = endX - startX;
            
            if (diff < -50) { currentIndex = (currentIndex + 1) % totalSlides; }
            else if (diff > 50) { currentIndex = (currentIndex - 1 + totalSlides) % totalSlides; }
            
            goToSlide(currentIndex);
            startAutoSlide();
        }
        
        track.addEventListener('touchstart', dragStart, { passive: true });
        track.addEventListener('touchmove', dragMove, { passive: false });
        track.addEventListener('touchend', dragEnd);
        track.addEventListener('mousedown', dragStart);
        track.addEventListener('mousemove', dragMove);
        track.addEventListener('mouseup', dragEnd);
        track.addEventListener('mouseleave', dragEnd);
        
        startAutoSlide();
    }
    
    // --- 7. Logika Live Transaksi ---
    const transTrack = document.getElementById('transTrack');
    const transDots = document.querySelectorAll('.t-dot');
    
    if (transTrack) {
        let transIndex = 0;
        let transInterval;
        const totalTransCards = 4;
        const totalPages = 3;
        
        function generateRandomData() {
            const prefixes = ['DEW', 'SIG', 'ABD', 'BUD', 'AGU', 'RIN', 'JOK', 'BAM', 'SUP', 'ADI', 'DEN', 'PUT', 'WAY', 'KOM'];
            const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            const starCount = Math.floor(Math.random() * 7) + 4;
            const maskedName = randomPrefix + '*'.repeat(starCount);
            
            // Generate angka dasar dalam ribuan (misal 50 berarti 50.000)
            let amountK;
            const rand = Math.random();
            if (rand < 0.8) {
                amountK = Math.floor(Math.random() * 451) + 50; // 50K - 500K
            } else {
                if (Math.random() > 0.5) { amountK = Math.floor(Math.random() * 40) + 10; } // 10K - 49K
                else { amountK = Math.floor(Math.random() * 9500) + 501; } // 501K - 10000K
            }
            
            // Konversi ke angka asli (dikali 1000) lalu diformat
            const formattedAmount = formatRupiah(amountK * 1000);
            
            const type = Math.random() > 0.5 ? 'DEPOSIT' : 'WITHDRAW';
            
            const now = new Date();
            now.setMinutes(now.getMinutes() - Math.floor(Math.random() * 60));
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const hh = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            const formattedDate = `${type}, ${yyyy}-${mm}-${dd} ${hh}:${min}`;
            
            return { name: maskedName, amount: formattedAmount, date: formattedDate };
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
            transDots.forEach(dot => dot.classList.remove('active'));
            if (transDots[index]) transDots[index].classList.add('active');
        }
        
        function startTransSlider() {
            clearInterval(transInterval);
            transInterval = setInterval(() => {
                transIndex++;
                if (transIndex >= totalPages) {
                    transIndex = 0;
                    populateCards();
                }
                goToTransSlide(transIndex);
            }, 4000);
        }
        
        populateCards();
        startTransSlider();
    }
});