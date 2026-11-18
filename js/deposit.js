document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.deposit-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            if (this.classList.contains('active')) return; if (typeof showLoading === 'function') showLoading();
            const targetId = this.getAttribute('data-target');
            setTimeout(() => {
                document.querySelectorAll('.deposit-tab').forEach(t => t.classList.remove('active')); document.querySelectorAll('.deposit-pane').forEach(p => p.classList.remove('active'));
                this.classList.add('active'); document.getElementById(targetId)?.classList.add('active');
                if (targetId === 'transHistory') window.loadTransactionHistory();
                if (typeof hideLoading === 'function') hideLoading();
            }, 500);
        });
    });
    window.loadTransactionHistory = async function() {
        const container = document.getElementById('transactionListContainer'); if (!container) return;
        if (!currentSession || !currentSession.user) { container.innerHTML = '<p style="text-align: center; color: #aaa;">Silakan login.</p>'; return; }
        container.innerHTML = '<p style="text-align: center; color: #aaa;">Memuat riwayat...</p>';
        try {
            const { data: transactions, error } = await supabaseClient.from('transactions').select('*').eq('user_id', currentSession.user.id).in('type', ['DEPOSIT', 'WITHDRAW']).order('created_at', { ascending: false }).limit(5);
            if (error) throw error;
            if (!transactions || transactions.length === 0) { container.innerHTML = '<p style="text-align: center; color: #aaa;">Belum ada riwayat.</p>'; return; }
            container.innerHTML = ''; 
            transactions.forEach(tx => {
                let color = tx.type === 'DEPOSIT' ? '#4ade80' : '#f87171'; let sign = tx.type === 'DEPOSIT' ? '+' : '-';
                const dateStr = new Date(tx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                const item = document.createElement('div'); item.style.cssText = "background: #1f1f1f; border: 1px solid #333; border-radius: 8px; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;";
                item.innerHTML = `<div><div style="color: #fff; font-weight: bold; font-size: 14px;">${tx.type}</div><div style="color: #888; font-size: 11px;">${dateStr}</div></div><div style="text-align: right;"><div style="color: ${color}; font-weight: bold; font-size: 15px;">${sign} Rp ${parseInt(tx.amount).toLocaleString('id-ID')}</div><div style="color: #888; font-size: 11px;">Status: ${tx.status || 'SUCCESS'}</div></div>`;
                container.appendChild(item);
            });
        } catch (err) { container.innerHTML = '<p style="text-align: center; color: #ff3333;">Gagal memuat riwayat.</p>'; }
    };
    document.body.addEventListener('input', function (e) { if (e.target.id !== 'withdrawAmount') return; let value = e.target.value.replace(/[^0-9]/g, ''); if (value) { e.target.value = parseInt(value, 10).toLocaleString('en-US'); } else { e.target.value = ''; } document.getElementById('withdrawErrorMsg').style.display = 'none'; e.target.style.borderColor = '#555'; });
    document.body.addEventListener('click', async function (e) {
        const btn = e.target.closest('#btnWithdraw'); if (!btn) return; e.preventDefault();
        if (!currentSession || !currentSession.user) return alert('Silakan login.');
        const amount = parseInt(document.getElementById('withdrawAmount').value.replace(/[.,\s]/g, ''), 10); const bankSelect = document.getElementById('withdrawBankSelect'); const errorMsg = document.getElementById('withdrawErrorMsg');
        if (!amount || isNaN(amount) || amount < 50000) { errorMsg.textContent = 'Minimal Rp 50.000'; errorMsg.style.display = 'block'; return; }
        if (!bankSelect.value) { errorMsg.textContent = 'Pilih bank!'; errorMsg.style.display = 'block'; return; }
        const opt = bankSelect.options[bankSelect.selectedIndex]; btn.disabled = true; btn.innerText = 'MEMPROSES...';
        try { const { data: isSuccess, error } = await supabaseClient.rpc('request_withdraw', { payload: { amount: amount, bank_name: opt.dataset.bankName, account_number: opt.dataset.accountNumber, account_name: opt.dataset.accountName } }); if (error) throw new Error(error.message); if (!isSuccess) { errorMsg.textContent = 'Saldo tidak cukup!'; errorMsg.style.display = 'block'; } else { alert(`✅ Penarikan Rp ${amount.toLocaleString('id-ID')} berhasil!`); document.getElementById('withdrawAmount').value = ''; if (typeof window.openDepositView === 'function') window.openDepositView(); } } catch (err) { errorMsg.textContent = 'Error: ' + err.message; errorMsg.style.display = 'block'; } finally { btn.innerText = 'Withdraw'; btn.disabled = false; }
    });
    const btnShowQris = document.getElementById('btnShowQris');
    if (btnShowQris) { btnShowQris.addEventListener('click', async () => { const amount = parseInt(document.getElementById('depositAmount').value); if (!amount || amount < 20000) return alert("Minimal Rp 20.000!"); btnShowQris.innerText = "MEMPROSES..."; btnShowQris.disabled = true; try { const res = await fetch('https://nusa138.wispbyte.app/api/create-qris', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, username: document.getElementById('depositUsername').value }) }); const data = await res.json(); if (!res.ok) throw new Error(data.message); document.getElementById('qrisImage').src = data.qr_url; document.getElementById('qrisNominal').innerText = ": Rp " + amount.toLocaleString('id-ID'); document.getElementById('btnDownloadQris').href = data.qr_url; document.getElementById('formInputArea').style.display = 'none'; document.getElementById('qrisArea').style.display = 'block'; } catch (error) { alert("Gagal: " + error.message); } finally { btnShowQris.innerText = "TAMPILKAN QRIS"; btnShowQris.disabled = false; } }); }
});