"use strict";

const BaseModel = require("./BaseModel");

class AuditLog extends BaseModel {
  static get tableName() {
    return "audit_logs";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["action"],
      properties: {
        id: { type: "integer" },
        user_id: { type: ["integer", "null"] },
        action: { type: "string", maxLength: 100 },
        entity_type: { type: ["string", "null"], maxLength: 60 },
        entity_id: { type: ["integer", "null"] },
        old_value: { type: ["object", "null"] },
        new_value: { type: ["object", "null"] },
        ip_address: { type: ["string", "null"], maxLength: 45 },
        user_agent: { type: ["string", "null"], maxLength: 500 },
        request_id: { type: ["string", "null"], maxLength: 36 },
        created_at: { type: "string" },
      },
    };
  }
}

module.exports = AuditLog;
