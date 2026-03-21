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
  createItem,
  updateItem,
  removeItem,
};
