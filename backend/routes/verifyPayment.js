const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../firebaseAdmin');

router.post('/verify-payment', async (req, res) => {
    try {
        const { payment_id, order_id, signature, firebase_order_id } = req.body;
        
        // 1. Verify the signature
        const secret = process.env.RAZORPAY_KEY_SECRET;
        
        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(order_id + '|' + payment_id)
            .digest('hex');

        if (generatedSignature !== signature) {
            // Signature mismatch, update DB status to Failed
             if (db && firebase_order_id) {
                await db.collection('orders').doc(firebase_order_id).update({
                    paymentStatus: 'Failed',
                    razorpayPaymentId: payment_id
                });
             }
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }

        // 2. Signature matched, payment successful
        if (db && firebase_order_id) {
            
            // Get the order document to find the items we need to subtract stock for
            const orderDoc = await db.collection('orders').doc(firebase_order_id).get();
            
            if (orderDoc.exists) {
                 const orderData = orderDoc.data();
                 const items = orderData.items || [];
                 
                 // Run a transaction to update stock
                 await db.runTransaction(async (transaction) => {
                      const productRefs = items.map(item => db.collection('products').doc(item.id));
                      const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));
                      
                      items.forEach((item, index) => {
                          const productDoc = productDocs[index];
                          if (!productDoc.exists) return;

                          const productData = productDoc.data();
                          const updateData = {};

                          if (item.selectedSize && productData.sizes && productData.sizes.length > 0) {
                              const updatedSizes = productData.sizes.map(size => {
                                  if (size.label === item.selectedSize.label) {
                                      return { ...size, stock: Math.max(0, (size.stock || 0) - item.quantity) };
                                  }
                                  return size;
                              });
                              updateData.sizes = updatedSizes;
                              // Top level stock check
                              updateData.stock = Math.max(0, (productData.stock || 0) - item.quantity);
                          } else {
                              updateData.stock = Math.max(0, (productData.stock || 0) - item.quantity);
                          }

                          transaction.update(productRefs[index], updateData);
                      });
                      
                      // Also update the order status
                      transaction.update(db.collection('orders').doc(firebase_order_id), {
                          paymentStatus: 'Paid',
                          orderStatus: 'Placed',
                          razorpayPaymentId: payment_id,
                          razorpaySignature: signature
                      });
                 });
                 
            } else {
               // Order document doesn't exist, just try to update
               await db.collection('orders').doc(firebase_order_id).update({
                    paymentStatus: 'Paid',
                    orderStatus: 'Placed',
                    razorpayPaymentId: payment_id,
                    razorpaySignature: signature
                });
            }
        }

        res.status(200).json({ success: true, message: 'Payment verified successfully' });

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, error: 'Failed to verify payment', details: error.message });
    }
});

module.exports = router;
