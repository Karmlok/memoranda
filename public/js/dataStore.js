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

async function request(path = '', options, fallbackMessage) {
  const response = await fetch(`${API_BASE}${path}`, options);
  return parseResponse(response, fallbackMessage);
}

export const dataStore = {
  async getAllItems() {
    return request('', undefined, 'Errore nel caricamento oggetti');
  },

  async getItem(id) {
    return request(`/${id}`, undefined, 'Oggetto non trovato');
  },

  async createItem(data) {
    return request('', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }, 'Errore durante il salvataggio');
  },

  async updateItem(id, data) {
    return request(`/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }, 'Errore durante il salvataggio');
  },

  async deleteItem(id) {
    return request(`/${id}`, {
      method: 'DELETE',
    }, "Errore durante l'eliminazione");
  },

  async searchItems(query) {
    const encodedQuery = encodeURIComponent(query || '');
    return request(`/search?q=${encodedQuery}`, undefined, 'Errore durante la ricerca');
  },

  async exportItems() {
    return request('/export', undefined, "Errore durante l'esportazione del backup.");
  },

  async importItems(data) {
    return request('/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }, "Errore durante l'importazione del backup.");
  },
};

window.dataStore = dataStore;
