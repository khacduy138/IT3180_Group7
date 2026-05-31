require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// 1. Middlewares
app.use(helmet()); // Bảo mật header (mới thêm từ package.json)
app.use(cors());
app.use(express.json());

// 2. Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK'});
});

// 3. API Routes - Kết hợp từ cấu trúc develop
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/households', require('./routes/households.routes'));
app.use('/api', require('./routes/fees.routes'));
app.use('/api/billing', require('./routes/billing.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// 4. Export app để dùng cho Testing (Supertest)
module.exports = app;

// 5. Khởi chạy server - Chỉ chạy khi không phải môi trường test
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`[Server]: BlueMoon AMS Backend is running on port ${PORT}`);
  });
}
