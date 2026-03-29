"use strict";

const BaseModel = require("./BaseModel");

class Faq extends BaseModel {
  static get tableName() { return "faqs"; }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["question", "answer"],
      properties: {
        id: { type: "integer" },
        category: { type: "string", enum: ["client", "admin"] },
        question: { type: "string" },
        answer: { type: "string" },
        sort_order: { type: "integer" },
        is_active: { type: "boolean" },
      },
    };
  }
}

module.exports = Faq;
