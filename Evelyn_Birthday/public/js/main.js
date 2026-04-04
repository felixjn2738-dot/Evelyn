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
    const res     = await fetch('/api/entries');
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
        <p>Could not load letters. Please refresh.</p>
      </div>`;
  }
}

function buildCard(entry, idx) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.animationDelay = `${idx * 0.07}s`;

  // Photo section
  const photoWrap = document.createElement('div');
  photoWrap.className = 'card-photo-wrap';

  if (entry.photoUrl) {
    const img = document.createElement('img');
    img.className = 'card-photo';
    img.src = entry.photoUrl;
    img.alt = entry.name;
    img.loading = 'lazy';
    photoWrap.appendChild(img);
  } else {
    const ph = document.createElement('div');
    ph.className = 'card-photo-placeholder';
    ph.innerHTML = '<i class="fas fa-user-circle" aria-hidden="true"></i>';
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

  if (entry.photoUrl) {
    modalPhoto.src = entry.photoUrl;
    modalPhoto.alt = entry.name;
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
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

/* ─────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────── */
loadEntries();
