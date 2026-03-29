"use strict";

const ApiError = require("../shared/ApiError");

function validate(schema) {
  return (req, _res, next) => {
    const targets = {};
    if (schema.body) targets.body = req.body;
    if (schema.query) targets.query = req.query;
    if (schema.params) targets.params = req.params;

    const errors = [];
    for (const [key, joiSchema] of Object.entries(schema)) {
      const { error, value } = joiSchema.validate(targets[key] || req[key], {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(...error.details.map((d) => ({ field: d.path.join("."), message: d.message })));
      } else {
        req[key] = value;
      }
    }

    if (errors.length) throw ApiError.validation(errors);
    next();
  };
}

module.exports = validate;
