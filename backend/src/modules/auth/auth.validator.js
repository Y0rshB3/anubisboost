"use strict";

const Joi = require("joi");

const register = {
  body: Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().min(3).max(60).pattern(/^[a-zA-Z0-9_]+$/).required(),
    password: Joi.string().min(8).max(128).required(),
  }),
};

const login = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object({ email: Joi.string().email().required() }),
};

const resetPassword = {
  body: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).max(128).required(),
  }),
};

module.exports = { register, login, forgotPassword, resetPassword };
