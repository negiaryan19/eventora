const crypto = require('crypto');
const axios = require('axios');

const RAZORPAY_ORDERS_URL = 'https://api.razorpay.com/v1/orders';

function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;

  return {
    keyId,
    keySecret,
    isConfigured: Boolean(keyId && keySecret),
  };
}

function getRazorpayErrorMessage(error) {
  const responseData = error.response?.data;

  if (typeof responseData === 'string') {
    return responseData;
  }

  if (responseData && typeof responseData === 'object') {
    return JSON.stringify(responseData);
  }

  return error.message;
}

function getAuthHeader() {
  const { keyId, keySecret } = getRazorpayConfig();

  if (!keyId || !keySecret) {
    throw new Error('Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET before creating Razorpay orders.');
  }

  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
}

async function createRazorpayOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  const amountInPaise = Math.round(Number(amount) * 100);

  if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
    throw new Error('A valid payment amount is required.');
  }

  const { data } = await axios.post(
    RAZORPAY_ORDERS_URL,
    {
      amount: amountInPaise,
      currency,
      receipt,
      notes,
    },
    {
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  return data;
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const { keySecret } = getRazorpayConfig();

  if (!keySecret || !orderId || !paymentId || !signature) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

module.exports = {
  createRazorpayOrder,
  getRazorpayConfig,
  getRazorpayErrorMessage,
  verifyRazorpaySignature,
};
