const express = require('express');
const {
  createItem,
  listItems,
  exportItems,
  importItems,
  updateItem,
  removeItem,
} = require('../controllers/itemController');

const router = express.Router();

router.get('/', listItems);
router.get('/export', exportItems);
router.post('/import', importItems);
router.post('/', createItem);
router.put('/:id', updateItem);
router.delete('/:id', removeItem);

module.exports = router;
