(() => {
  const root = document.querySelector('.markdown-body');
  if (!root) return;
  let supplied = {};
  try { supplied = JSON.parse(document.getElementById('link-preview-data')?.textContent || '{}'); } catch {}
  const cache = new Map();
  const safeUrl = (value, base = location.href) => {
    try {
      const url = new URL(value, base);
      return /^https?:$/.test(url.protocol) ? url : null;
    } catch { return null; }
  };
  const metadata = url => {
    if (cache.has(url.href)) return cache.get(url.href);
    const promise = (async () => {
      if (url.origin !== location.origin) return supplied[url.href] || {};
      try {
        const response = await fetch(url.pathname + url.search, { signal: AbortSignal.timeout(5000) });
        if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) return {};
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        const meta = name => doc.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.content;
        return {
          title: meta('og:title') || doc.title,
          description: meta('og:description') || meta('description'),
          image: meta('og:image') || doc.querySelector('.markdown-body img')?.getAttribute('src')
        };
      } catch { return {}; }
    })();
    cache.set(url.href, promise);
    return promise;
  };
  const text = (tag, className, value) => {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = value;
    return node;
  };
  const queue = [];
  root.querySelectorAll('p').forEach(paragraph => {
    if (paragraph.closest('blockquote, li, table, .callout')) return;
    const children = Array.from(paragraph.childNodes).filter(node =>
      node.nodeType === Node.ELEMENT_NODE || node.textContent.trim());
    if (children.length !== 1) return;
    let link = children[0];
    if (link.nodeType === Node.TEXT_NODE && /^https?:\/\/\S+$/.test(link.textContent.trim())) {
      const anchor = document.createElement('a');
      anchor.href = link.textContent.trim();
      anchor.textContent = link.textContent.trim();
      link.replaceWith(anchor);
      link = anchor;
    }
    if (link.nodeName !== 'A') return;
    if (link.querySelector('img') || link.classList.contains('footnote')) return;
    const rawHref = link.getAttribute('href');
    if (!rawHref || rawHref.startsWith('#')) return;
    const url = safeUrl(rawHref);
    if (!url || /\.(?:png|jpe?g|gif|webp|svg|pdf|zip|mp[34])$/i.test(url.pathname)) return;
    queue.push(async () => {
      const info = await metadata(url);
      const card = link.cloneNode(false);
      card.className = 'link-preview';
      const copy = document.createElement('span');
      copy.className = 'link-preview__copy';
      copy.append(text('span', 'link-preview__site', url.hostname.replace(/^www\./, '')));
      copy.append(text('strong', 'link-preview__title', info.title || link.textContent.trim() || url.hostname));
      if (info.description) copy.append(text('span', 'link-preview__description', info.description));
      copy.append(text('span', 'link-preview__url', url.pathname === '/' ? url.hostname : url.hostname + url.pathname));
      card.append(copy);
      const imageUrl = info.image && safeUrl(info.image, url.href);
      if (imageUrl) {
        const image = document.createElement('img');
        image.className = 'link-preview__image';
        image.src = imageUrl.href;
        image.alt = '';
        image.loading = 'lazy';
        image.addEventListener('error', () => image.remove(), { once: true });
        card.append(image);
      } else {
        const icon = text('span', 'link-preview__icon', '↗');
        icon.setAttribute('aria-hidden', 'true');
        card.append(icon);
      }
      paragraph.classList.add('link-preview-wrap');
      link.replaceWith(card);
    });
  });
  // Limit simultaneous same-site metadata requests in long posts.
  const worker = async () => { while (queue.length) await queue.shift()(); };
  Promise.all(Array.from({ length: Math.min(3, queue.length) }, worker));
})();
