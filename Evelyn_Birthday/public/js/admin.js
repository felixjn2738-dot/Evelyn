/* ─────────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────────── */
let token      = localStorage.getItem('admin-token');
let entries    = [];
let editingId  = null;
let deletingId = null;
let photoFile  = null;   // new file chosen
let removePhoto = false; // user wants to strip existing photo

/* ─────────────────────────────────────────────────────
   AUTH
───────────────────────────────────────────────────── */
function logout() {
  token = null;
  localStorage.removeItem('admin-token');
  showLogin();
}

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('dashboard').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  loadEntries();
}

// ─ Login form ─
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw      = document.getElementById('password').value;
  const errEl   = document.getElementById('login-error');
  const btn     = e.currentTarget.querySelector('button[type="submit"]');

  btn.disabled = true;
  errEl.classList.add('hidden');

  try {
    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    token = data.token;
    localStorage.setItem('admin-token', token);
    showDashboard();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
  }
});

// Toggle password visibility
document.querySelector('.toggle-password').addEventListener('click', () => {
  const inp  = document.getElementById('password');
  const icon = document.querySelector('.toggle-password i');
  if (inp.type === 'password') {
    inp.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    inp.type = 'password';
    icon.className = 'fas fa-eye';
  }
});

document.getElementById('logout-btn').addEventListener('click', logout);

/* ─────────────────────────────────────────────────────
   ENTRIES — FETCH & RENDER
───────────────────────────────────────────────────── */
async function loadEntries() {
  const list = document.getElementById('entries-list');
  list.innerHTML = '<div class="state-block"><i class="fas fa-spinner fa-spin"></i><p>Loading…</p></div>';

  try {
    const res = await fetch('/api/entries');
    entries   = await res.json();
    renderEntries();
  } catch {
    list.innerHTML = '<div class="state-block"><p>Failed to load entries.</p></div>';
  }
}

function renderEntries() {
  const list  = document.getElementById('entries-list');
  const badge = document.getElementById('entries-count');
  badge.textContent = entries.length;

  if (!entries.length) {
    list.innerHTML = `
      <div class="state-block">
        <i class="fas fa-envelope-open" style="color:var(--accent);opacity:.5"></i>
        <p>No letters yet — add the first one!</p>
      </div>`;
    return;
  }

  list.innerHTML = '';
  entries.forEach((entry) => {
    const card = document.createElement('div');
    card.className = 'entry-card';

    if (entry.photoUrl) {
      const img = document.createElement('img');
      img.className = 'entry-thumb';
      img.src = entry.photoUrl;
      img.alt = entry.name;
      card.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'entry-thumb-placeholder';
      ph.innerHTML = '<i class="fas fa-user" aria-hidden="true"></i>';
      card.appendChild(ph);
    }

    const info = document.createElement('div');
    info.className = 'entry-info';

    const name = document.createElement('p');
    name.className = 'entry-card-name';
    name.textContent = entry.name;

    const prev = document.createElement('p');
    prev.className = 'entry-card-preview';
    prev.textContent = entry.letter.slice(0, 80);

    info.appendChild(name);
    info.appendChild(prev);

    const actions = document.createElement('div');
    actions.className = 'entry-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-secondary btn-sm';
    editBtn.innerHTML = '<i class="fas fa-pen"></i>';
    editBtn.setAttribute('aria-label', `Edit ${entry.name}`);
    editBtn.addEventListener('click', () => openEditModal(entry._id));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-ghost btn-sm';
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    delBtn.setAttribute('aria-label', `Delete ${entry.name}`);
    delBtn.addEventListener('click', () => openDeleteModal(entry._id, entry.name));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    card.appendChild(info);
    card.appendChild(actions);
    list.appendChild(card);
  });
}

/* ─────────────────────────────────────────────────────
   ADD / EDIT MODAL
───────────────────────────────────────────────────── */
const entryModal  = document.getElementById('entry-modal');
const entryForm   = document.getElementById('entry-form');
const photoInput  = document.getElementById('photo-input');
const photoDrop   = document.getElementById('photo-drop');

function resetForm() {
  entryForm.reset();
  document.getElementById('entry-id').value = '';
  document.getElementById('char-count').textContent = '0';
  document.getElementById('form-error').classList.add('hidden');
  resetPhotoUI();
  photoFile   = null;
  removePhoto = false;
}

function resetPhotoUI() {
  document.getElementById('upload-idle').classList.remove('hidden');
  document.getElementById('photo-preview').classList.add('hidden');
  document.getElementById('photo-preview').src = '';
  document.getElementById('photo-actions').classList.add('hidden');
}

function showPhotoPreview(url) {
  document.getElementById('upload-idle').classList.add('hidden');
  const prev = document.getElementById('photo-preview');
  prev.src = url;
  prev.classList.remove('hidden');
  document.getElementById('photo-actions').classList.remove('hidden');
}

function openAddModal() {
  editingId = null;
  resetForm();
  document.getElementById('modal-title').textContent = 'Add New Letter';
  document.getElementById('submit-label').textContent = 'Save Letter';
  entryModal.classList.remove('hidden');
  document.getElementById('entry-name').focus();
}

