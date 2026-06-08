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
router.get('/demographics', authorize({ roles: ['admin', 'staff', 'accountant'] }), dashboardController.getDemographicStats );
router.get('/search', dashboardController.globalSearch);

router.get('/export-filters', authorize({ roles: ['admin', 'accountant'] }), dashboardController.getExportFilters);
router.post('/export', authorize({ roles: ['admin', 'accountant'] }), dashboardController.exportData);


module.exports = router;
