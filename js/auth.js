// --- FUNGSI MASKING (SENSOR DATA) ---
function maskEmail(email) {
    if (!email) return "-";
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    let name = parts[0], domain = parts[1];
    if (name.length <= 2) return email;
    return name.substring(0, 2) + '*'.repeat(name.length - 2) + '@' + domain;
}
function maskPhone(phone) {
    if (!phone) return "-";
    if (phone.length <= 4) return phone;
    return '*'.repeat(phone.length - 3) + phone.slice(-3);
}

function generateCaptcha() {
    const chars = '0123456789';
    let captcha = '';
    for (let i = 0; i < 4; i++) { captcha += chars.charAt(Math.floor(Math.random() * chars.length)); }
    generatedCaptcha = captcha;
    if(document.getElementById('captchaText')) document.getElementById('captchaText').innerText = captcha;
}

function openLoginPanel() { document.getElementById('loginPanel').classList.add('active'); }
function closeLoginPanel() { document.getElementById('loginPanel').classList.remove('active'); }

function openRegisterView() {
    document.getElementById('registerView').style.display = 'block';
    document.getElementById('homeView').classList.remove('active');
    document.getElementById('navHome').classList.remove('active');
    generateCaptcha(); 
}
function closeRegisterView() {
    document.getElementById('registerView').style.display = 'none';
    document.getElementById('homeView').classList.add('active');
    document.getElementById('navHome').classList.add('active');
}

function openProfilePanel() {
    document.getElementById('profilePanel').classList.add('active');
    fetchUserProfile();
}
function closeProfilePanel() { document.getElementById('profilePanel').classList.remove('active'); }

function switchProfileTab(tabName) {
    document.getElementById('profileTabDetail').classList.remove('active');
    document.getElementById('profileTabPassword').classList.remove('active');
    document.getElementById('tabBtnDetail').classList.remove('active');
    document.getElementById('tabBtnPassword').classList.remove('active');

    if (tabName === 'detail') {
        document.getElementById('profileTabDetail').classList.add('active');
        document.getElementById('tabBtnDetail').classList.add('active');
    } else {
        document.getElementById('profileTabPassword').classList.add('active');
        document.getElementById('tabBtnPassword').classList.add('active');
    }
}

function togglePasswordVisibility(inputId, iconElement) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        iconElement.classList.remove("fa-eye"); iconElement.classList.add("fa-eye-slash");
    } else {
        input.type = "password";
        iconElement.classList.remove("fa-eye-slash"); iconElement.classList.add("fa-eye");
    }
}

function switchAccountType(type) {
    const btnBank = document.getElementById('btnTypeBank');
    const btnEwallet = document.getElementById('btnTypeEwallet');
    const iconBank = document.getElementById('iconBank');
    const iconEwallet = document.getElementById('iconEwallet');
    const labelBankName = document.getElementById('labelBankName');
    const labelAccountNo = document.getElementById('labelAccountNo');
    const selectBank = document.getElementById('regBankName');
    const hintAccountNo = document.getElementById('hintAccountNo');

    btnBank.classList.remove('active'); btnEwallet.classList.remove('active');
    iconBank.style.display = 'none'; iconEwallet.style.display = 'none';
    selectBank.innerHTML = '<option value="">- Silahkan pilih -</option>';

    if (type === 'bank') {
        btnBank.classList.add('active'); iconBank.style.display = 'inline-block';
        labelBankName.innerText = 'Bank'; labelAccountNo.innerText = 'No. Rekening Bank';
        hintAccountNo.innerText = '* Pastikan rekening anda Valid, Aktif, dan belum terdaftar di situs ini';
        ['BCA', 'BRI', 'BNI', 'MANDIRI'].forEach(bank => {
            let option = document.createElement('option'); option.value = bank; option.text = bank; selectBank.appendChild(option);
        });
    } else {
        btnEwallet.classList.add('active'); iconEwallet.style.display = 'inline-block';
        labelBankName.innerText = 'E-wallet'; labelAccountNo.innerText = 'No. E-Wallet';
        hintAccountNo.innerText = '* Silakan isi nomor E-Wallet dengan menggunakan 0 * contoh: 08213456789 * Pastikan rekening anda Valid, Aktif, dan belum terdaftar di situs ini';
        ['DANA', 'GOPAY', 'OVO', 'LINKAJA'].forEach(ewallet => {
            let option = document.createElement('option'); option.value = ewallet; option.text = ewallet; selectBank.appendChild(option);
        });
    }
}

async function fetchUserProfile() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        const metadata = user.user_metadata;
        document.getElementById('profUsername').innerText = metadata.username || '-';
        document.getElementById('profAccountName').innerText = metadata.account_name || '-';
        document.getElementById('profEmail').innerText = maskEmail(user.email);
        document.getElementById('profPhone').innerText = maskPhone(metadata.phone);
        document.getElementById('profileBalance').innerText = document.getElementById('topBalance').innerText;
    }
}

async function logoutUser() {
    if (confirm("Apakah Anda yakin ingin keluar dari akun?")) {
        await supabaseClient.auth.signOut();
        closeProfilePanel();
    }
}

function checkAuthState(session) {
    currentSession = session;
    const authTabs = document.getElementById('authTabs');
    const infoBar = document.getElementById('infoBar');

    if (session) {
        if(authTabs) authTabs.style.display = 'none'; 
        if(infoBar) infoBar.style.display = 'flex'; 
        closeLoginPanel();
        closeRegisterView();
    } else {
        if(authTabs) authTabs.style.display = 'flex'; 
        if(infoBar) infoBar.style.display = 'none'; 
        closeProfilePanel();
    }
          }
