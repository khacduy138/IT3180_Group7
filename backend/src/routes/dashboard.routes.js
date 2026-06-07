const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate);

router.get('/summary', authorize({ roles: ['admin', 'accountant'] }), dashboardController.getSummary);
router.get('/trending', authorize({ roles: ['admin', 'accountant'] }), dashboardController.getTrending);
router.get('/distribution', authorize({ roles: ['admin', 'accountant'] }), dashboardController.getFeeDistribution);
router.get('/recent-payments', authorize({ roles: ['admin', 'accountant', 'staff'] }), dashboardController.getRecentPayments);

router.get('/reports/by-period', authorize({ roles: ['admin', 'accountant'] }), dashboardController.getReportByPeriod);
router.get('/search', dashboardController.globalSearch);

module.exports = router;
