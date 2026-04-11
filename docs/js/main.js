// Always start from the top on refresh
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

/* ─────────────────────────────────────────────────────
   CIRCULAR FAVICON
───────────────────────────────────────────────────── */
(function () {
  const img = new Image();
  img.src = 'assets/img/WhatsApp Image 2026-04-11 at 00.39.56.jpeg';
  img.onload = function () {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0, size, size);
    const link = document.querySelector("link[rel='icon']") || document.createElement('link');
    link.rel = 'icon';
    link.href = canvas.toDataURL('image/png');
    document.head.appendChild(link);
  };
})();

/* ─────────────────────────────────────────────────────
   THEME SWITCHER
───────────────────────────────────────────────────── */
const savedTheme = localStorage.getItem('bday-theme') || 'pink';
applyTheme(savedTheme);

document.querySelectorAll('.theme-btn').forEach((btn) => {
  btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('bday-theme', theme);
  document.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
  if (window._particles) window._particles.recolor();
}

/* ─────────────────────────────────────────────────────
   PARTICLE SYSTEM  (hearts & stars, canvas-based)
───────────────────────────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, blossoms = [], snowflakes = [], leaves = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  /* ── Cherry blossom petals (pink theme only) ── */
  const BLOSSOM_COUNT  = 60;
  // Vivid sakura pinks — clearly visible against the light pink background
  const BLOSSOM_COLORS = ['#E91E8C', '#F06292', '#EC407A', '#FF4081', '#AD1457', '#D81B60'];

  function makeBlossom() {
    return {
      x:          Math.random() * W,
      y:          Math.random() * H - H,
      sz:         Math.random() * 14 + 9,        // 9–23 px per petal spoke
      color:      BLOSSOM_COLORS[Math.floor(Math.random() * BLOSSOM_COLORS.length)],
      vy:         Math.random() * 0.85 + 0.35,
      vx:         (Math.random() - 0.5) * 0.55,
      swing:      Math.random() * Math.PI * 2,
      swingSpeed: Math.random() * 0.022 + 0.008,
      swingAmp:   Math.random() * 2.0 + 1.0,
      op:         Math.random() * 0.25 + 0.05,   // 0.25–0.30
      rot:        Math.random() * 360,
      drot:       (Math.random() - 0.5) * 1.4,
    };
  }

  function drawBlossom(p) {
    const s = p.sz;
    ctx.save();
    ctx.globalAlpha = p.op;
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rot * Math.PI) / 180);
    // Five petals radiating from center
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.rotate((i / 5) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo( s * 0.45, -s * 0.20,  s * 0.45, -s * 0.85, 0, -s);
      ctx.bezierCurveTo(-s * 0.45, -s * 0.85, -s * 0.45, -s * 0.20, 0,  0);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }
    // White center dot
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.restore();
  }

  /* ── Snowflakes (blue theme only) ── */
  const SNOWFLAKE_COUNT  = 55;
  const SNOWFLAKE_COLORS = ['#FFFFFF', '#E3F2FD', '#BBDEFB', '#90CAF9', '#E0F7FA'];

  function makeSnowflake() {
    return {
      x:          Math.random() * W,
      y:          Math.random() * H - H,
      sz:         Math.random() * 11 + 6,
      color:      SNOWFLAKE_COLORS[Math.floor(Math.random() * SNOWFLAKE_COLORS.length)],
      vy:         Math.random() * 0.65 + 0.25,
      vx:         (Math.random() - 0.5) * 0.4,
      swing:      Math.random() * Math.PI * 2,
      swingSpeed: Math.random() * 0.018 + 0.006,
      swingAmp:   Math.random() * 1.5 + 0.8,
      op:         Math.random() * 0.25 + 0.20,
      rot:        Math.random() * 60,
      drot:       (Math.random() - 0.5) * 0.35,
    };
  }

  function drawSnowflake(p) {
    const s = p.sz;
    ctx.save();
    ctx.globalAlpha = p.op;
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rot * Math.PI) / 180);
    ctx.strokeStyle = p.color;
    ctx.lineWidth   = Math.max(1, s * 0.09);
    ctx.lineCap     = 'round';
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i / 6) * Math.PI * 2);
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(0, -s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.35); ctx.lineTo( s * 0.22, -s * 0.55);
      ctx.moveTo(0, -s * 0.35); ctx.lineTo(-s * 0.22, -s * 0.55);
      ctx.moveTo(0, -s * 0.65); ctx.lineTo( s * 0.15, -s * 0.80);
      ctx.moveTo(0, -s * 0.65); ctx.lineTo(-s * 0.15, -s * 0.80);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  /* ── Golden leaves (dark theme only) ── */
  const LEAF_COUNT  = 50;
  const LEAF_COLORS = ['#FFD700', '#FFA000', '#FF8F00', '#FFCA28', '#F9A825', '#FFAB40'];

  function makeLeaf() {
    return {
      x:          Math.random() * W,
      y:          Math.random() * H - H,
      sz:         Math.random() * 13 + 8,
      color:      LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
      vy:         Math.random() * 0.9 + 0.4,
      vx:         (Math.random() - 0.5) * 0.6,
      swing:      Math.random() * Math.PI * 2,
      swingSpeed: Math.random() * 0.02 + 0.008,
      swingAmp:   Math.random() * 1.8 + 0.8,
      op:         Math.random() * 0.25 + 0.22,
      rot:        Math.random() * 360,
      drot:       (Math.random() - 0.5) * 1.5,
    };
  }

  function drawLeaf(p) {
    const s = p.sz;
    ctx.save();
    ctx.globalAlpha = p.op;
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rot * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo( s * 0.55, -s * 0.25,  s * 0.55, -s * 0.85, 0, -s);
    ctx.bezierCurveTo(-s * 0.55, -s * 0.85, -s * 0.55, -s * 0.25, 0,  0);
    ctx.fillStyle = p.color;
    ctx.fill();
    // Center vein
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth   = Math.max(0.5, s * 0.055);
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.05); ctx.lineTo(0, -s * 0.88);
    ctx.stroke();
    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    // Theme-specific particles (behind hearts/stars)
    blossoms.forEach((p, i) => {
      p.swing += p.swingSpeed;
      p.y     += p.vy;
      p.x     += p.vx + Math.sin(p.swing) * p.swingAmp * 0.28;
      p.rot   += p.drot;
      drawBlossom(p);
      if (p.y > H + 20) { const b = makeBlossom(); b.y = -20; blossoms[i] = b; }
    });
    snowflakes.forEach((p, i) => {
      p.swing += p.swingSpeed;
      p.y     += p.vy;
      p.x     += p.vx + Math.sin(p.swing) * p.swingAmp * 0.22;
      p.rot   += p.drot;
      drawSnowflake(p);
      if (p.y > H + 20) { const s = makeSnowflake(); s.y = -20; snowflakes[i] = s; }
    });
    leaves.forEach((p, i) => {
      p.swing += p.swingSpeed;
      p.y     += p.vy;
      p.x     += p.vx + Math.sin(p.swing) * p.swingAmp * 0.30;
      p.rot   += p.drot;
      drawLeaf(p);
      if (p.y > H + 20) { const l = makeLeaf(); l.y = -20; leaves[i] = l; }
    });
    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener('resize', resize);
  function seedTheme(theme) {
    blossoms = []; snowflakes = []; leaves = [];
    if (theme === 'pink') {
      for (let i = 0; i < BLOSSOM_COUNT; i++)   { const p = makeBlossom();   p.y = Math.random() * H; blossoms.push(p); }
    } else if (theme === 'blue') {
      for (let i = 0; i < SNOWFLAKE_COUNT; i++) { const p = makeSnowflake(); p.y = Math.random() * H; snowflakes.push(p); }
    } else if (theme === 'dark') {
      for (let i = 0; i < LEAF_COUNT; i++)      { const p = makeLeaf();      p.y = Math.random() * H; leaves.push(p); }
    }
  }

  seedTheme(document.documentElement.getAttribute('data-theme') || 'pink');
  tick();

  window._particles = {
    recolor() {
      seedTheme(document.documentElement.getAttribute('data-theme') || 'pink');
    },
  };
})();

