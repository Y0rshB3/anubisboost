"use strict";

const BaseModel = require("./BaseModel");

class Role extends BaseModel {
  static get tableName() {
    return "roles";
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
        name: { type: "string", maxLength: 30 },
        description: { type: ["string", "null"], maxLength: 255 },
        created_at: { type: "string" },
      },
    };
  }

  static get relationMappings() {
    const User = require("./User");
    const Permission = require("./Permission");

    return {
      users: {
        relation: BaseModel.HasManyRelation,
        modelClass: User,
        join: { from: "roles.id", to: "users.role_id" },
      },
      permissions: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: Permission,
        join: {
          from: "roles.id",
          through: { from: "role_permissions.role_id", to: "role_permissions.permission_id" },
          to: "permissions.id",
        },
      },
    };
  }
}

module.exports = Role;
