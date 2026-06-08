const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.use(authenticate);

router.get('/filters', authorize({ roles: ['admin', 'accountant'] }), reportsController.getReportFilters);
router.get('/invoices', authorize({ roles: ['admin', 'accountant', 'staff'] }), reportsController.getInvoicesReport);
router.post('/export', authorize({ roles: ['admin', 'accountant'] }), reportsController.exportExcel);

module.exports = router;