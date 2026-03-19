const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.TURSO_DATABASE_URL) {
  // Production: Cloud SQLite (Turso)
  sequelize = new Sequelize('libsql', null, null, {
    dialect: 'sqlite',
    storage: process.env.TURSO_DATABASE_URL,
    dialectModule: { Database: require('libsql') }, 
    dialectOptions: {
      authToken: process.env.TURSO_AUTH_TOKEN,
    },
    logging: false
  });
  console.log('Using Production Database (Turso)');
} else {
  // Development: Local SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: false
  });
  console.log('Using Local SQLite Database');
}

module.exports = sequelize;
