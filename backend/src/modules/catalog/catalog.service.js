"use strict";

const Game = require("../../models/Game");
const Platform = require("../../models/Platform");
const ServiceType = require("../../models/ServiceType");
const Service = require("../../models/Service");
const PriceRule = require("../../models/PriceRule");
const ApiError = require("../../shared/ApiError");
const { paginate } = require("../../shared/paginate");
const { escapeLike } = require("../../shared/escapeLike");
const slugify = require("slugify");
const knex = require("../../db/knex");

// --- Games ---
async function listGames({ page, limit, search, active }) {
  const query = Game.query()
    .alias("g")
    .select("g.*")
    .select(Game.raw("GROUP_CONCAT(p.name) AS platforms"))
    .leftJoin("game_platforms as gp", "g.id", "gp.game_id")
    .leftJoin("platforms as p", "gp.platform_id", "p.id")
    .whereNull("g.deleted_at")
    .groupBy("g.id")
    .orderBy("g.sort_order")
    .orderBy("g.name");

  if (active !== undefined) {
    query.where("g.is_active", active === "true" ? 1 : 0);
  }
  if (search) {
    query.where("g.name", "like", `%${escapeLike(search)}%`);
  }

  return paginate(query, page, limit);
}

async function getGame(id) {
  const game = await Game.query()
    .alias("g")
    .select("g.*")
    .select(
      Game.raw("GROUP_CONCAT(p.id) AS platform_ids"),
      Game.raw("GROUP_CONCAT(p.name) AS platform_names")
    )
    .leftJoin("game_platforms as gp", "g.id", "gp.game_id")
    .leftJoin("platforms as p", "gp.platform_id", "p.id")
    .where("g.id", id)
    .whereNull("g.deleted_at")
    .groupBy("g.id")
    .first();

  if (!game) throw ApiError.notFound("Game not found");
  return game;
}

async function createGame({ name, description, cover_url, is_active, platform_ids }) {
  const slug = slugify(name, { lower: true, strict: true });
  const game = await Game.query().insert({
    name,
    slug,
    description: description || null,
    cover_url: cover_url || null,
    is_active: is_active !== false,
  });

  if (platform_ids?.length) {
    const rows = platform_ids.map((pid) => ({ game_id: game.id, platform_id: pid }));
    await knex("game_platforms").insert(rows);
  }
  return getGame(game.id);
}

async function updateGame(id, data) {
  const { platform_ids, ...fields } = data;
  if (fields.name) fields.slug = slugify(fields.name, { lower: true, strict: true });

  if (Object.keys(fields).length) {
    await Game.query().findById(id).patch(fields);
  }
  if (platform_ids) {
    await knex("game_platforms").where("game_id", id).del();
    if (platform_ids.length) {
      const rows = platform_ids.map((p) => ({ game_id: id, platform_id: p }));
      await knex("game_platforms").insert(rows);
    }
  }
  return getGame(id);
}

async function deleteGame(id) {
  await Game.query().findById(id).patch({ deleted_at: new Date() });
}

// --- Platforms ---
async function listPlatforms() {
  return Platform.query().where("is_active", true).orderBy("name");
}

async function createPlatform({ name, icon_url }) {
  const slug = slugify(name, { lower: true, strict: true });
  const platform = await Platform.query().insert({ name, slug, icon_url: icon_url || null });
  return { id: platform.id, name, slug, icon_url };
}

async function updatePlatform(id, data) {
  if (data.name) data.slug = slugify(data.name, { lower: true, strict: true });
  await Platform.query().findById(id).patch(data);
}

async function deletePlatform(id) {
  await Platform.query().deleteById(id);
}

// --- Service Types ---
async function listServiceTypes() {
  return ServiceType.query().where("is_active", true).orderBy("name");
}

async function createServiceType({ name, description }) {
  const slug = slugify(name, { lower: true, strict: true });
  const st = await ServiceType.query().insert({ name, slug, description: description || null });
  return { id: st.id, name, slug };
}

// --- Services ---
async function listServices({ page, limit, game_id, platform_id, type_id, search }) {
  const query = Service.query()
    .alias("s")
    .select(
      "s.*",
      "g.name as game_name", "g.cover_url as game_cover",
      "p.name as platform_name", "st.name as type_name"
    )
    .join("games as g", "s.game_id", "g.id")
    .join("platforms as p", "s.platform_id", "p.id")
    .join("service_types as st", "s.service_type_id", "st.id")
    .whereNull("s.deleted_at")
    .where("s.is_active", true)
    .orderBy("s.sort_order")
    .orderBy("s.name");

  if (game_id) query.where("s.game_id", game_id);
  if (platform_id) query.where("s.platform_id", platform_id);
  if (type_id) query.where("s.service_type_id", type_id);
  if (search) query.where("s.name", "like", `%${escapeLike(search)}%`);

  return paginate(query, page, limit);
}

async function getService(id) {
  const svc = await Service.query()
    .alias("s")
    .select(
      "s.*",
      "g.name as game_name", "g.cover_url as game_cover",
      "p.name as platform_name", "st.name as type_name"
    )
    .join("games as g", "s.game_id", "g.id")
    .join("platforms as p", "s.platform_id", "p.id")
    .join("service_types as st", "s.service_type_id", "st.id")
    .where("s.id", id)
    .whereNull("s.deleted_at")
    .first();

  if (!svc) throw ApiError.notFound("Service not found");

  const rules = await PriceRule.query()
    .where("service_id", id)
    .where("is_active", true);

  return { ...svc, price_rules: rules };
}

async function createService(data) {
  const svc = await Service.query().insert({
    game_id: data.game_id,
    platform_id: data.platform_id,
    service_type_id: data.service_type_id,
    name: data.name,
    description: data.description || null,
    base_price: data.base_price,
    currency: data.currency || "USD",
    estimated_days: data.estimated_days || null,
    metadata: data.metadata || null,
  });
  return getService(svc.id);
}

async function updateService(id, data) {
  const allowed = ["name", "description", "base_price", "currency", "estimated_days", "is_active", "sort_order", "metadata"];
  const fields = {};
  for (const k of allowed) {
    if (data[k] !== undefined) fields[k] = data[k];
  }
  if (Object.keys(fields).length) {
    await Service.query().findById(id).patch(fields);
  }
  return getService(id);
}

async function deleteService(id) {
  await Service.query().findById(id).patch({ deleted_at: new Date() });
}

// --- Price Rules ---
async function addPriceRule(serviceId, data) {
  const rule = await PriceRule.query().insert({
    service_id: serviceId,
    name: data.name,
    rule_type: data.rule_type,
    value: data.value,
    valid_from: data.valid_from || null,
    valid_until: data.valid_until || null,
  });
  return { id: rule.id, ...data };
}

async function deletePriceRule(ruleId) {
  await PriceRule.query().deleteById(ruleId);
}

module.exports = {
  listGames, getGame, createGame, updateGame, deleteGame,
  listPlatforms, createPlatform, updatePlatform, deletePlatform,
  listServiceTypes, createServiceType,
  listServices, getService, createService, updateService, deleteService,
  addPriceRule, deletePriceRule,
};
