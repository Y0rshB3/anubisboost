"use strict";

const BaseModel = require("./BaseModel");

class PriceRule extends BaseModel {
  static get tableName() {
    return "price_rules";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["service_id", "name", "rule_type", "value"],
      properties: {
        id: { type: "integer" },
        service_id: { type: "integer" },
        name: { type: "string", maxLength: 100 },
        rule_type: { type: "string", enum: ["fixed_add", "percent_add", "fixed_sub", "percent_sub"] },
        value: { type: "number" },
        is_active: { type: "boolean", default: true },
        valid_from: { type: ["string", "null"] },
        valid_until: { type: ["string", "null"] },
        created_at: { type: "string" },
        updated_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const Service = require("./Service");

    return {
      service: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: Service,
        join: { from: "price_rules.service_id", to: "services.id" },
      },
    };
  }
}

module.exports = PriceRule;
