const API_BASE = '/api/items';

async function parseResponse(response, fallbackMessage) {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (isJson && payload && payload.message)
      || fallbackMessage
      || 'Richiesta non riuscita.';
    throw new Error(message);
  }

  return payload;
}

export const dataStore = {
  async getAllItems() {
    const response = await fetch(API_BASE);
    return parseResponse(response, 'Errore nel caricamento oggetti');
  },

  async getItem(id) {
    const response = await fetch(`${API_BASE}/${id}`);
    return parseResponse(response, 'Oggetto non trovato');
  },

  async createItem(data) {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return parseResponse(response, 'Errore durante il salvataggio');
  },

  async updateItem(id, data) {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return parseResponse(response, 'Errore durante il salvataggio');
  },

  async deleteItem(id) {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    return parseResponse(response, "Errore durante l'eliminazione");
  },

  async searchItems(query) {
    const encodedQuery = encodeURIComponent(query || '');
    const response = await fetch(`${API_BASE}/search?q=${encodedQuery}`);
    return parseResponse(response, 'Errore durante la ricerca');
  },

  async exportItems() {
    const response = await fetch(`${API_BASE}/export`);
    return parseResponse(response, "Errore durante l'esportazione del backup.");
  },

  async importItems(data) {
    const response = await fetch(`${API_BASE}/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return parseResponse(response, "Errore durante l'importazione del backup.");
  },
};

window.dataStore = dataStore;
