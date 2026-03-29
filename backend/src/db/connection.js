"use strict";

// Backward compatibility: re-export knex instance.
// Any old code that still does `require("./db/connection")` will get the knex instance.
module.exports = require("./knex");
