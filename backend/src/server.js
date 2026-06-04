require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Server]: BlueMoon AMS Backend is running on port ${PORT}`);
  });
}

module.exports = app;
