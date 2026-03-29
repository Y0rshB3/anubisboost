"use strict";

const BaseModel = require("./BaseModel");

class Permission extends BaseModel {
  static get tableName() {
    return "permissions";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["name"],
      properties: {
        id: { type: "integer" },
        name: { type: "string", maxLength: 80 },
        description: { type: ["string", "null"], maxLength: 255 },
        created_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const Role = require("./Role");

    return {
      roles: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: Role,
        join: {
          from: "permissions.id",
          through: { from: "role_permissions.permission_id", to: "role_permissions.role_id" },
          to: "roles.id",
        },
      },
    };
  }
}

module.exports = Permission;
