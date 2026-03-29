"use strict";

const AuditLog = require("../models/AuditLog");

function auditLog(action, opts = {}) {
  return (req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode >= 400) return;
      const entityId = opts.idParam ? req.params[opts.idParam] : null;
      AuditLog.query()
        .insert({
          user_id: req.user?.id || null,
          action,
          entity_type: opts.entity || null,
          entity_id: entityId || null,
          ip_address: req.ip,
          user_agent: req.headers["user-agent"]?.slice(0, 500) || null,
          new_value: opts.captureBody ? req.body : null,
        })
        .catch(() => {});
    });
    next();
  };
}

module.exports = auditLog;
