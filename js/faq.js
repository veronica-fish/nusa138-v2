// Logika untuk membuka-tutup FAQ (Accordion)
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', function(e) {
        // Cek apakah yang diklik adalah pertanyaan FAQ atau ikon di dalamnya
        const question = e.target.closest('.faq-question');
        if (!question) return;

        const answer = question.nextElementSibling;
        const icon = question.querySelector('i');
        
        if (!answer || !icon) return;

        // Jika jawaban sedang terbuka, maka tutup
        if (answer.style.maxHeight && answer.style.maxHeight !== '0px') {
            answer.style.maxHeight = '0px'; // Gunakan '0px' bukan null untuk memastikan tertutup
            icon.classList.remove('fa-minus');
            icon.classList.add('fa-plus');
        } else {
            // Tutup semua jawaban lain agar rapi (opsional)
            document.querySelectorAll('.faq-answer').forEach(ans => ans.style.maxHeight = '0px');
            document.querySelectorAll('.faq-question i').forEach(ic => {
                ic.classList.remove('fa-minus');
                ic.classList.add('fa-plus');
            });

            // Buka jawaban yang diklik
            answer.style.maxHeight = answer.scrollHeight + 'px';
            icon.classList.remove('fa-plus');
            icon.classList.add('fa-minus');
        }
    });
});