/* ─────────────────────────────────────────────────────
   SCROLL INDICATOR
───────────────────────────────────────────────────── */
document.querySelector('.scroll-indicator')?.addEventListener('click', () => {
  document.getElementById('letters')?.scrollIntoView({ behavior: 'smooth' });
});

/* ─────────────────────────────────────────────────────
   FETCH & RENDER ENTRIES
───────────────────────────────────────────────────── */
async function loadEntries() {
  const grid     = document.getElementById('cards-grid');
  const noEntry  = document.getElementById('no-entries');

  try {
    const res     = await fetch('./data.json');
    const entries = await res.json();

    grid.innerHTML = '';

    if (!entries.length) {
      noEntry.classList.remove('hidden');
      return;
    }

    noEntry.classList.add('hidden');
    entries.forEach((entry, idx) => grid.appendChild(buildCard(entry, idx)));
  } catch {
    grid.innerHTML = `
      <div class="state-placeholder">
        <i class="fas fa-exclamation-circle"></i>
        <p>To preview locally, open via <strong>VS Code Live Server</strong> or run <code>npx serve public</code></p>
      </div>`;
  }
}

function buildCard(entry, idx) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.animationDelay = `${idx * 0.07}s`;

  // Photo section — show first photo as thumbnail
  const photoWrap = document.createElement('div');
  photoWrap.className = 'card-photo-wrap';

  const firstPhoto = entry.photos?.[0];
  if (firstPhoto) {
    const img = document.createElement('img');
    img.className = 'card-photo';
    img.alt = entry.name;
    img.loading = 'lazy';
    photoWrap.classList.add('img-loading');
    img.addEventListener('load',  () => photoWrap.classList.remove('img-loading'));
    img.addEventListener('error', () => photoWrap.classList.remove('img-loading'));
    img.src = firstPhoto.url;
    photoWrap.appendChild(img);
    // Badge if multiple photos
    if (entry.photos.length > 1) {
      const badge = document.createElement('span');
      badge.className = 'photo-count';
      badge.innerHTML = `<i class="fas fa-images"></i> ${entry.photos.length}`;
      photoWrap.appendChild(badge);
    }
  } else {
    card.classList.add('card--no-photo');
    const ph = document.createElement('div');
    ph.className = 'card-photo-placeholder';
    ph.innerHTML = '<i class="fas fa-envelope-open" aria-hidden="true"></i>';
    photoWrap.appendChild(ph);
  }

  // Body
  const body = document.createElement('div');
  body.className = 'card-body';

  const name = document.createElement('h3');
  name.className = 'card-name';
  name.textContent = entry.name;

  const preview = document.createElement('p');
  preview.className = 'card-preview';
  const cut = entry.letter.slice(0, 120);
  preview.textContent = cut + (entry.letter.length > 120 ? '…' : '');

  const more = document.createElement('span');
  more.className = 'card-read-more';
  more.textContent = 'Read Letter →';

  body.appendChild(name);
  body.appendChild(preview);
  body.appendChild(more);
  card.appendChild(photoWrap);
  card.appendChild(body);

  card.addEventListener('click', () => openModal(entry));
  return card;
}

