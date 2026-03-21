const form = document.getElementById('item-form');
const itemsList = document.getElementById('items-list');
const feedback = document.getElementById('feedback');
const refreshBtn = document.getElementById('refresh-btn');
const searchInput = document.getElementById('search-input');
let allItems = [];

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
    `;
    itemsList.appendChild(li);
  });
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
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Errore durante il salvataggio');
    }

    form.reset();
    setFeedback(`Oggetto salvato: ${data.name}`, 'success');
    await loadItems();
  } catch (error) {
    setFeedback(error.message, 'error');
  }
});

refreshBtn.addEventListener('click', loadItems);
searchInput.addEventListener('input', applySearchFilter);

loadItems();
