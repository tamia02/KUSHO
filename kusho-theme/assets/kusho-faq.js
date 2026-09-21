/** FAQ search: filters the questions as you type (guide 11.13). */
document.querySelectorAll('[data-faq-search]').forEach((input) => {
  const root = input.closest('.kfaqs__main');
  const items = Array.from(root.querySelectorAll('.kacc'));
  const none = root.querySelector('[data-faq-none]');
  input.addEventListener('input', () => {
    const term = input.value.trim().toLowerCase();
    let shown = 0;
    items.forEach((item) => {
      const match = !term || item.textContent.toLowerCase().includes(term);
      item.hidden = !match;
      if (match) shown += 1;
    });
    if (none) none.hidden = shown > 0;
  });
});
