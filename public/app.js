const form = document.getElementById('item-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const itemsList = document.getElementById('items-list');
const feedback = document.getElementById('feedback');
const refreshBtn = document.getElementById('refresh-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFileInput = document.getElementById('import-file');
const searchInput = document.getElementById('search-input');
const roomFilter = document.getElementById('room-filter');
const roomInput = document.getElementById('room');
const containerInput = document.getElementById('container');
const roomSuggestions = document.getElementById('room-suggestions');
const containerSuggestions = document.getElementById('container-suggestions');
let allItems = [];
let editingItemId = null;
let selectedRoom = '';
let pendingHighlightItemId = null;
const expandedRooms = new Set();
const expandedContainers = new Set();

const dataStorePromise = import('/js/dataStore.js').then((module) => module.dataStore || window.dataStore);

async function getDataStore() {
  return dataStorePromise;
}

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

  if (pendingHighlightItemId) {
    const highlightedCard = itemsList.querySelector(`[data-item-id="${pendingHighlightItemId}"]`);
    if (highlightedCard) {
      highlightedCard.classList.add('item-card--flash');
      window.setTimeout(() => {
        highlightedCard.classList.remove('item-card--flash');
      }, 1900);
    }
    pendingHighlightItemId = null;
  }
}

function createItemCard(item) {
  const li = document.createElement('li');
  li.className = 'item-card';
  li.dataset.itemId = item.id;
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



function downloadJsonFile(content, filename) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function exportBackup() {
  try {
    const dataStore = await getDataStore();
    const backupData = await dataStore.exportItems();
    const backupText = typeof backupData === 'string' ? backupData : JSON.stringify(backupData, null, 2);

    const today = new Date().toISOString().slice(0, 10);
    downloadJsonFile(backupText, `memoranda-backup-${today}.json`);
    setFeedback('Backup esportato con successo.', 'success');
  } catch (error) {
    setFeedback(error.message, 'error');
  }
}

async function importBackupFile(file) {
  try {
    const fileText = await file.text();
    let parsedJson;

    try {
      parsedJson = JSON.parse(fileText);
    } catch (error) {
      throw new Error('File JSON non valido.');
    }

    const dataStore = await getDataStore();
    const data = await dataStore.importItems(parsedJson);

    setFeedback(data.message, 'success');
    resetFormToCreateMode();
    await loadItems();
  } catch (error) {
    setFeedback(error.message, 'error');
  } finally {
    importFileInput.value = '';
  }
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
    const dataStore = await getDataStore();
    allItems = await dataStore.getAllItems();
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
    const dataStore = await getDataStore();
    const data = isEditing
      ? await dataStore.updateItem(editingItemId, payload)
      : await dataStore.createItem(payload);

    const actionText = isEditing ? 'aggiornato' : 'salvato';
    pendingHighlightItemId = data.id;
    resetFormToCreateMode();
    setFeedback(`✅ Oggetto ${actionText}: ${data.name}`, 'success');
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

  const itemToDelete = allItems.find((item) => item.id === itemId);
  const itemDescription = itemToDelete
    ? `"${itemToDelete.name}" in ${itemToDelete.room} • ${itemToDelete.container}`
    : 'questo oggetto';
  const confirmed = window.confirm(`Confermi l'eliminazione di ${itemDescription}?`);
  if (!confirmed) {
    setFeedback('Eliminazione annullata.', '');
    return;
  }

  try {
    const dataStore = await getDataStore();
    const data = await dataStore.deleteItem(itemId);

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



exportBtn.addEventListener('click', exportBackup);
importBtn.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', async (event) => {
  const [file] = event.target.files;

  if (!file) {
    return;
  }

  await importBackupFile(file);
});
loadItems();



async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register('/service-worker.js');
  } catch (error) {
    console.warn('Registrazione service worker fallita:', error);
  }
}

registerServiceWorker();
