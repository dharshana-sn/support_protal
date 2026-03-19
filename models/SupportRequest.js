const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupportRequest = sequelize.define('SupportRequest', {
  // Defect Identification
  summary: DataTypes.STRING,
  reportedBy: DataTypes.STRING,
  dateReported: DataTypes.DATEONLY,
  projectName: DataTypes.STRING,
  moduleFeature: DataTypes.STRING,
  environment: DataTypes.STRING,
  terraVersion: DataTypes.STRING,

  // Description
  detailedDescription: DataTypes.TEXT,
  preconditions: DataTypes.TEXT,

  // Steps to Reproduce
  step1: DataTypes.TEXT,
  step2: DataTypes.TEXT,
  step3: DataTypes.TEXT,
  expectedResult: DataTypes.TEXT,
  actualResult: DataTypes.TEXT,

  // Attachments
  screenshotsAttached: DataTypes.STRING,
  logFilesAttached: DataTypes.STRING,
  additionalNotes: DataTypes.TEXT,

  // Metadata
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = SupportRequest;
