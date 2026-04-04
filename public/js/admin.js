/* ─────────────────────────────────────────────────────
   FILE SYSTEM ACCESS API CHECK
───────────────────────────────────────────────────── */
if (!('showDirectoryPicker' in window)) {
  document.getElementById('open-folder-btn').disabled = true;
  document.getElementById('folder-error').textContent =
    'Your browser does not support the File System API. Please use Chrome or Edge.';
  document.getElementById('folder-error').classList.remove('hidden');
}

/* ─────────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────────── */
let dirHandle      = null;   // handle to the public/ folder
let entries        = [];
let editingId      = null;
let deletingId     = null;
let existingPhotos = [];     // [{ url, publicId }] — in edit mode
let removedIds     = [];     // filenames to delete from uploads/
let newFiles       = [];     // File objects to save

/* ─────────────────────────────────────────────────────
   FOLDER PICKER
───────────────────────────────────────────────────── */
async function openFolder() {
  const errEl = document.getElementById('folder-error');
  errEl.classList.add('hidden');
  try {
    let handle = await window.showDirectoryPicker({ mode: 'readwrite' });

    // Auto-detect: if they picked the project root, descend into public/
    try {
      await handle.getFileHandle('data.json');
      // data.json found — this IS the public folder
    } catch {
      try {
        handle = await handle.getDirectoryHandle('public');
        await handle.getFileHandle('data.json');
      } catch {
        errEl.textContent = 'Could not find data.json. Please select the "public" folder inside your project.';
        errEl.classList.remove('hidden');
        return;
      }
    }

    dirHandle = handle;
    await loadEntries();
    document.getElementById('folder-screen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
  } catch (err) {
    if (err.name !== 'AbortError') {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    }
  }
}

document.getElementById('open-folder-btn').addEventListener('click', openFolder);
document.getElementById('change-folder-btn').addEventListener('click', () => {
  dirHandle = null;
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('folder-screen').classList.remove('hidden');
});

/* ─────────────────────────────────────────────────────
   DATA HELPERS
───────────────────────────────────────────────────── */
async function readData() {
  const fh   = await dirHandle.getFileHandle('data.json');
  const file = await fh.getFile();
  return JSON.parse(await file.text());
}

async function writeData(data) {
  const fh       = await dirHandle.getFileHandle('data.json', { create: true });
  const writable = await fh.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

async function savePhoto(file) {
  const ext        = (file.name.match(/\.[^.]+$/) || ['.jpg'])[0].toLowerCase();
  const filename   = crypto.randomUUID() + ext;
  const uploadsDir = await dirHandle.getDirectoryHandle('uploads', { create: true });
  const fh         = await uploadsDir.getFileHandle(filename, { create: true });
  const writable   = await fh.createWritable();
  await writable.write(await file.arrayBuffer());
  await writable.close();
  return { url: `./uploads/${filename}`, publicId: filename };
}

async function deletePhoto(filename) {
  try {
    const uploadsDir = await dirHandle.getDirectoryHandle('uploads');
    await uploadsDir.removeEntry(filename);
  } catch { /* already gone */ }
}

/* ─────────────────────────────────────────────────────
   ENTRIES — LOAD & RENDER
───────────────────────────────────────────────────── */
async function loadEntries() {
  const list = document.getElementById('entries-list');
  list.innerHTML = '<div class="state-block"><i class="fas fa-spinner fa-spin"></i><p>Loading…</p></div>';
  try {
    entries = await readData();
    renderEntries();
  } catch (err) {
    list.innerHTML = `<div class="state-block"><p>Failed to load: ${err.message}</p></div>`;
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
    card.dataset.id = entry._id;
    card.draggable  = true;

    // Drag handle
    const handle = document.createElement('div');
    handle.className = 'drag-handle';
    handle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
    card.appendChild(handle);

    // Thumbnail
    const firstPhoto = entry.photos?.[0];
    if (firstPhoto) {
      const img = document.createElement('img');
      img.className = 'entry-thumb';
      img.src = firstPhoto.url;
      img.alt = entry.name;
      card.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'entry-thumb-placeholder';
      ph.innerHTML = '<i class="fas fa-user" aria-hidden="true"></i>';
      card.appendChild(ph);
    }

    if (entry.photos?.length > 1) {
      const b = document.createElement('span');
      b.className   = 'photo-count-badge';
      b.textContent = `${entry.photos.length} photos`;
      card.appendChild(b);
    }

    const info = document.createElement('div');
    info.className = 'entry-info';
    info.innerHTML = `
      <p class="entry-card-name">${entry.name}</p>
      <p class="entry-card-preview">${entry.letter.slice(0, 80)}</p>`;

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

  initDragSort(list);
}

/* ─────────────────────────────────────────────────────
   DRAG-AND-DROP SORTING
───────────────────────────────────────────────────── */
function initDragSort(list) {
  let dragEl = null;

  list.addEventListener('dragstart', (e) => {
    dragEl = e.target.closest('.entry-card');
    if (!dragEl) return;
    dragEl.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  list.addEventListener('dragend', async () => {
    if (!dragEl) return;
    dragEl.classList.remove('dragging');
    list.querySelectorAll('.entry-card').forEach(c => c.classList.remove('drag-over'));
    dragEl = null;
    await saveOrder();
  });

  list.addEventListener('dragover', (e) => {
    e.preventDefault();
    const target = e.target.closest('.entry-card');
    if (!target || target === dragEl) return;
    list.querySelectorAll('.entry-card').forEach(c => c.classList.remove('drag-over'));
    target.classList.add('drag-over');
    const after = e.clientY > target.getBoundingClientRect().top + target.offsetHeight / 2;
    list.insertBefore(dragEl, after ? target.nextSibling : target);
  });

  list.addEventListener('dragleave', (e) => {
    e.target.closest?.('.entry-card')?.classList.remove('drag-over');
  });
}

async function saveOrder() {
  const ids = Array.from(document.querySelectorAll('#entries-list .entry-card'))
    .map(c => c.dataset.id);
  const map = Object.fromEntries(entries.map(e => [e._id, e]));
  entries   = ids.map(id => map[id]).filter(Boolean);
  try { await writeData(entries); }
  catch (err) { alert('Failed to save order: ' + err.message); }
}

/* ─────────────────────────────────────────────────────
   PHOTO GRID (in form)
───────────────────────────────────────────────────── */
function renderPhotoGrid() {
  const grid = document.getElementById('photos-grid');
  grid.innerHTML = '';

  existingPhotos.forEach((photo) => {
    if (removedIds.includes(photo.publicId)) return;
    grid.appendChild(buildThumb(photo.url, () => {
      removedIds.push(photo.publicId);
      renderPhotoGrid();
    }));
  });

  newFiles.forEach((file, idx) => {
    grid.appendChild(buildThumb(URL.createObjectURL(file), () => {
      newFiles.splice(idx, 1);
      renderPhotoGrid();
    }));
  });

  const total = existingPhotos.filter(p => !removedIds.includes(p.publicId)).length + newFiles.length;
  document.getElementById('photo-drop').style.display = total >= 10 ? 'none' : '';
}

function buildThumb(url, onRemove) {
  const wrap = document.createElement('div');
  wrap.className = 'photo-thumb-wrap';
  const img = document.createElement('img');
  img.src = url; img.className = 'photo-thumb'; img.alt = '';
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'photo-thumb-remove';
  btn.innerHTML = '<i class="fas fa-times"></i>';
  btn.setAttribute('aria-label', 'Remove photo');
  btn.addEventListener('click', onRemove);
  wrap.appendChild(img); wrap.appendChild(btn);
  return wrap;
}

/* ─────────────────────────────────────────────────────
   ADD / EDIT MODAL
───────────────────────────────────────────────────── */
const entryModal = document.getElementById('entry-modal');
const entryForm  = document.getElementById('entry-form');
const photoInput = document.getElementById('photo-input');
const photoDrop  = document.getElementById('photo-drop');

function resetForm() {
  entryForm.reset();
  document.getElementById('entry-id').value = '';
  document.getElementById('char-count').textContent = '0';
  document.getElementById('form-error').classList.add('hidden');
  existingPhotos = []; removedIds = []; newFiles = [];
  renderPhotoGrid();
}

function openAddModal() {
  editingId = null; resetForm();
  document.getElementById('modal-title').textContent  = 'Add New Letter';
  document.getElementById('submit-label').textContent = 'Save Letter';
  entryModal.classList.remove('hidden');
  document.getElementById('entry-name').focus();
}

function openEditModal(id) {
  const entry = entries.find(e => e._id === id);
  if (!entry) return;
  editingId = id; resetForm();
  document.getElementById('modal-title').textContent   = 'Edit Letter';
  document.getElementById('submit-label').textContent  = 'Save Changes';
  document.getElementById('entry-id').value            = id;
  document.getElementById('entry-name').value          = entry.name;
  document.getElementById('entry-letter').value        = entry.letter;
  document.getElementById('char-count').textContent    = entry.letter.length;
  existingPhotos = entry.photos ? [...entry.photos] : [];
  renderPhotoGrid();
  entryModal.classList.remove('hidden');
  document.getElementById('entry-name').focus();
}

function closeEntryModal() { entryModal.classList.add('hidden'); }

document.getElementById('entry-letter').addEventListener('input', function () {
  document.getElementById('char-count').textContent = this.value.length;
});

photoDrop.addEventListener('click', () => photoInput.click());
photoDrop.addEventListener('dragover', (e) => { e.preventDefault(); photoDrop.classList.add('drag-over'); });
photoDrop.addEventListener('dragleave', () => photoDrop.classList.remove('drag-over'));
photoDrop.addEventListener('drop', (e) => {
  e.preventDefault(); photoDrop.classList.remove('drag-over');
  addFiles(Array.from(e.dataTransfer.files));
});
photoInput.addEventListener('change', () => { addFiles(Array.from(photoInput.files)); photoInput.value = ''; });

function addFiles(files) {
  const images  = files.filter(f => f.type.startsWith('image/'));
  const tooBig  = images.filter(f => f.size > 100 * 1024 * 1024);
  if (tooBig.length) alert(`${tooBig.length} file(s) exceed 100 MB and were skipped.`);
  const valid   = images.filter(f => f.size <= 100 * 1024 * 1024);
  const current = existingPhotos.filter(p => !removedIds.includes(p.publicId)).length + newFiles.length;
  const slots   = 10 - current;
  if (valid.length > slots) alert(`Only ${slots} more photo(s) can be added (max 10 total).`);
  newFiles.push(...valid.slice(0, slots));
  renderPhotoGrid();
}

entryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name   = document.getElementById('entry-name').value.trim();
  const letter = document.getElementById('entry-letter').value.trim();
  const errEl  = document.getElementById('form-error');
  const btn    = document.getElementById('submit-btn');
  const label  = document.getElementById('submit-label');
  const spin   = document.getElementById('submit-spin');

  if (!name || !letter) {
    errEl.textContent = 'Name and letter are required.';
    errEl.classList.remove('hidden');
    return;
  }

  btn.disabled = true; label.textContent = 'Saving…'; spin.classList.remove('hidden');
  errEl.classList.add('hidden');

  try {
    const all = await readData();

    if (editingId) {
      const entry = all.find(e => e._id === editingId);
      if (!entry) throw new Error('Entry not found');
      entry.name   = name;
      entry.letter = letter;
      for (const id of removedIds) await deletePhoto(id);
      entry.photos = (entry.photos || []).filter(p => !removedIds.includes(p.publicId));
      for (const file of newFiles) entry.photos.push(await savePhoto(file));
    } else {
      const photos = [];
      for (const file of newFiles) photos.push(await savePhoto(file));
      all.push({ _id: crypto.randomUUID(), name, letter, photos, createdAt: new Date().toISOString() });
    }

    await writeData(all);
    entries = all;
    closeEntryModal();
    renderEntries();
  } catch (err) {
    errEl.textContent = err.message || 'Failed to save.';
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false; spin.classList.add('hidden');
    label.textContent = editingId ? 'Save Changes' : 'Save Letter';
  }
});

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
function closeDeleteModal() { deleteModal.classList.add('hidden'); deletingId = null; }

document.getElementById('delete-cancel-btn').addEventListener('click', closeDeleteModal);
deleteModal.querySelector('.modal-overlay').addEventListener('click', closeDeleteModal);

document.getElementById('delete-confirm-btn').addEventListener('click', async () => {
  if (!deletingId) return;
  const btn  = document.getElementById('delete-confirm-btn');
  const spin = document.getElementById('delete-spin');
  btn.disabled = true; spin.classList.remove('hidden');
  try {
    const all   = await readData();
    const entry = all.find(e => e._id === deletingId);
    if (entry) for (const p of (entry.photos || [])) await deletePhoto(p.publicId);
    const updated = all.filter(e => e._id !== deletingId);
    await writeData(updated);
    entries = updated;
    closeDeleteModal();
    renderEntries();
  } catch (err) {
    alert('Failed to delete: ' + err.message);
  } finally {
    btn.disabled = false; spin.classList.add('hidden');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeEntryModal(); closeDeleteModal(); }
});
