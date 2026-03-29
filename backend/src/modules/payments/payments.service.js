"use strict";

const Payment = require("../../models/Payment");
const Order = require("../../models/Order");
const ApiError = require("../../shared/ApiError");
const knex = require("../../db/knex");

async function listByOrder(orderId) {
  return Payment.query()
    .alias("p")
    .select("p.*", "u.username as recorded_by_name")
    .join("users as u", "p.recorded_by", "u.id")
    .where("p.order_id", orderId)
    .orderBy("p.paid_at", "desc");
}

async function record(orderId, recordedBy, data) {
  const payment = await Payment.query().insert({
    order_id: orderId,
    recorded_by: recordedBy,
    amount: data.amount,
    currency: data.currency || "USD",
    payment_type: data.payment_type,
    method: data.method,
    reference: data.reference || null,
    paid_at: data.paid_at || new Date(),
    notes: data.notes || null,
    proof_url: data.proof_url || null,
  });
  return { id: payment.id, order_id: orderId, ...data };
}

async function update(paymentId, data) {
  if (!Object.keys(data).length) return;
  await Payment.query().findById(paymentId).patch(data);
}

async function remove(paymentId) {
  await Payment.query().deleteById(paymentId);
}

async function summary(orderId) {
  const order = await Order.query().findById(orderId).select("total_price", "currency");
  if (!order) throw ApiError.notFound("Order not found");

  const result = await knex("payments")
    .where("order_id", orderId)
    .sum("amount as paid")
    .first();

  const paid = parseFloat(result.paid) || 0;
  return {
    total_price: order.total_price,
    paid,
    remaining: order.total_price - paid,
    currency: order.currency,
  };
}

module.exports = { listByOrder, record, update, remove, summary };
