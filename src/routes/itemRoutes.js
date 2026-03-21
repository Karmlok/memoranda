const express = require('express');
const {
  createItem,
  listItems,
  updateItem,
  removeItem,
} = require('../controllers/itemController');

const router = express.Router();

router.get('/', listItems);
router.post('/', createItem);
router.put('/:id', updateItem);
router.delete('/:id', removeItem);

module.exports = router;
