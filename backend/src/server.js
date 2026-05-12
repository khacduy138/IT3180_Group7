require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/households', require('./routes/households.routes'));
app.use('/api/fees', require('./routes/fees.routes'));
app.use('/api/billing', require('./routes/billing.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
