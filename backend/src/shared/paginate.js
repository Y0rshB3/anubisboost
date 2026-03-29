"use strict";

/**
 * Paginate an Objection.js QueryBuilder.
 *
 * @param {import('objection').QueryBuilder} queryBuilder - Objection QueryBuilder (already filtered/ordered)
 * @param {number|string} page  - 1-based page number
 * @param {number|string} limit - items per page
 * @returns {{ data: any[], pagination: { page: number, limit: number, total: number, totalPages: number } }}
 */
async function paginate(queryBuilder, page = 1, limit = 20) {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const result = await queryBuilder.page(page - 1, limit);

  return {
    data: result.results,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
  };
}

module.exports = { paginate };
