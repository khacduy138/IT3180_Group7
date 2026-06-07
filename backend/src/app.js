const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/households', require('./routes/households.routes'));
app.use('/api', require('./routes/fees.routes'));
app.use('/api/billing', require('./routes/billing.routes'));
app.use('/api/invoices', require('./routes/invoiceAliases.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
  });
});

app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
