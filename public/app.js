const form = document.getElementById('item-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const itemsList = document.getElementById('items-list');
const feedback = document.getElementById('feedback');
const refreshBtn = document.getElementById('refresh-btn');
const searchInput = document.getElementById('search-input');
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
    li.innerHTML = `
      <p class="item-name">${item.name}</p>
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
  form.elements.name.focus();
}

function normalizeValue(value) {
  return value.toLowerCase().trim();
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
  } catch (error) {
    setFeedback(error.message, 'error');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    name: formData.get('name'),
    room: formData.get('room'),
    container: formData.get('container'),
  };

  try {
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

loadItems();
