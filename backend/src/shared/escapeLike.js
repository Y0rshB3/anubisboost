"use strict";

function escapeLike(value) {
  if (typeof value !== "string") return value;
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

module.exports = { escapeLike };
