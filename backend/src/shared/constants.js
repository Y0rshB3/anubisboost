"use strict";

const ROLES = { ADMIN: "admin", COLLABORATOR: "collaborator", CLIENT: "client" };

const ORDER_STATUSES = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  PAYMENT_CONFIRMED: "payment_confirmed",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REJECTED: "rejected",
};

const VALID_TRANSITIONS = {
  pending: ["accepted", "rejected", "cancelled"],
  accepted: ["payment_confirmed", "cancelled"],
  payment_confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  rejected: [],
};

const CONTRACT_STATUSES = {
  DRAFT: "draft",
  PENDING_CLIENT: "pending_client",
  PENDING_ADMIN: "pending_admin",
  FULLY_SIGNED: "fully_signed",
  VOIDED: "voided",
};

module.exports = { ROLES, ORDER_STATUSES, VALID_TRANSITIONS, CONTRACT_STATUSES };
