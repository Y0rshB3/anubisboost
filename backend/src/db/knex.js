"use strict";

const Knex = require("knex");
const { Model } = require("objection");

const knex = Knex({
  client: "mysql2",
  connection: {
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10),
    user: process.env.MYSQL_USER || "anubisboost",
    password: process.env.MYSQL_PASSWORD || "changeme_dev_only",
    database: process.env.MYSQL_DATABASE || "anubisboost",
  },
  pool: { min: 2, max: 10 },
});

Model.knex(knex);

module.exports = knex;