/* ─────────────────────────────────────────────────────
   MODAL
───────────────────────────────────────────────────── */
const modal      = document.getElementById('modal');
const modalPhoto = document.getElementById('modal-photo');
const modalPh    = document.getElementById('modal-photo-placeholder');
const modalName  = document.getElementById('modal-name');
const modalLetter = document.getElementById('modal-letter');

function openModal(entry) {
  modalName.textContent   = entry.name;
  modalLetter.textContent = entry.letter;

  const photos = entry.photos || [];
  if (photos.length) {
    modalPhoto.innerHTML = '';
    photos.forEach((p, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'gallery-img-wrap img-loading';

      const img = document.createElement('img');
      img.alt = entry.name;
      // Eager: the user is actively reading this letter, prioritise its photos.
      img.loading = 'eager';
      img.decoding = 'async';
      img.className = 'gallery-img';
      img.addEventListener('load', () => {
        wrap.classList.remove('img-loading');
        img.classList.add('loaded');
      });
      img.addEventListener('error', () => wrap.classList.remove('img-loading'));
      img.addEventListener('click', () => openLightbox(photos, i));
      img.src = p.url;

      wrap.appendChild(img);
      modalPhoto.appendChild(wrap);
    });
    modalPhoto.classList.remove('hidden');
    modalPh.classList.add('hidden');
  } else {
    modalPhoto.classList.add('hidden');
    modalPh.classList.remove('hidden');
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  // Push a state so the phone back button closes this letter instead of leaving the page.
  history.pushState({ letterModal: true }, '');
}

function closeModal() {
  if (modal.classList.contains('hidden')) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  // Pop the modal history state without triggering the exit-confirm dialog.
  _suppressNextPopstate = true;
  history.back();
}

document.querySelector('.modal-close').addEventListener('click', closeModal);
document.querySelector('.modal-overlay').addEventListener('click', closeModal);
document.querySelector('.modal-swap').addEventListener('click', () => {
  document.querySelector('.modal-body').classList.toggle('swapped');
});

/* ─────────────────────────────────────────────────────
   LIGHTBOX
───────────────────────────────────────────────────── */
const lightbox        = document.getElementById('lightbox');
const lightboxImg     = document.getElementById('lightbox-img');
const lightboxTrack   = document.querySelector('.lightbox-track');
const lightboxCounter = document.querySelector('.lightbox-counter');
const lightboxSpinner = document.querySelector('.lightbox-spinner');
const prevBtn         = document.querySelector('.lightbox-prev');
const nextBtn         = document.querySelector('.lightbox-next');

let lbPhotos = [];
let lbIndex  = 0;
let lbLoadToken = 0;

function openLightbox(photos, startIndex) {
  lbPhotos = photos;
  lbIndex  = startIndex;
  lightboxTrack.style.cssText = '';
  showLbPhoto();
  lightbox.classList.remove('hidden');
  history.pushState({ lightbox: true }, '');
}

function closeLightbox() {
  if (lightbox.classList.contains('hidden')) return;
  lightbox.classList.add('hidden');
  lightboxTrack.style.cssText = '';
  lbLoadToken++; // invalidate any in-flight load
  _suppressNextPopstate = true;
  history.back();
}

function showLbPhoto() {
  const token = ++lbLoadToken;
  const url = lbPhotos[lbIndex].url;

  prevBtn.disabled = lbIndex === 0;
  nextBtn.disabled = lbIndex === lbPhotos.length - 1;
  lightboxCounter.textContent = lbPhotos.length > 1
    ? `${lbIndex + 1} / ${lbPhotos.length}`
    : '';

  // Populate the side slots so they're visually lined up and ready to swipe into.
  const imgPrev = document.getElementById('lightbox-img-prev');
  const imgNext = document.getElementById('lightbox-img-next');

  imgPrev.classList.remove('loaded');
  imgNext.classList.remove('loaded');

  if (lbIndex > 0) {
    imgPrev.src = lbPhotos[lbIndex - 1].url;
    if (imgPrev.complete && imgPrev.naturalWidth > 0) imgPrev.classList.add('loaded');
    else imgPrev.onload = () => imgPrev.classList.add('loaded');
  } else {
    imgPrev.src = '';
  }

  if (lbIndex < lbPhotos.length - 1) {
    imgNext.src = lbPhotos[lbIndex + 1].url;
    if (imgNext.complete && imgNext.naturalWidth > 0) imgNext.classList.add('loaded');
    else imgNext.onload = () => imgNext.classList.add('loaded');
  } else {
    imgNext.src = '';
  }

  // Preload via a detached Image() so the visible <img> is only updated
  // once the bytes are actually here — no half-painted frames.
  const preloader = new Image();
  preloader.src = url;

  const reveal = () => {
    if (token !== lbLoadToken) return; // user already navigated away
    lightboxImg.src = url;
    lightboxImg.classList.add('loaded');
    lightboxSpinner.classList.add('hidden');
  };

  if (preloader.complete && preloader.naturalWidth > 0) {
    reveal();
  } else {
    lightboxImg.classList.remove('loaded');
    lightboxSpinner.classList.remove('hidden');
    preloader.onload = reveal;
    preloader.onerror = () => {
      if (token !== lbLoadToken) return;
      lightboxSpinner.classList.add('hidden');
    };
  }
}

prevBtn.addEventListener('click', () => { if (lbIndex > 0) { lbIndex--; showLbPhoto(); } });
nextBtn.addEventListener('click', () => { if (lbIndex < lbPhotos.length - 1) { lbIndex++; showLbPhoto(); } });
document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
document.querySelector('.lightbox-overlay').addEventListener('click', closeLightbox);

/* ─── Touch swipe ─── */
let swipeStartX = 0;
let swipeStartY = 0;
let swipeLocked = false;

lightbox.addEventListener('touchstart', (e) => {
  swipeStartX = e.touches[0].clientX;
  swipeStartY = e.touches[0].clientY;
  swipeLocked = false;
  lightboxTrack.style.transition = 'none';
}, { passive: true });

lightbox.addEventListener('touchmove', (e) => {
  const dx = e.touches[0].clientX - swipeStartX;
  const dy = e.touches[0].clientY - swipeStartY;
  if (!swipeLocked) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    if (Math.abs(dy) >= Math.abs(dx)) return; // vertical — ignore
    swipeLocked = true;
  }
  // resistance at first/last photo
  const atEdge = (dx > 0 && lbIndex === 0) || (dx < 0 && lbIndex === lbPhotos.length - 1);
  const offset = atEdge ? dx * 0.2 : dx;
  // The track's resting position is -100vw (center slot); drag offsets from there.
  lightboxTrack.style.transform = `translateX(calc(-100vw + ${offset}px))`;
}, { passive: true });

