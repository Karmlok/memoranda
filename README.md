# Memoranda

Web app per ricordarsi dove sono stati riposti gli oggetti (es. `chiavi -> cassetto cucina`).

## Stack

- Backend: Node.js + Express
- Frontend: HTML/CSS/JS vanilla
- Persistenza: file JSON (`src/data/items.json`)

## Avvio rapido

```bash
npm install
npm start
```

App disponibile su: `http://localhost:3000`

## API REST

### `GET /api/items`
Restituisce la lista degli oggetti salvati.

### `POST /api/items`
Aggiunge un oggetto.

Body JSON richiesto:

```json
{
  "name": "Chiavi",
  "location": "Cassetto cucina"
}
```

## Struttura progetto

```text
memoranda/
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── src/
│   ├── app.js
│   ├── server.js
│   ├── controllers/
│   │   └── itemController.js
│   ├── routes/
│   │   └── itemRoutes.js
│   ├── services/
│   │   └── itemService.js
│   ├── utils/
│   │   └── jsonStore.js
│   ├── middlewares/
│   │   └── errorHandler.js
│   └── data/
│       └── items.json
└── package.json
```

Struttura modulare pensata per estensioni future (nuove risorse, DB reale, autenticazione, ecc.).
