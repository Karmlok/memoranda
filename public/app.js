const form = document.getElementById('item-form');
const itemsList = document.getElementById('items-list');
const feedback = document.getElementById('feedback');
const refreshBtn = document.getElementById('refresh-btn');

function setFeedback(message, type = '') {
  feedback.textContent = message;
  feedback.className = `feedback ${type}`.trim();
}

function renderItems(items) {
  itemsList.innerHTML = '';

  if (!items.length) {
    const li = document.createElement('li');
    li.textContent = 'Nessun oggetto salvato per ora.';
    itemsList.appendChild(li);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${item.name}</strong> → ${item.location}`;
    itemsList.appendChild(li);
  });
}

async function loadItems() {
  try {
    const response = await fetch('/api/items');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Errore nel caricamento oggetti');
    }

    renderItems(data);
  } catch (error) {
    setFeedback(error.message, 'error');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    name: formData.get('name'),
    location: formData.get('location'),
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

loadItems();
