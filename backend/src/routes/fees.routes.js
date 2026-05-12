const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Get fees - to be implemented', data: [] });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create fee - to be implemented' });
});

module.exports = router;
