const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ 
    message: 'Dashboard data - to be implemented',
    stats: {
      totalHouseholds: 0,
      totalFees: 0,
      totalBilling: 0
    }
  });
});

module.exports = router;
