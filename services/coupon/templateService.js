// services/coupon/templateService.js
// CRUD for coupon templates (reusable definitions for customers to claim later)

const AppError = require('../../utils/AppError');

const MODULE_NOT_INSTALLED_ERROR = new AppError('Coupon Templates module has not been installed.', 501);

async function createTemplate() {
  throw MODULE_NOT_INSTALLED_ERROR;
}

async function listTemplates() {
  throw MODULE_NOT_INSTALLED_ERROR;
}

async function getTemplate() {
  throw MODULE_NOT_INSTALLED_ERROR;
}

async function updateTemplate() {
  throw MODULE_NOT_INSTALLED_ERROR;
}

async function deleteTemplate() {
  throw MODULE_NOT_INSTALLED_ERROR;
}

module.exports = { createTemplate, listTemplates, getTemplate, updateTemplate, deleteTemplate };