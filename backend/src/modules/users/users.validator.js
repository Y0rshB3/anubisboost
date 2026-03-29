"use strict";

const Joi = require("joi");

const createUser = {
  body: Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().min(3).max(60).required(),
    password: Joi.string().min(8).required(),
    role_id: Joi.number().integer().min(1).max(3).required(),
  }),
};

const updateUser = {
  body: Joi.object({
    email: Joi.string().email(),
    username: Joi.string().min(3).max(60),
    avatar_url: Joi.string().uri().allow("", null),
    is_active: Joi.boolean(),
  }).min(1),
};

const changePassword = {
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required(),
  }),
};

const updateProfile = {
  body: Joi.object({
    username: Joi.string().min(3).max(60),
    avatar_url: Joi.string().uri().allow("", null),
  }).min(1),
};

module.exports = { createUser, updateUser, changePassword, updateProfile };
