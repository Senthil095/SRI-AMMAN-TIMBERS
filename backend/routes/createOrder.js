const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const { db, admin } = require('../firebaseAdmin');

router.post('/create-order', async (req, res) => {
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
            payment_capture: 1 // Auto capture
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // 2. Save "Pending" order to Firestore
        let orderId = 'temp_' + Date.now(); // Fallback if no DB
        if (db) {
            const orderRef = await db.collection('orders').add({
                userId: userId || 'guest',
                userEmail: userEmail || '',
                items: items,
                totalAmount: totalAmount,
                deliveryAddress: deliveryAddress || {},
                paymentStatus: 'Pending',
                orderStatus: 'Initiated',
                razorpayOrderId: razorpayOrder.id,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
            orderId = orderRef.id;
        } else {
             console.warn("Firestore not available! Order will only be created on Razorpay.");
        }

        // 3. Return response to frontend
        res.json({
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            key_id: process.env.RAZORPAY_KEY_ID,
            orderId: orderId, // The Firestore document ID
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order', details: error.message });
    }
});

module.exports = router;
