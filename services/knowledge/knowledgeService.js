// services/knowledge/knowledgeService.js
// Knowledge Center foundation. Uses the existing `settings` table
// (key VARCHAR PRIMARY KEY, value JSONB, updated_at TIMESTAMPTZ) as
// the source of truth. No schema changes - INSERT/UPDATE/SELECT/DELETE
// only, via the existing database/db.js helper.
//
// `value` stores the knowledge object directly, e.g.
//   { title: 'Opening Hours', category: 'store', content: '09:00-20:00', order: 1 }

const { query } = require('../../database/db');

// Safe numeric ordering: value->>'order' may be missing or non-numeric
// on older/manually-entered rows, so only cast when it looks numeric,
// otherwise treat as NULL (sorted last).
const ORDER_BY_CATEGORY_ORDER_KEY = `
  ORDER BY value->>'category' ASC NULLS LAST,
    CASE WHEN value->>'order' ~ '^-?[0-9]+(\\.[0-9]+)?$'
         THEN (value->>'order')::numeric
         ELSE NULL END ASC NULLS LAST,
    key ASC
`;

/**
 * @param {string} key
 * @returns {Promise<{ key: string, value: any, updated_at: string } | null>}
 */
async function get(key) {
  const result = await query(
    `SELECT key, value, updated_at FROM settings WHERE key = $1`,
    [key]
  );
  return result.rows[0] || null;
}

/**
 * Creates or updates a knowledge entry. No schema change - just an
 * upsert into settings. `value` is stored as-is (the full knowledge
 * object), e.g. { title, category, content, order }.
 * @param {string} key
 * @param {object} value
 * @returns {Promise<{ key: string, value: any, updated_at: string }>}
 */
async function set(key, value) {
  const result = await query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value,
           updated_at = NOW()
     RETURNING key, value, updated_at`,
    [key, value]
  );
  return result.rows[0];
}

/**
 * Lists all knowledge entries ordered by category, then order, then key.
 * @returns {Promise<Array<{ key: string, value: any, updated_at: string }>>}
 */
async function list() {
  const result = await query(
    `SELECT key, value, updated_at FROM settings ${ORDER_BY_CATEGORY_ORDER_KEY}`
  );
  return result.rows;
}

/**
 * Lists knowledge entries belonging to a single category, using a
 * PostgreSQL JSONB query on value->>'category'. Ordered by order, then key.
 * @param {string} category
 * @returns {Promise<Array<{ key: string, value: any, updated_at: string }>>}
 */
async function getByCategory(category) {
  const result = await query(
    `SELECT key, value, updated_at
     FROM settings
     WHERE value->>'category' = $1
     ORDER BY
       CASE WHEN value->>'order' ~ '^-?[0-9]+(\\.[0-9]+)?$'
            THEN (value->>'order')::numeric
            ELSE NULL END ASC NULLS LAST,
       key ASC`,
    [category]
  );
  return result.rows;
}

/**
 * Internal only - intentionally not exposed via any route.
 * @param {string} key
 * @returns {Promise<{ key: string } | null>} the deleted key, or null if it didn't exist
 */
async function remove(key) {
  const result = await query(
    `DELETE FROM settings WHERE key = $1 RETURNING key`,
    [key]
  );
  return result.rows[0] || null;
}

module.exports = { get, set, list, getByCategory, remove };