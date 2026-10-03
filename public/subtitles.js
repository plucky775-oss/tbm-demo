(() => {
  'use strict';
  const panel = document.getElementById('video-subtitles');
  const line = document.getElementById('subtitle-line');
  const toggle = document.getElementById('subtitle-toggle');
  const video = document.getElementById('video');
  if (!panel || !line || !toggle || !video) return;

  const preferenceKey = 'tbm-demo-video-subtitles-enabled';
  let enabled = true;
  try { enabled = localStorage.getItem(preferenceKey) !== 'false'; } catch (_) { /* Storage is optional. */ }
  let currentCue = null;
  let wordNodes = [];

  function clear() {
    currentCue = null;
    wordNodes = [];
    line.replaceChildren();
    line.removeAttribute('aria-label');
  }

  function render() {
    if (!enabled) return;
    const seconds = Math.max(0, Number(video.currentTime) || 0);
    const cues = window.DemoSubtitleData?.['08-safety4cut-example'] || [];
    const cue = cues.find(item => seconds >= item.start && seconds < item.end);
    if (!cue) { if (currentCue) clear(); return; }
    if (currentCue !== cue) {
      clear();
      currentCue = cue;
      line.setAttribute('aria-label', cue.words.map(word => word.text).join(' '));
      wordNodes = cue.words.map((word, index) => {
        if (index) line.append(document.createTextNode(' '));
        const span = document.createElement('span');
        span.className = 'subtitle-word';
        span.textContent = word.text;
        span.setAttribute('aria-hidden', 'true');
        line.append(span);
        return span;
      });
    }
    cue.words.forEach((word, index) => {
      const progress = Math.max(0, Math.min(1, (seconds - word.start) / Math.max(.02, word.end - word.start)));
      wordNodes[index].style.setProperty('--read', `${(progress * 100).toFixed(1)}%`);
    });
  }

  function syncPreference() {
    panel.hidden = !enabled;
    toggle.textContent = enabled ? '자막 ON' : '자막 OFF';
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute('aria-label', enabled ? '자막 끄기' : '자막 켜기');
    render();
  }

  toggle.addEventListener('click', () => {
    enabled = !enabled;
    try { localStorage.setItem(preferenceKey, String(enabled)); } catch (_) { /* Storage is optional. */ }
    syncPreference();
  });
  // The media clock is authoritative, so seeking and restarting stay aligned.
  ['timeupdate', 'seeked', 'loadeddata', 'loadedmetadata', 'pause', 'ended'].forEach(event => {
    video.addEventListener(event, render);
  });
  video.addEventListener('emptied', clear);
  window.DemoSubtitles = { render, clear };
  syncPreference();
})();
