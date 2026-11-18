document.addEventListener('DOMContentLoaded', () => {
    const btnSubmitPengaduan = document.getElementById('btnSubmitPengaduan');
    if (btnSubmitPengaduan) {
        btnSubmitPengaduan.addEventListener('click', function() {
            const username = document.getElementById('pdUsername').value.trim(); const email = document.getElementById('pdEmail').value.trim(); const kategori = document.getElementById('pdKategori').value; const pesan = document.getElementById('pdPesan').value.trim();
            if (!username || !email || !kategori || !pesan) { alert("Mohon lengkapi data!"); return; }
            document.getElementById('modalPengaduan').style.display = 'flex';
            document.getElementById('pdUsername').value = ''; document.getElementById('pdEmail').value = ''; document.getElementById('pdKategori').value = ''; document.getElementById('pdPesan').value = '';
        });
    }
});