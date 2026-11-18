function maskEmail(email) { if (!email) return "-"; const parts = email.split('@'); if (parts.length !== 2) return email; let name = parts[0], domain = parts[1]; if (name.length <= 2) return email; return name.substring(0, 2) + '*'.repeat(name.length - 2) + '@' + domain; }
function maskPhone(phone) { if (!phone) return "-"; if (phone.length <= 4) return phone; return '*'.repeat(phone.length - 3) + phone.slice(-3); }
function generateCaptcha() { const chars = '0123456789'; let captcha = ''; for (let i = 0; i < 4; i++) { captcha += chars.charAt(Math.floor(Math.random() * chars.length)); } generatedCaptcha = captcha; if(document.getElementById('captchaText')) document.getElementById('captchaText').innerText = captcha; }
function openLoginPanel() { document.getElementById('loginPanel').classList.add('active'); }
function closeLoginPanel() { document.getElementById('loginPanel').classList.remove('active'); }
function openRegisterView() { document.getElementById('registerView').style.display = 'block'; document.getElementById('homeView').classList.remove('active'); document.getElementById('navHome').classList.remove('active'); generateCaptcha(); }
function closeRegisterView() { document.getElementById('registerView').style.display = 'none'; document.getElementById('homeView').classList.add('active'); document.getElementById('navHome').classList.add('active'); }
function openProfilePanel() { document.getElementById('profilePanel').classList.add('active'); fetchUserProfile(); }
function closeProfilePanel() { document.getElementById('profilePanel').classList.remove('active'); }
function switchProfileTab(tabName) { document.getElementById('profileTabDetail').classList.remove('active'); document.getElementById('profileTabPassword').classList.remove('active'); document.getElementById('tabBtnDetail').classList.remove('active'); document.getElementById('btnChangePasswordTab').classList.remove('active'); if (tabName === 'detail') { document.getElementById('profileTabDetail').classList.add('active'); document.getElementById('tabBtnDetail').classList.add('active'); } else { document.getElementById('profileTabPassword').classList.add('active'); document.getElementById('btnChangePasswordTab').classList.add('active'); } }
function togglePasswordVisibility(inputId, iconElement) { const input = document.getElementById(inputId); if (input.type === "password") { input.type = "text"; iconElement.classList.remove("fa-eye"); iconElement.classList.add("fa-eye-slash"); } else { input.type = "password"; iconElement.classList.remove("fa-eye-slash"); iconElement.classList.add("fa-eye"); } }
async function fetchUserBalance(user) {
    if (!user) return;
    const { data, error } = await supabaseClient.from('profiles').select('balance').eq('id', user.id).single();
    if (data && !error) {
        let rawBalance = data.balance || 0;
        let formatted = (rawBalance / 1000).toFixed(2); let parts = formatted.split('.'); parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        let finalText = "IDR " + parts.join('.');
        if(document.getElementById('topBalance')) document.getElementById('topBalance').innerText = finalText;
        if(document.getElementById('profileBalance')) document.getElementById('profileBalance').innerText = finalText;
        if(document.getElementById('withdrawBalance')) document.getElementById('withdrawBalance').innerText = finalText;
    }
}
async function fetchUserProfile() { const { data: { user } } = await supabaseClient.auth.getUser(); if (user) { const metadata = user.user_metadata; if(document.getElementById('profUsername')) document.getElementById('profUsername').innerText = metadata.username || '-'; if(document.getElementById('profAccountName')) document.getElementById('profAccountName').innerText = metadata.account_name || '-'; if(document.getElementById('profEmail')) document.getElementById('profEmail').innerText = maskEmail(user.email); if(document.getElementById('profPhone')) document.getElementById('profPhone').innerText = maskPhone(metadata.phone); fetchUserBalance(user); } }
async function logoutUser() { if (confirm("Apakah Anda yakin ingin keluar dari akun?")) { await supabaseClient.auth.signOut(); closeProfilePanel(); } }
function checkAuthState(session) { currentSession = session; const authTabs = document.getElementById('authTabs'); const infoBar = document.getElementById('infoBar'); if (session) { if(authTabs) authTabs.style.display = 'none'; if(infoBar) infoBar.style.display = 'flex'; closeLoginPanel(); closeRegisterView(); fetchUserBalance(session.user); } else { if(authTabs) authTabs.style.display = 'flex'; if(infoBar) infoBar.style.display = 'none'; closeProfilePanel(); } }