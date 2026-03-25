const express = require('express');
const router = express.Router();
const { db } = require('../firebaseAdmin');

// GET /api/orders?userId=xxx — fetch orders for a specific user
router.get('/orders', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Only filter by userId — no orderBy to avoid composite index requirement
        const snapshot = await db.collection('orders')
            .where('userId', '==', userId)
            .get();

        const orders = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : null,
            };
        });

        // Sort by timestamp descending (newest first) server-side
        orders.sort((a, b) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return timeB - timeA;
        });

        res.json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
    }
});

// GET /api/admin/orders — fetch ALL orders for admin
router.get('/admin/orders', async (req, res) => {
    try {
        const snapshot = await db.collection('orders')
            .orderBy('timestamp', 'desc')
            .get();

        const orders = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : null,
            };
        });

        res.json({ orders });
    } catch (error) {
        console.error('Error fetching admin orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
    }
});

// PUT /api/admin/orders/:orderId/status — update order status (admin)
router.put('/admin/orders/:orderId/status', async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'status is required' });
        }

        await db.collection('orders').doc(orderId).update({
            status: status,
            updatedAt: new Date().toISOString(),
        });

        // Log activity
        try {
            await db.collection('activityLogs').add({
                action: `Order #${orderId.slice(0, 8).toUpperCase()} status changed to ${status}`,
                module: 'Orders',
                user: 'Admin',
                createdAt: new Date().toISOString(),
            });
        } catch { /* logging not critical */ }

        res.json({ success: true, message: `Order status updated to ${status}` });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status', details: error.message });
    }
});

module.exports = router;
