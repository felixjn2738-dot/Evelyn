// Always start from the top on refresh
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

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
  let W, H, particles = [];

  const PALETTES = {
    pink: ['#FF69B4', '#FFD700', '#FF1493', '#FFC0CB', '#FFB6C1'],
    blue: ['#42A5F5', '#90CAF9', '#29B6F6', '#80DEEA', '#B3E5FC'],
    dark: ['#F78C6C', '#FFCB6B', '#C3E88D', '#82AAFF', '#FF5370'],
  };
  const COUNT = 45;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function palette() {
    const theme = document.documentElement.getAttribute('data-theme') || 'pink';
    return PALETTES[theme] || PALETTES.pink;
  }

  function make() {
    const pal = palette();
    return {
      x: Math.random() * W,
      y: Math.random() * H - H,
      sz: Math.random() * 9 + 4,
      color: pal[Math.floor(Math.random() * pal.length)],
      vy: Math.random() * 0.9 + 0.4,
      vx: (Math.random() - 0.5) * 0.45,
      op: Math.random() * 0.55 + 0.25,
      rot: Math.random() * 360,
      drot: (Math.random() - 0.5) * 1.8,
      heart: Math.random() > 0.45,
    };
  }

  function drawHeart(x, y, s, color, op) {
    const k = s / 14;
    ctx.save();
    ctx.globalAlpha = op;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + k * 4);
    ctx.bezierCurveTo(x, y + k * 2, x - k * 6, y - k * 2, x - k * 6, y - k * 6);
    ctx.bezierCurveTo(x - k * 6, y - k * 10, x, y - k * 10, x, y - k * 6);
    ctx.bezierCurveTo(x, y - k * 10, x + k * 6, y - k * 10, x + k * 6, y - k * 6);
    ctx.bezierCurveTo(x + k * 6, y - k * 2, x, y + k * 2, x, y + k * 4);
    ctx.fill();
    ctx.restore();
  }

  function drawStar(x, y, s, color, op) {
    ctx.save();
    ctx.globalAlpha = op;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const r = s / 2;
      i === 0
        ? ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a))
        : ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p, i) => {
      p.y   += p.vy;
      p.x   += p.vx;
      p.rot += p.drot;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.translate(-p.x, -p.y);
      p.heart
        ? drawHeart(p.x, p.y, p.sz, p.color, p.op)
        : drawStar(p.x, p.y, p.sz, p.color, p.op);
      ctx.restore();
      if (p.y > H + 20) particles[i] = make();
    });
    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener('resize', resize);
  for (let i = 0; i < COUNT; i++) {
    const p = make();
    p.y = Math.random() * H; // spread on first load
    particles.push(p);
  }
  tick();

  window._particles = {
    recolor() {
      const pal = palette();
      particles.forEach((p) => {
        p.color = pal[Math.floor(Math.random() * pal.length)];
      });
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
}

function closeModal() {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
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
}

function closeLightbox() {
  lightbox.classList.add('hidden');
  lightboxTrack.style.cssText = '';
  lbLoadToken++; // invalidate any in-flight load
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
const exitModal = document.getElementById('exit-modal');
const exitStay  = document.getElementById('exit-stay');
const exitLeave = document.getElementById('exit-leave');
const exitOverlay = exitModal.querySelector('.exit-overlay');

let exitConfirmed = false;

// Push a sentinel state so the first back-button press triggers popstate
// instead of navigating away.
history.pushState({ exitGuard: true }, '');

window.addEventListener('popstate', () => {
  if (exitConfirmed) return;
  // Re-arm the guard so we can intercept future back-button presses too.
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
  // Pop the re-armed guard plus the original entry to actually leave.
  history.go(-2);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !exitModal.classList.contains('hidden')) {
    hideExitModal();
  }
});

/* ─────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────── */
loadEntries();
