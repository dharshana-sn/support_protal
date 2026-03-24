const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define('Comment', {
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  authorName: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Comment;
