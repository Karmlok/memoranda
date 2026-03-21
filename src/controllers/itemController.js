const itemService = require('../services/itemService');
const { saveBase64Image } = require('../utils/imageStore');

async function listItems(req, res, next) {
  try {
    const items = await itemService.getAllItems();
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
}

async function exportItems(req, res, next) {
  try {
    const items = await itemService.getAllItems();

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="memoranda-backup-${new Date().toISOString().slice(0, 10)}.json"`);
    res.status(200).send(JSON.stringify(items, null, 2));
  } catch (error) {
    next(error);
  }
}

function validateImportPayload(rawItems) {
  if (!Array.isArray(rawItems)) {
    throw new Error('Il file JSON deve contenere un array di oggetti.');
  }

  return rawItems.map((item) => {
    if (!item || typeof item !== 'object') {
      throw new Error('Ogni elemento del backup deve essere un oggetto valido.');
    }

    if (!item.name?.trim() || !item.room?.trim() || !item.container?.trim()) {
      throw new Error('Ogni oggetto deve avere name, room e container valorizzati.');
    }

    return {
      id: item.id,
      name: item.name,
      room: item.room,
      container: item.container,
      imagePath: item.imagePath || null,
      createdAt: item.createdAt,
    };
  });
}

async function importItems(req, res, next) {
  try {
    const payload = req.body;
    const rawItems = Array.isArray(payload) ? payload : payload?.items;
    const validItems = validateImportPayload(rawItems);

    const importedCount = await itemService.replaceAllItems(validItems);

    res.status(200).json({
      message: `Backup importato con successo. Oggetti ripristinati: ${importedCount}.`,
      importedCount,
    });
  } catch (error) {
    if (error instanceof Error && error.message) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
}

async function createItem(req, res, next) {
  try {
    const {
      name,
      room,
      container,
      imageData,
      imageName,
    } = req.body;

    if (
      !name?.trim()
      || !room?.trim()
      || !container?.trim()
    ) {
      return res.status(400).json({
        message: 'I campi name, room e container sono obbligatori.',
      });
    }

    const imagePath = await saveBase64Image(imageData, imageName || name);

    const item = await itemService.addItem({
      name,
      room,
      container,
      imagePath,
    });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

async function updateItem(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      room,
      container,
      imageData,
      imageName,
    } = req.body;

    if (
      !name?.trim()
      || !room?.trim()
      || !container?.trim()
    ) {
      return res.status(400).json({
        message: 'I campi name, room e container sono obbligatori.',
      });
    }

    const imagePath = await saveBase64Image(imageData, imageName || name);

    const item = await itemService.updateItem(id, {
      name,
      room,
      container,
      imagePath,
    });

    if (!item) {
      return res.status(404).json({ message: 'Oggetto non trovato.' });
    }

    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
}

async function removeItem(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await itemService.deleteItem(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Oggetto non trovato.' });
    }

    res.status(200).json({ message: 'Oggetto eliminato con successo.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listItems,
  exportItems,
  importItems,
  createItem,
  updateItem,
  removeItem,
};
