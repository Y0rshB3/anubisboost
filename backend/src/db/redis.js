"use strict";

const { createClient } = require("redis");

let client = null;

async function connectRedis() {
  const url = process.env.REDIS_PASSWORD
    ? `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`
    : `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`;

  client = createClient({ url });

  client.on("error", (err) => {
    console.error("Redis client error:", err.message);
  });

  await client.connect();
  return client;
}

function getRedisClient() {
  return client;
}

module.exports = { connectRedis, getRedisClient };