function lbSlide(dir) {
  // dir: 1 = next (swipe left), -1 = prev (swipe right)
  // Slide the track so the neighbour slot lands in the viewport center.
  const targetX = dir === 1 ? '-200vw' : '0vw';
  lightboxTrack.style.transition = 'transform 0.25s ease';
  lightboxTrack.style.transform  = `translateX(${targetX})`;
  setTimeout(() => {
    lbIndex += dir;
    showLbPhoto();                          // update center + side slots
    lightboxTrack.style.transition = 'none';
    lightboxTrack.style.transform  = 'translateX(-100vw)'; // snap back to center
    lightboxTrack.getBoundingClientRect();  // force reflow
  }, 260);
}

lightbox.addEventListener('touchend', (e) => {
  if (!swipeLocked) return;
  swipeLocked = false;
  const dx = e.changedTouches[0].clientX - swipeStartX;
  if (Math.abs(dx) > 60) {
    if (dx < 0 && lbIndex < lbPhotos.length - 1) { lbSlide(1);  return; }
    if (dx > 0 && lbIndex > 0)                   { lbSlide(-1); return; }
  }
  // snap back to center
  lightboxTrack.style.transition = 'transform 0.25s ease';
  lightboxTrack.style.transform  = 'translateX(-100vw)';
}, { passive: true });

