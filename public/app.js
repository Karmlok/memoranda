const form = document.getElementById('item-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const itemsList = document.getElementById('items-list');
const feedback = document.getElementById('feedback');
const refreshBtn = document.getElementById('refresh-btn');
const searchInput = document.getElementById('search-input');
const roomFilter = document.getElementById('room-filter');
const roomInput = document.getElementById('room');
const containerInput = document.getElementById('container');
const roomSuggestions = document.getElementById('room-suggestions');
const containerSuggestions = document.getElementById('container-suggestions');
let allItems = [];
let editingItemId = null;
let selectedRoom = '';
const expandedRooms = new Set();
const expandedContainers = new Set();

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

  const groupedItems = groupItemsByRoomAndContainer(items);
  syncExpansionState(groupedItems);

  groupedItems.forEach((roomGroup) => {
    const roomElement = document.createElement('li');
    roomElement.className = 'room-group';
    const roomCount = roomGroup.containers.reduce((total, container) => total + container.items.length, 0);
    const roomExpanded = expandedRooms.has(roomGroup.key);

    roomElement.innerHTML = `
      <button type="button" class="toggle-btn room-toggle-btn" data-room-key="${roomGroup.key}" aria-expanded="${roomExpanded}">
        <span class="toggle-icon">${roomExpanded ? '▾' : '▸'}</span>
        <span>${roomGroup.name}</span>
        <span class="group-count">${roomCount}</span>
      </button>
    `;

    if (roomExpanded) {
      const containerList = document.createElement('ul');
      containerList.className = 'container-list';

      roomGroup.containers.forEach((containerGroup) => {
        const containerElement = document.createElement('li');
        containerElement.className = 'container-group';
        const containerExpanded = expandedContainers.has(containerGroup.key);

        containerElement.innerHTML = `
          <button type="button" class="toggle-btn container-toggle-btn" data-container-key="${containerGroup.key}" aria-expanded="${containerExpanded}">
            <span class="toggle-icon">${containerExpanded ? '▾' : '▸'}</span>
            <span>${containerGroup.name}</span>
            <span class="group-count">${containerGroup.items.length}</span>
          </button>
        `;

        if (containerExpanded) {
          const itemCards = document.createElement('ul');
          itemCards.className = 'item-card-list';
          containerGroup.items.forEach((item) => {
            itemCards.appendChild(createItemCard(item));
          });
          containerElement.appendChild(itemCards);
        }

        containerList.appendChild(containerElement);
      });

      roomElement.appendChild(containerList);
    }

    itemsList.appendChild(roomElement);
  });
}

function createItemCard(item) {
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

  return li;
}

function buildGroupKey(room, container = '') {
  return `${normalizeValue(room)}::${normalizeValue(container)}`;
}

function groupItemsByRoomAndContainer(items) {
  const roomsMap = new Map();

  items.forEach((item) => {
    const roomKey = buildGroupKey(item.room);
    const containerKey = buildGroupKey(item.room, item.container);

    if (!roomsMap.has(roomKey)) {
      roomsMap.set(roomKey, {
        key: roomKey,
        name: item.room.trim(),
        containers: new Map(),
      });
    }

    const roomGroup = roomsMap.get(roomKey);

    if (!roomGroup.containers.has(containerKey)) {
      roomGroup.containers.set(containerKey, {
        key: containerKey,
        name: item.container.trim(),
        items: [],
      });
    }

    roomGroup.containers.get(containerKey).items.push(item);
  });

  return Array.from(roomsMap.values())
    .map((room) => ({
      ...room,
      containers: Array.from(room.containers.values()).sort((a, b) => a.name.localeCompare(b.name, 'it')),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'it'));
}

function syncExpansionState(groupedItems) {
  const validRoomKeys = new Set(groupedItems.map((group) => group.key));
  expandedRooms.forEach((roomKey) => {
    if (!validRoomKeys.has(roomKey)) {
      expandedRooms.delete(roomKey);
    }
  });

  const validContainerKeys = new Set();
  groupedItems.forEach((roomGroup) => {
    roomGroup.containers.forEach((container) => {
      validContainerKeys.add(container.key);
    });
  });
  expandedContainers.forEach((containerKey) => {
    if (!validContainerKeys.has(containerKey)) {
      expandedContainers.delete(containerKey);
    }
  });

  groupedItems.forEach((roomGroup) => {
    if (!expandedRooms.has(roomGroup.key)) {
      expandedRooms.add(roomGroup.key);
    }

    roomGroup.containers.forEach((containerGroup) => {
      if (!expandedContainers.has(containerGroup.key)) {
        expandedContainers.add(containerGroup.key);
      }
    });
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
  const roomQuery = normalizeValue(selectedRoom);

  const filteredItems = allItems.filter((item) => {
    const itemName = normalizeValue(item.name || '');
    const itemRoom = normalizeValue(item.room || '');
    const matchesName = !query || itemName.includes(query);
    const matchesRoom = !roomQuery || itemRoom === roomQuery;

    return matchesName && matchesRoom;
  });

  renderItems(filteredItems);
}

function updateRoomFilterOptions() {
  const roomOptions = getUniqueSuggestions('room');
  const selectedValueStillExists = roomOptions.some((room) => normalizeValue(room) === normalizeValue(selectedRoom));

  if (selectedRoom && !selectedValueStillExists) {
    selectedRoom = '';
  }

  roomFilter.innerHTML = '';

  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'Tutte';
  roomFilter.appendChild(allOption);

  roomOptions.forEach((room) => {
    const option = document.createElement('option');
    option.value = room;
    option.textContent = room;
    option.selected = normalizeValue(room) === normalizeValue(selectedRoom);
    roomFilter.appendChild(option);
  });
}

async function loadItems() {
  try {
    const response = await fetch('/api/items');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Errore nel caricamento oggetti');
    }

    allItems = data;
    updateRoomFilterOptions();
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
  const roomToggleButton = target.closest('.room-toggle-btn');
  if (roomToggleButton) {
    const roomKey = roomToggleButton.dataset.roomKey;
    if (expandedRooms.has(roomKey)) {
      expandedRooms.delete(roomKey);
    } else {
      expandedRooms.add(roomKey);
    }
    applySearchFilter();
    return;
  }

  const containerToggleButton = target.closest('.container-toggle-btn');
  if (containerToggleButton) {
    const containerKey = containerToggleButton.dataset.containerKey;
    if (expandedContainers.has(containerKey)) {
      expandedContainers.delete(containerKey);
    } else {
      expandedContainers.add(containerKey);
    }
    applySearchFilter();
    return;
  }

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
roomFilter.addEventListener('change', (event) => {
  selectedRoom = event.target.value;
  applySearchFilter();
});
roomInput.addEventListener('input', updateAutocomplete);
containerInput.addEventListener('input', updateAutocomplete);

loadItems();
