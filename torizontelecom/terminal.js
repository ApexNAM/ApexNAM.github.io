const feed = document.querySelector('.terminal-feed');
if (feed) {
  const lines = [...feed.querySelectorAll('p')].slice(0, 8).map(line => line.textContent);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let timer, lineIndex = 0, character = 0, activeLine;
  const type = () => {
    if (document.hidden || reduced.matches) return;
    if (!activeLine) {
      activeLine = document.createElement('p');
      activeLine.className = 'is-typing';
      feed.append(activeLine);
      while (feed.children.length > 16) feed.firstElementChild.remove();
      character = 0;
    }
    const text = lines[lineIndex];
    activeLine.textContent = text.slice(0, ++character);
    if (character >= text.length) {
      activeLine.classList.remove('is-typing');
      activeLine = null;
      lineIndex = (lineIndex + 1) % lines.length;
      timer = setTimeout(type, 550);
    } else {
      timer = setTimeout(type, 45);
    }
  };
  const restart = () => {
    clearTimeout(timer);
    if (reduced.matches) {
      feed.replaceChildren(...lines.map(text => {
        const line = document.createElement('p');
        line.textContent = text;
        return line;
      }));
      activeLine = null;
    } else if (!document.hidden) {
      timer = setTimeout(type, 250);
    }
  };
  feed.replaceChildren();
  document.addEventListener('visibilitychange', restart);
  reduced.addEventListener('change', restart);
  restart();
}
