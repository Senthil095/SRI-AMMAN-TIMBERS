import Razorpay from 'razorpay';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
    const { userId, userEmail, items, totalAmount, deliveryAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Items are required to create an order' });
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Amount should be in paise
    const amountInPaise = Math.round(totalAmount * 100);

    // 1. Create order in Razorpay
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // Auto capture
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // 2. Save "Pending" order to Firestore
    let orderId = `temp_${Date.now()}`;
    try {
      const orderRef = await db.collection('orders').add({
        userId: userId || 'guest',
        userEmail: userEmail || '',
        customerName: deliveryAddress?.name || '',
        customerPhone: deliveryAddress?.phone || '',
        items: items,
        totalAmount: totalAmount,
        deliveryAddress: deliveryAddress || {},
        status: 'Pending',
        paymentStatus: 'Pending',
        orderStatus: 'Initiated',
        razorpayOrderId: razorpayOrder.id,
        timestamp: new Date().toISOString(),
      });
      orderId = orderRef.id;
    } catch (dbErr) {
      console.warn('Firestore error:', dbErr.message);
    }

    // 3. Return response to frontend
    res.status(200).json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      key_id: process.env.RAZORPAY_KEY_ID,
      orderId: orderId,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      error: 'Failed to create order',
      details: error.message,
    });
  }
}
