// services/coupon/templateService.js
// CRUD for coupon templates (reusable definitions for customers to claim later)

const { query } = require('../../database/db');
const AppError = require('../../utils/AppError');

async function createTemplate({ title, description, image = null, couponType, couponValue = null, pointCost = null, claimStartAt = null, claimEndAt = null, couponExpireDays = null, couponExpireAt = null, quantityLimit = null, isActive = true, createdBy = null }) {
  const result = await query(
    `INSERT INTO coupon_templates (title, description, image, coupon_type, coupon_value, point_cost, claim_start_at, claim_end_at, coupon_expire_days, coupon_expire_at, quantity_limit, is_active, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [title, description || null, image || null, couponType || 'manual', couponValue, pointCost, claimStartAt, claimEndAt, couponExpireDays, couponExpireAt, quantityLimit, isActive, createdBy]
  );
  return result.rows[0];
}

async function listTemplates({ search, isActive } = {}) {
  const clauses = [];
  const params = [];
  let idx = 1;
  if (search) {
    clauses.push(`(LOWER(title) LIKE LOWER('%' || $${idx} || '%') OR LOWER(description) LIKE LOWER('%' || $${idx} || '%'))`);
    params.push(search);
    idx += 1;
  }
  if (typeof isActive !== 'undefined') {
    clauses.push(`is_active = $${idx}`);
    params.push(Boolean(isActive));
    idx += 1;
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const result = await query(`SELECT * FROM coupon_templates ${where} ORDER BY created_at DESC`, params);
  return result.rows;
}

async function getTemplate(id) {
  const result = await query(`SELECT * FROM coupon_templates WHERE id = $1`, [id]);
  return result.rows[0];
}

async function updateTemplate(id, patch) {
  const fields = [];
  const params = [];
  let idx = 1;
  for (const key of ['title','description','image','coupon_type','coupon_value','point_cost','claim_start_at','claim_end_at','coupon_expire_days','coupon_expire_at','quantity_limit','is_active']) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      fields.push(`${key} = $${idx}`);
      params.push(patch[key]);
      idx += 1;
    }
  }
  if (fields.length === 0) throw new AppError('No updatable fields provided', 400);
  params.push(id);
  const result = await query(`UPDATE coupon_templates SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`, params);
  if (!result.rows[0]) throw new AppError('Template not found', 404);
  return result.rows[0];
}

async function deleteTemplate(id) {
  const result = await query(`DELETE FROM coupon_templates WHERE id = $1 RETURNING id`, [id]);
  if (!result.rows[0]) throw new AppError('Template not found', 404);
  return result.rows[0];
}

module.exports = { createTemplate, listTemplates, getTemplate, updateTemplate, deleteTemplate };