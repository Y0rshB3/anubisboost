"use strict";

const { Model } = require("objection");

class BaseModel extends Model {
  $beforeValidate(jsonSchema, json, opt) {
    if (json) {
      for (const [key, val] of Object.entries(json)) {
        // Date → MySQL datetime string
        if (val instanceof Date) {
          json[key] = val.toISOString().slice(0, 19).replace("T", " ");
        }
        // String IDs → integer (e.g., from req.params)
        if (typeof val === "string" && (key === "id" || key.endsWith("_id")) && /^\d+$/.test(val)) {
          json[key] = parseInt(val, 10);
        }
        // DECIMAL string → number
        if (typeof val === "string" && key.match(/price|amount|value|total/) && !isNaN(val) && val !== "") {
          json[key] = parseFloat(val);
        }
      }
    }
    return jsonSchema;
  }
}

module.exports = BaseModel;
