# Memoranda

Web app per ricordarsi dove sono stati riposti gli oggetti (es. `chiavi -> cucina / cassetto cucina`).

## Stack

- Backend: Node.js + Express
- Frontend: HTML/CSS/JS vanilla
- Persistenza: SQLite (`src/data/items.db`)
- Upload immagini: file locali in `uploads/`

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
Aggiunge un oggetto. Supporta JSON con immagine opzionale (`imageData` in formato base64 Data URL + `imageName`).

Campi richiesti:

- `name`
- `room`
- `container`

### `PUT /api/items/:id`
Aggiorna un oggetto. Supporta JSON con immagine opzionale (`imageData` + `imageName`).

### `DELETE /api/items/:id`
Elimina un oggetto.

## Struttura progetto

```text
memoranda/
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── uploads/
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
│   │   └── sqliteStore.js
│   ├── middlewares/
│   │   └── errorHandler.js
│   └── data/
│       ├── items.db
│       └── items.json
└── package.json
```

Struttura modulare pensata per estensioni future (nuove risorse, DB reale, autenticazione, ecc.).
