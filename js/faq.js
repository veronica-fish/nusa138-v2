document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function () {
            const answer = this.nextElementSibling; const icon = this.querySelector('i'); if (!answer || !icon) return;
            if (answer.style.maxHeight && answer.style.maxHeight !== '0px') { answer.style.maxHeight = null; icon.classList.replace('fa-minus', 'fa-plus'); } 
            else { document.querySelectorAll('.faq-answer').forEach(ans => ans.style.maxHeight = null); document.querySelectorAll('.faq-question i').forEach(ic => ic.classList.replace('fa-minus', 'fa-plus')); answer.style.maxHeight = answer.scrollHeight + "px"; icon.classList.replace('fa-plus', 'fa-minus'); }
        });
    });
});