lightbox.addEventListener('touchcancel', () => {
  swipeLocked = false;
  lightboxTrack.style.transition = 'transform 0.25s ease';
  lightboxTrack.style.transform  = 'translateX(-100vw)';
}, { passive: true });

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('hidden')) {
    if (e.key === 'ArrowLeft')  { if (lbIndex > 0) { lbIndex--; showLbPhoto(); } }
    if (e.key === 'ArrowRight') { if (lbIndex < lbPhotos.length - 1) { lbIndex++; showLbPhoto(); } }
    if (e.key === 'Escape')     { closeLightbox(); }
  } else if (!modal.classList.contains('hidden')) {
    if (e.key === 'Escape') closeModal();
  }
});

/* ─────────────────────────────────────────────────────
   CONFIRM EXIT  (themed dialog on back-button)
───────────────────────────────────────────────────── */
const exitModal   = document.getElementById('exit-modal');
const exitStay    = document.getElementById('exit-stay');
const exitLeave   = document.getElementById('exit-leave');
const exitOverlay = exitModal.querySelector('.exit-overlay');

let exitConfirmed        = false;
// Shared flag: set before calling history.back() programmatically so the
// popstate handler knows not to treat it as a real back-button press.
let _suppressNextPopstate = false;

// Push a sentinel state so the first back-button press triggers popstate
// instead of navigating away.
history.pushState({ exitGuard: true }, '');

