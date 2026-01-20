import Order from '../models/order.model.js';
import { generatePaymobPaymentKey } from '../services/paymob.service.js';
import crypto from 'crypto';

export const getPaymobPaymentKey = async (req, res) => {
  try {
    const { orderId } = req.body;
    const user = req.user;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.user && order.user.toString() !== user?._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to pay for this order.' });
    }
    
    if (order.isPaid) {
        return res.status(400).json({ message: 'Order is already paid.' });
    }

    const paymentKey = await generatePaymobPaymentKey(orderId, user);
    
    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

    res.status(200).json({ paymentKey, iframeUrl });

  } catch (error) {
    console.error('[Get Payment Key Error]', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

export const handlePaymobWebhook = async (req, res) => {
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
  const { obj: data } = req.body;
  
  const receivedHmac = req.query.hmac;

  const concatenatedString = 
    data.amount_cents +
    data.created_at +
    data.currency +
    data.error_occured +
    data.has_parent_transaction +
    data.id +
    data.integration_id +
    data.is_3d_secure +
    data.is_auth +
    data.is_capture +
    data.is_refund +
    data.is_refunded +
    data.is_standalone_payment +
    data.is_void +
    data.is_voided +
    data.order.id +
    data.owner +
    data.pending +
    data.source_data.pan +
    data.source_data.sub_type +
    data.source_data.type +
    data.success;

  const calculatedHmac = crypto.createHmac('sha512', hmacSecret).update(concatenatedString).digest('hex');

  if (calculatedHmac !== receivedHmac) {
    console.error('[Paymob Webhook Error] Invalid HMAC signature.');
    return res.status(401).json({ message: 'Invalid HMAC signature.' });
  }

  if (data.success && data.is_capture) {
    try {
      const orderId = data.order.merchant_order_id;
      const order = await Order.findById(orderId);
      
      if (order && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentResult = {
          id: data.id,
          status: data.pending ? 'Pending' : 'Success',
          update_time: data.created_at,
          email_address: data.source_data.pan 
        };
        await order.save();
        console.log(`[Paymob Webhook] Order ${orderId} has been paid successfully.`);
      }
    } catch (error) {
      console.error('[Paymob Webhook] Error updating order:', error);
    }
  }
  
  res.status(200).json({ message: 'Webhook received.' });
};
