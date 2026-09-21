/**
 * "On this page" links (guide 11.15). Built from the h2 / h3 headings of a content page.
 * Hidden when the page has fewer than two headings.
 */
document.querySelectorAll('[data-toc]').forEach((toc) => {
  const article = toc.closest('.kpage');
  const content = article && article.querySelector('[data-page-content]');
  const list = toc.querySelector('[data-toc-list]');
  if (!content || !list) return;

  const headings = Array.from(content.querySelectorAll('h2, h3'));
  if (headings.length < 2) return;

  const used = new Set();
  headings.forEach((heading) => {
    let id = heading.id || heading.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
    while (used.has(id)) id += '-2';
    used.add(id);
    heading.id = id;

    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${id}`;
    link.textContent = heading.textContent;
    if (heading.tagName === 'H3') link.style.paddingLeft = '1.2rem';
    item.appendChild(link);
    list.appendChild(item);
  });

  toc.hidden = false;
});