window.addEventListener('popstate', () => {
  if (_suppressNextPopstate) {
    _suppressNextPopstate = false;
    return;
  }

  // Lightbox open → close it; stay on the page.
  if (!lightbox.classList.contains('hidden')) {
    lightbox.classList.add('hidden');
    lightboxTrack.style.cssText = '';
    lbLoadToken++;
    return;
  }

  // Letter modal open → close it; stay on the page.
  if (!modal.classList.contains('hidden')) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    return;
  }

  // Nothing open → intercept as exit intent.
  if (exitConfirmed) return;
  // Re-arm the guard so future back presses are also intercepted.
  history.pushState({ exitGuard: true }, '');
  showExitModal();
});

function showExitModal() {
  exitModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  exitStay.focus();
}

function hideExitModal() {
  exitModal.classList.add('hidden');
  document.body.style.overflow = '';
}

exitStay.addEventListener('click', hideExitModal);
exitOverlay.addEventListener('click', hideExitModal);

exitLeave.addEventListener('click', () => {
  exitConfirmed = true;
  hideExitModal();
  // Try to close the tab (works in in-app browsers like Instagram / WhatsApp).
  window.close();
  // Fallback: navigate back past both the re-armed guard and our initial push.
  setTimeout(() => history.go(-2), 200);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !exitModal.classList.contains('hidden')) {
    hideExitModal();
  }
});

/* ─────────────────────────────────────────────────────
   MAIN GALLERY
───────────────────────────────────────────────────── */
const galleryPhotos = [
  { url: 'assets/img/WhatsApp Image 2026-04-11 at 00.45.58.jpeg' },
  { url: 'assets/img/WhatsApp Image 2026-04-11 at 00.46.29.jpeg' },
  { url: 'assets/img/WhatsApp Image 2026-04-11 at 00.48.24.jpeg' },
];

document.querySelectorAll('.hero-photo-img').forEach((img) => {
  if (img.complete && img.naturalWidth > 0) {
    img.classList.add('loaded');
  } else {
    img.addEventListener('load',  () => img.classList.add('loaded'));
    img.addEventListener('error', () => img.classList.add('loaded'));
  }
  img.addEventListener('click', () => openLightbox(galleryPhotos, Number(img.dataset.index)));
});

/* ─────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────── */
loadEntries();
