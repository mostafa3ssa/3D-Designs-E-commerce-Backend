import axios from 'axios';
import Order from '../models/order.model.js';

const API_KEY = process.env.PAYMOB_API_KEY;
const INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;

const getAuthToken = async () => {
  try {
    const response = await axios.post('https://accept.paymob.com/api/auth/tokens', {
      api_key: API_KEY
    });
    return response.data.token;
  } catch (error) {
    console.error('[Paymob Auth Error]', error.response?.data);
    throw new Error('Failed to authenticate with Paymob.');
  }
};

const registerOrder = async (authToken, order) => {
  const amountCents = order.totalPrice * 100;

  const orderRegistrationData = {
    auth_token: authToken,
    delivery_needed: "false",
    amount_cents: amountCents,
    currency: "EGP",
    merchant_order_id: order._id.toString(),
    items: order.orderItems.map(item => ({
      name: item.name,
      amount_cents: (item.price * 100).toFixed(0),
      description: item.productType,
      quantity: item.quantity
    })),
  };

  try {
    const response = await axios.post('https://accept.paymob.com/api/ecommerce/orders', orderRegistrationData);
    return response.data.id;
  } catch (error) {
    console.error('[Paymob Order Registration Error]', error.response?.data);
    throw new Error('Failed to register order with Paymob.');
  }
};

const getPaymentKey = async (authToken, paymobOrderId, order, userDetails) => {
  const amountCents = order.totalPrice * 100;

  const paymentKeyData = {
    auth_token: authToken,
    amount_cents: amountCents,
    expiration: 3600,
    order_id: paymobOrderId,
    billing_data: {
      first_name: userDetails.firstName,
      last_name: userDetails.lastName,
      email: userDetails.email,
      phone_number: userDetails.phone || "NA",
      street: order.shippingAddress.address || "NA",
      city: order.shippingAddress.city || "Alexandria",
      country: order.shippingAddress.country || "EG",
      floor: "NA",
      apartment: "NA",
      building: "NA"
    },
    currency: "EGP",
    integration_id: INTEGRATION_ID,
    lock_order_when_paid: "false"
  };

  try {
    const response = await axios.post('https://accept.paymob.com/api/acceptance/payment_keys', paymentKeyData);
    return response.data.token;
  } catch (error) {
    console.error('[Paymob Payment Key Error]', error.response?.data);
    throw new Error('Failed to get Paymob payment key.');
  }
};

export const generatePaymobPaymentKey = async (orderId, user) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }

    const userDetails = {
      firstName: user ? user.firstName : order.shippingAddress.firstName,
      lastName: user ? user.lastName : order.shippingAddress.lastName,
      email: user ? user.email : order.guestEmail,
      phone: "NA"
    };

    const authToken = await getAuthToken();
    const paymobOrderId = await registerOrder(authToken, order);
    const paymentKey = await getPaymentKey(authToken, paymobOrderId, order, userDetails);

    return paymentKey;
  } catch (error) {
    console.error('[Paymob Service Error]', error);
    throw error;
  }
};