function openEditModal(id) {
  const entry = entries.find((e) => e._id === id);
  if (!entry) return;

  editingId = id;
  resetForm();
  document.getElementById('modal-title').textContent   = 'Edit Letter';
  document.getElementById('submit-label').textContent  = 'Save Changes';
  document.getElementById('entry-id').value            = id;
  document.getElementById('entry-name').value          = entry.name;
  document.getElementById('entry-letter').value        = entry.letter;
  document.getElementById('char-count').textContent    = entry.letter.length;

  if (entry.photoUrl) showPhotoPreview(entry.photoUrl);

  entryModal.classList.remove('hidden');
  document.getElementById('entry-name').focus();
}

function closeEntryModal() {
  entryModal.classList.add('hidden');
  photoFile   = null;
  removePhoto = false;
}

// Character counter
document.getElementById('entry-letter').addEventListener('input', function () {
  document.getElementById('char-count').textContent = this.value.length;
});

// Photo drop zone
photoDrop.addEventListener('click', (e) => {
  if (!e.target.closest('.photo-actions')) photoInput.click();
});

photoDrop.addEventListener('dragover', (e) => {
  e.preventDefault();
  photoDrop.classList.add('drag-over');
});
photoDrop.addEventListener('dragleave', () => photoDrop.classList.remove('drag-over'));
photoDrop.addEventListener('drop', (e) => {
  e.preventDefault();
  photoDrop.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file?.type.startsWith('image/')) handlePhotoFile(file);
});

photoInput.addEventListener('change', () => {
  if (photoInput.files[0]) handlePhotoFile(photoInput.files[0]);
  photoInput.value = '';
});

function handlePhotoFile(file) {
  if (file.size > 10 * 1024 * 1024) {
    alert('File is too large. Maximum allowed: 10 MB.');
    return;
  }
  photoFile   = file;
  removePhoto = false;
  showPhotoPreview(URL.createObjectURL(file));
}

document.getElementById('change-photo-btn').addEventListener('click', () => photoInput.click());
document.getElementById('remove-photo-btn').addEventListener('click', () => {
  photoFile   = null;
  removePhoto = true;
  resetPhotoUI();
});

// ─ Form submit ─
entryForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name    = document.getElementById('entry-name').value.trim();
  const letter  = document.getElementById('entry-letter').value.trim();
  const errEl   = document.getElementById('form-error');
  const btn     = document.getElementById('submit-btn');
  const label   = document.getElementById('submit-label');
  const spinner = document.getElementById('submit-spin');

  if (!name || !letter) {
    errEl.textContent = 'Name and letter are required.';
    errEl.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  label.textContent = 'Saving…';
  spinner.classList.remove('hidden');
  errEl.classList.add('hidden');

  try {
    const fd = new FormData();
    fd.append('name', name);
    fd.append('letter', letter);
    if (photoFile) fd.append('photo', photoFile);
    if (removePhoto) fd.append('removePhoto', 'true');

    const url    = editingId ? `/api/entries/${editingId}` : '/api/entries';
    const method = editingId ? 'PUT' : 'POST';
    const res    = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    if (res.status === 401) { logout(); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    closeEntryModal();
    await loadEntries();
  } catch (err) {
    errEl.textContent = err.message || 'Failed to save. Please try again.';
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    spinner.classList.add('hidden');
    label.textContent = editingId ? 'Save Changes' : 'Save Letter';
  }
});

// Modal close buttons
document.querySelector('.modal-close-btn').addEventListener('click', closeEntryModal);
document.querySelector('.cancel-btn').addEventListener('click', closeEntryModal);
entryModal.querySelector('.modal-overlay').addEventListener('click', closeEntryModal);
document.getElementById('add-btn').addEventListener('click', openAddModal);

/* ─────────────────────────────────────────────────────
   DELETE MODAL
───────────────────────────────────────────────────── */
const deleteModal = document.getElementById('delete-modal');

function openDeleteModal(id, name) {
  deletingId = id;
  document.getElementById('delete-name').textContent = name;
  deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
  deletingId = null;
}

document.getElementById('delete-cancel-btn').addEventListener('click', closeDeleteModal);
deleteModal.querySelector('.modal-overlay').addEventListener('click', closeDeleteModal);

document.getElementById('delete-confirm-btn').addEventListener('click', async () => {
  if (!deletingId) return;
  const btn     = document.getElementById('delete-confirm-btn');
  const spinner = document.getElementById('delete-spin');

  btn.disabled = true;
  spinner.classList.remove('hidden');

  try {
    const res = await fetch(`/api/entries/${deletingId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) { logout(); return; }
    if (!res.ok) throw new Error('Delete failed');
    closeDeleteModal();
    await loadEntries();
  } catch {
    alert('Failed to delete. Please try again.');
  } finally {
    btn.disabled = false;
    spinner.classList.add('hidden');
  }
});

// Global ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeEntryModal(); closeDeleteModal(); }
});

/* ─────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────── */
token ? showDashboard() : showLogin();
