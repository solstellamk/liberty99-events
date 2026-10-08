/* Liberty99 cinematic intro – dependency-free, reusable drop-in. */
(function () {
  'use strict';
  const defaults = { posterUrl: 'assets/liberty99-night-city.webp', rememberSession: true, autoPlay: true, duration: 4800, sound: false };
  const storageKey = 'liberty99_entertainment_intro_seen_pink_v3';
  let config = { ...defaults };
  let root = null;
  let finishTimer = null;
  let cleanupTimer = null;
  let frame = null;
  let particles = [];
  let playing = false;
  let audioOn = false;
  let audioContext = null;
  let onFinish = () => {};

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasSeen = () => { try { return window.sessionStorage.getItem(storageKey) === '1'; } catch { return false; } };
  const remember = () => { try { window.sessionStorage.setItem(storageKey, '1'); } catch {} };

  function create() {
    if (root) return;
    root = document.createElement('div');
    root.id = 'l99i-intro';
    root.className = 'l99i-root';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Liberty99 Entertainment Hub introduction');
    root.innerHTML = `
      <div class="l99i-background" aria-hidden="true"></div>
      <div class="l99i-art" aria-hidden="true"></div>
      <div class="l99i-grid" aria-hidden="true"></div>
      <div class="l99i-vignette" aria-hidden="true"></div>
      <div class="l99i-beam" aria-hidden="true"></div>
      <div class="l99i-bloom" aria-hidden="true"></div>
      <div class="l99i-noise" aria-hidden="true"></div>
      <canvas class="l99i-particles" aria-hidden="true"></canvas>
      <div class="l99i-intro-veil" aria-hidden="true"></div>
      <div class="l99i-topnote">LIBERTY99</div>
      <div class="l99i-stage" aria-hidden="true">
        <div class="l99i-mark">L99</div>
        <div class="l99i-wordmark">
          <div class="l99i-main-title">LIBERTY<em>99</em></div>
          <div class="l99i-subtitle">ENTERTAINMENT HUB</div>
        </div>
        <div class="l99i-accent-rule"></div>
        <div class="l99i-creator">Made by <strong>David</strong><span class="l99i-creator-dot" aria-hidden="true">·</span>Discord <b>@davidkekw0</b></div>
      </div>
      <div class="l99i-meta">EVENTS <b>·</b> PARTIES <b>·</b> LOCATIONS</div>
      <div class="l99i-controls">
        <button class="l99i-sound" type="button" aria-label="Enable cinematic sound" aria-pressed="false"><span class="l99i-sound-icon">♪</span><span class="l99i-sound-label">Sound off</span></button>
        <button class="l99i-skip" type="button">Skip intro <span aria-hidden="true">↗</span></button>
      </div>
      <div class="l99i-progress"><span></span></div>
    `;
    document.body.appendChild(root);
    root.querySelector('.l99i-skip').addEventListener('click', finish);
    root.querySelector('.l99i-sound').addEventListener('click', toggleSound);
    const art = root.querySelector('.l99i-art');
    art.style.backgroundImage = 'url("' + config.posterUrl.replaceAll('"', '%22') + '")';
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && playing) finish(); });
  }

  function toggleSound() {
    audioOn = !audioOn;
    const button = root.querySelector('.l99i-sound');
    button.setAttribute('aria-pressed', String(audioOn));
    button.setAttribute('aria-label', audioOn ? 'Disable cinematic sound' : 'Enable cinematic sound');
    root.querySelector('.l99i-sound-label').textContent = audioOn ? 'Sound on' : 'Sound off';
    if (audioOn && playing) playAudio();
    if (!audioOn && audioContext) { audioContext.close().catch(() => {}); audioContext = null; }
  }

  function playAudio() {
    if (!audioOn) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (audioContext) audioContext.close().catch(() => {});
      audioContext = new Ctx();
      const start = audioContext.currentTime;
      const master = audioContext.createGain();
      master.gain.value = 0.32;
      master.connect(audioContext.destination);
      const tone = (freq, wave, begin, length, gain, endFreq) => {
        const osc = audioContext.createOscillator();
        const envelope = audioContext.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(freq, start + begin);
        if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + begin + length);
        envelope.gain.setValueAtTime(0.0001, start + begin);
        envelope.gain.exponentialRampToValueAtTime(gain, start + begin + Math.min(0.3, length * 0.3));
        envelope.gain.exponentialRampToValueAtTime(0.0001, start + begin + length);
        osc.connect(envelope); envelope.connect(master);
        osc.start(start + begin); osc.stop(start + begin + length + 0.02);
      };
      tone(52, 'sine', 0, 3.6, 0.55, 44);
      tone(72, 'triangle', 0.6, 2.6, 0.16, 53);
      tone(220, 'sine', 1.55, 2.5, 0.07, 440);
      tone(329.6, 'sine', 2.1, 2.5, 0.13, 329.6);
      tone(493.9, 'sine', 2.4, 1.8, 0.1, 493.9);
      tone(659.25, 'sine', 2.55, 2.4, 0.075, 659.25);
    } catch { /* Audio is optional; visual intro still works. */ }
  }

  function resizeCanvas() {
    if (!root || !playing) return;
    const canvas = root.querySelector('canvas');
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: window.innerWidth < 700 ? 35 : 95 }, () => ({
      phase: Math.random() * Math.PI * 2,
      radius: 0.25 + Math.random() * 0.33,
      speed: (0.13 + Math.random() * 0.29) * (Math.random() > 0.5 ? 1 : -1),
      size: 0.55 + Math.random() * 1.7,
      drift: Math.random() * 2 - 1,
      opacity: 0.3 + Math.random() * 0.7
    }));
  }

  function particleLoop(startTime) {
    const canvas = root?.querySelector('canvas');
    if (!canvas || !playing) return;
    const ctx = canvas.getContext('2d');
    const w = window.innerWidth, h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    const time = (performance.now() - startTime) / 1000;
    const visibility = Math.min(1, Math.max(0, (time - 0.95) * 0.8)) * Math.min(1, Math.max(0, (config.duration / 1000 - time) / 0.9));
    if (visibility > 0) {
      ctx.globalCompositeOperation = 'screen';
      for (const p of particles) {
        const angle = p.phase + time * p.speed;
        const r = p.radius * Math.min(w, h);
        const x = w * 0.5 + Math.cos(angle) * r * 1.65;
        const y = h * 0.49 + Math.sin(angle) * r * 0.47 + Math.sin(time + p.phase) * p.drift * 22;
        const alpha = visibility * p.opacity * (0.6 + Math.sin(time * 2 + p.phase) * 0.3);
        ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${70 + Math.floor(p.opacity * 45)},${146 + Math.floor(p.opacity * 33)},${alpha * 0.75})`;
        ctx.shadowBlur = 15; ctx.shadowColor = 'rgba(255,79,163,.6)'; ctx.fill();
      }
      ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
    }
    frame = requestAnimationFrame(() => particleLoop(startTime));
  }

  function stopEffects() {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
    window.removeEventListener('resize', resizeCanvas);
    if (audioContext) { audioContext.close().catch(() => {}); audioContext = null; }
  }

  function finish() {
    if (!root || !playing) return;
    playing = false;
    remember();
    clearTimeout(finishTimer);
    root.classList.add('l99i-leaving');
    document.body.classList.remove('l99i-locked');
    stopEffects();
    onFinish();
    cleanupTimer = setTimeout(() => {
      if (playing || !root) return;
      root.hidden = true;
      root.classList.remove('l99i-playing', 'l99i-leaving');
    }, 820);
  }

  function play(force = false) {
    create();
    if (playing) return;
    if (!force && config.rememberSession && hasSeen()) { onFinish(); return; }
    if (!force && reducedMotion()) { remember(); onFinish(); return; }
    clearTimeout(cleanupTimer); clearTimeout(finishTimer); stopEffects();
    root.hidden = false;
    root.classList.remove('l99i-playing', 'l99i-leaving');
    void root.offsetWidth; // Restart CSS timeline on replay.
    document.body.classList.add('l99i-locked');
    root.classList.add('l99i-playing');
    playing = true;
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    frame = requestAnimationFrame(() => particleLoop(performance.now()));
    if (audioOn) playAudio();
    root.querySelector('.l99i-skip').focus({ preventScroll: true });
    finishTimer = setTimeout(finish, config.duration);
  }

  function init(options = {}) {
    config = { ...defaults, ...options };
    onFinish = typeof options.onFinish === 'function' ? options.onFinish : () => {};
    audioOn = Boolean(config.sound);
    if (!document.body) { document.addEventListener('DOMContentLoaded', () => init(options), { once: true }); return; }
    create();
    root.querySelector('.l99i-art').style.backgroundImage = 'url("' + config.posterUrl.replaceAll('"', '%22') + '")';
    if (config.autoPlay) play(false);
  }

  window.Liberty99Intro = { init, play, skip: finish, resetSession() { try { sessionStorage.removeItem(storageKey); } catch {} } };
})();
