import crypto from 'crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';

// Initialize Firebase Admin
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(firebaseConfig),
    });
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
}

const db = getFirestore();

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendOrderStatusEmail(orderId, customerName, customerEmail, status) {
  try {
    const subject = `Order ${status}: #${orderId.slice(0, 8).toUpperCase()}`;
    const text = `Hello ${customerName},\n\nYour order #${orderId} status is now: ${status}\n\nThank you for shopping with us!`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject,
      text,
    });
    console.log(`Email sent to ${customerEmail}`);
  } catch (err) {
    console.error('Failed to send email:', err);
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { payment_id, order_id, signature, firebase_order_id } = req.body;

    // 1. Verify the signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${order_id}|${payment_id}`)
      .digest('hex');

    if (generatedSignature !== signature) {
      // Signature mismatch
      try {
        await db.collection('orders').doc(firebase_order_id).update({
          status: 'Cancelled',
          paymentStatus: 'Failed',
          razorpayPaymentId: payment_id,
        });
      } catch (err) {
        console.error('Failed to update order:', err);
      }
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // 2. Signature matched, payment successful
    try {
      const orderDoc = await db.collection('orders').doc(firebase_order_id).get();

      if (orderDoc.exists) {
        const orderData = orderDoc.data();
        const items = orderData.items || [];

        // Update stock in a transaction
        await db.runTransaction(async (transaction) => {
          const productRefs = items.map((item) =>
            db.collection('products').doc(item.id)
          );
          const productDocs = await Promise.all(
            productRefs.map((ref) => transaction.get(ref))
          );

          items.forEach((item, index) => {
            const productDoc = productDocs[index];
            if (!productDoc.exists) return;

            const productData = productDoc.data();
            const updateData = {};

            if (
              item.selectedSize &&
              productData.sizes &&
              productData.sizes.length > 0
            ) {
              const updatedSizes = productData.sizes.map((size) => {
                if (size.label === item.selectedSize.label) {
                  return {
                    ...size,
                    stock: Math.max(0, (size.stock || 0) - item.quantity),
                  };
                }
                return size;
              });
              updateData.sizes = updatedSizes;
              updateData.stock = Math.max(0, (productData.stock || 0) - item.quantity);
            } else {
              updateData.stock = Math.max(0, (productData.stock || 0) - item.quantity);
            }

            transaction.update(productRefs[index], updateData);
          });

          // Update order status
          transaction.update(db.collection('orders').doc(firebase_order_id), {
            status: 'Confirmed',
            paymentStatus: 'Paid',
            orderStatus: 'Placed',
            razorpayPaymentId: payment_id,
            razorpaySignature: signature,
          });
        });

        // Send email
        sendOrderStatusEmail(
          firebase_order_id,
          orderData.customerName,
          orderData.userEmail,
          'Confirmed'
        ).catch((err) => console.error('Email error:', err));
      } else {
        await db.collection('orders').doc(firebase_order_id).update({
          status: 'Confirmed',
          paymentStatus: 'Paid',
          orderStatus: 'Placed',
          razorpayPaymentId: payment_id,
          razorpaySignature: signature,
        });
      }
    } catch (dbErr) {
      console.error('Database error:', dbErr);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment',
      details: error.message,
    });
  }
}
