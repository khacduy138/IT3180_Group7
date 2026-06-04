const express = require('express');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get(
  '/',
  authenticate,
  authorize({ permission: 'users:read' }),
  (req, res) => {
    res.json({ message: 'Get users - to be implemented', data: [] });
  },
);

router.post('/', (req, res) => {
  res.json({ message: 'Create user - to be implemented' });
});

router.put('/:id', (req, res) => {
  res.json({ message: 'Update user - to be implemented' });
});

router.delete('/:id', (req, res) => {
  res.json({ message: 'Deactivate user - to be implemented' });
});

module.exports = router;
