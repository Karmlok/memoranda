const form = document.getElementById('item-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const itemsList = document.getElementById('items-list');
const feedback = document.getElementById('feedback');
const refreshBtn = document.getElementById('refresh-btn');
const searchInput = document.getElementById('search-input');
const roomInput = document.getElementById('room');
const containerInput = document.getElementById('container');
const roomSuggestions = document.getElementById('room-suggestions');
const containerSuggestions = document.getElementById('container-suggestions');
let allItems = [];
let editingItemId = null;

function setFeedback(message, type = '') {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`.trim();
}

function renderItems(items) {
  itemsList.innerHTML = '';

  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = 'Nessun oggetto salvato per ora.';
    itemsList.appendChild(li);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'item-card';
    const imageHtml = item.imagePath
      ? `<img src="${item.imagePath}" alt="${item.name}" class="item-image" loading="lazy" />`
      : '<div class="item-image-placeholder">Nessuna immagine</div>';

    li.innerHTML = `
      <p class="item-name">${item.name}</p>
      ${imageHtml}
      <div class="item-meta">
        <p><span class="meta-label">Stanza:</span> ${item.room}</p>
        <p><span class="meta-label">Contenitore:</span> ${item.container}</p>
      </div>
      <div class="item-actions">
        <button type="button" class="item-action-btn btn-secondary edit-btn" data-id="${item.id}">Modifica</button>
        <button type="button" class="item-action-btn delete-btn" data-id="${item.id}">Elimina</button>
      </div>
    `;
    itemsList.appendChild(li);
  });
}

function resetFormToCreateMode() {
  editingItemId = null;
  formTitle.textContent = 'Aggiungi oggetto';
  submitBtn.textContent = 'Salva';
  cancelEditBtn.classList.add('hidden');
  form.reset();
  updateAutocomplete();
}

function startEditItem(itemId) {
  const itemToEdit = allItems.find((item) => item.id === itemId);

  if (!itemToEdit) {
    setFeedback('Oggetto non trovato per la modifica.', 'error');
    return;
  }

  editingItemId = itemToEdit.id;
  formTitle.textContent = 'Modifica oggetto';
  submitBtn.textContent = 'Aggiorna';
  cancelEditBtn.classList.remove('hidden');

  form.elements.name.value = itemToEdit.name;
  form.elements.room.value = itemToEdit.room;
  form.elements.container.value = itemToEdit.container;
  form.elements.image.value = '';
  updateAutocomplete();
  form.elements.name.focus();
}

function normalizeValue(value) {
  return value.toLowerCase().trim();
}

function getUniqueSuggestions(fieldName) {
  const seen = new Set();
  const suggestions = [];

  allItems.forEach((item) => {
    const rawValue = item[fieldName];
    if (!rawValue || typeof rawValue !== 'string') {
      return;
    }

    const value = rawValue.trim();
    const normalized = normalizeValue(value);

    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    suggestions.push(value);
  });

  return suggestions.sort((a, b) => a.localeCompare(b, 'it'));
}

function fillSuggestionList(datalistElement, values) {
  datalistElement.innerHTML = '';

  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    datalistElement.appendChild(option);
  });
}

function updateAutocomplete() {
  const roomQuery = normalizeValue(roomInput.value || '');
  const containerQuery = normalizeValue(containerInput.value || '');

  const roomValues = getUniqueSuggestions('room').filter((value) => normalizeValue(value).includes(roomQuery));
  const containerValues = getUniqueSuggestions('container').filter((value) => normalizeValue(value).includes(containerQuery));

  fillSuggestionList(roomSuggestions, roomValues);
  fillSuggestionList(containerSuggestions, containerValues);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Impossibile leggere il file immagine.'));
    reader.readAsDataURL(file);
  });
}

function applySearchFilter() {
  const query = normalizeValue(searchInput.value || '');

  if (!query) {
    renderItems(allItems);
    return;
  }

  const filteredItems = allItems.filter((item) => normalizeValue(item.name).includes(query));
  renderItems(filteredItems);
}

async function loadItems() {
  try {
    const response = await fetch('/api/items');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Errore nel caricamento oggetti');
    }

    allItems = data;
    applySearchFilter();
    updateAutocomplete();
  } catch (error) {
    setFeedback(error.message, 'error');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const imageFile = formData.get('image');

  try {
    let imageData = null;

    if (imageFile && imageFile.size > 0) {
      imageData = await fileToDataUrl(imageFile);
    }

    const payload = {
      name: formData.get('name'),
      room: formData.get('room'),
      container: formData.get('container'),
      imageData,
      imageName: imageFile && imageFile.size > 0 ? imageFile.name : null,
    };
    const isEditing = Boolean(editingItemId);
    const endpoint = isEditing ? `/api/items/${editingItemId}` : '/api/items';
    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Errore durante il salvataggio');
    }

    const actionText = isEditing ? 'aggiornato' : 'salvato';
    resetFormToCreateMode();
    setFeedback(`Oggetto ${actionText}: ${data.name}`, 'success');
    await loadItems();
  } catch (error) {
    setFeedback(error.message, 'error');
  }
});

itemsList.addEventListener('click', async (event) => {
  const target = event.target;
  const itemId = target.dataset.id;

  if (!itemId) {
    return;
  }

  if (target.classList.contains('edit-btn')) {
    startEditItem(itemId);
    return;
  }

  if (!target.classList.contains('delete-btn')) {
    return;
  }

  const confirmed = window.confirm('Vuoi davvero eliminare questo oggetto?');
  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`/api/items/${itemId}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Errore durante l'eliminazione");
    }

    if (editingItemId === itemId) {
      resetFormToCreateMode();
    }

    setFeedback(data.message, 'success');
    await loadItems();
  } catch (error) {
    setFeedback(error.message, 'error');
  }
});

cancelEditBtn.addEventListener('click', () => {
  resetFormToCreateMode();
  setFeedback('Modifica annullata.');
});

refreshBtn.addEventListener('click', loadItems);
searchInput.addEventListener('input', applySearchFilter);
roomInput.addEventListener('input', updateAutocomplete);
containerInput.addEventListener('input', updateAutocomplete);

loadItems();
