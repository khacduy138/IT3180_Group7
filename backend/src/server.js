if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config();
}

const app = require('./app');

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`[Server]: BlueMoon AMS Backend is running on port ${PORT}`);
  });
}

module.exports = app;
