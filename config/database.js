const { Sequelize } = require('sequelize');
const path = require('path');

// Standard SQLite setup for local development
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false
});

console.log('Using Local SQLite Database (standard sqlite3)');

module.exports = sequelize;
