"use strict";

const BaseModel = require("./BaseModel");

class ContractPolicy extends BaseModel {
  static get tableName() {
    return "contract_policies";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["name", "content_template"],
      properties: {
        id: { type: "integer" },
        name: { type: "string", maxLength: 150 },
        content_template: { type: "string" },
        is_default: { type: "boolean", default: false },
        is_active: { type: "boolean", default: true },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }
}

module.exports = ContractPolicy;
