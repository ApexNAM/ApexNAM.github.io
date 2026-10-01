document.querySelectorAll('[data-post-browser]').forEach(browser => {
  const buttons = browser.querySelectorAll('[data-view]');
  const collection = browser.querySelector('[data-post-collection]');
  const storageKey = browser.dataset.storageKey || 'skago-post-view';
  const apply = view => {
    collection.dataset.layout = view;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  };
  let saved;
  try { saved = localStorage.getItem(storageKey); } catch {}
  apply(saved === 'list' || saved === 'gallery' ? saved : (browser.dataset.defaultView || 'gallery'));
  buttons.forEach(button => button.addEventListener('click', () => {
    apply(button.dataset.view);
    try { localStorage.setItem(storageKey, button.dataset.view); } catch {}
  }));
});
document.querySelectorAll('.navBar__menu a').forEach(link => {
  if (location.pathname.startsWith(new URL(link.href).pathname)) link.setAttribute('aria-current', 'page');
  link.addEventListener('pointermove', event => {
    const box = link.getBoundingClientRect();
    link.style.setProperty('--glow-x', (event.clientX - box.left) + 'px');
    link.style.setProperty('--glow-y', (event.clientY - box.top) + 'px');
  });
});

document.querySelectorAll('.navBar__logo a').forEach(logo => {
  logo.addEventListener('pointerdown', () => logo.classList.add('logo-touched'));
  const release = () => logo.classList.remove('logo-touched');
  logo.addEventListener('pointerup', release);
  logo.addEventListener('pointercancel', release);
  logo.addEventListener('pointerleave', release);
});

// The three brand colors stay the same; their emphasis follows Korean local time.
let themeTimer;
const updateTimeTheme = () => {
  clearTimeout(themeTimer);
  const hour = Number(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul', hour: '2-digit', hourCycle: 'h23'
  }).format(new Date()));
  const theme = hour >= 6 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'afternoon' : 'night';
  if (document.documentElement.dataset.timeTheme !== theme) {
    document.documentElement.dataset.timeTheme = theme;
    document.dispatchEvent(new CustomEvent('skago-themechange', { detail: theme }));
  }
  if (!document.hidden) themeTimer = setTimeout(updateTimeTheme, 60000 - Date.now() % 60000);
};
document.addEventListener('visibilitychange', updateTimeTheme);
updateTimeTheme();
