const { Sequelize } = require('sequelize');

const configs = require('../../config/config');

const environment = process.env.NODE_ENV || 'development';
const config = configs[environment] || configs.development;

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: config.logging ? console.log : false,
  define: {
    underscored: true,
  },
});

module.exports = sequelize;
