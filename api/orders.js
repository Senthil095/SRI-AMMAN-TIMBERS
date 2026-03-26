const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin SDK if not already done
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (err) {
    console.error('Firebase initialization error:', err.message);
  }
}

const db = admin.firestore();

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

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/orders?userId=xxx
  if (req.method === 'GET') {
    try {
      const { userId, orderId } = req.query;

      if (orderId) {
        // Fetch single order
        const doc = await db.collection('orders').doc(orderId).get();

        if (!doc.exists) {
          return res.status(404).json({ error: 'Order not found' });
        }

        const data = doc.data();
        const order = {
          id: doc.id,
          ...data,
          timestamp: data.timestamp
            ? new Date(data.timestamp).toISOString()
            : null,
        };

        return res.status(200).json({ order });
      }

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      // Fetch orders for user
      const snapshot = await db
        .collection('orders')
        .where('userId', '==', userId)
        .get();

      const orders = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp
            ? new Date(data.timestamp).toISOString()
            : null,
        };
      });

      // Sort by timestamp descending
      orders.sort((a, b) => {
        const timeA = a.timestamp
          ? new Date(a.timestamp).getTime()
          : 0;
        const timeB = b.timestamp
          ? new Date(b.timestamp).getTime()
          : 0;
        return timeB - timeA;
      });

      res.status(200).json({ orders });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({
        error: 'Failed to fetch orders',
        details: error.message,
      });
    }
  }

  // PUT /api/orders/:orderId/status
  else if (req.method === 'PUT') {
    try {
      const { orderId } = req.query;
      const { status } = req.body;

      if (!orderId) {
        return res.status(400).json({ error: 'orderId is required' });
      }

      if (!status) {
        return res.status(400).json({ error: 'status is required' });
      }

      const docRef = db.collection('orders').doc(orderId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const orderData = doc.data();

      await docRef.update({
        status: status,
        updatedAt: new Date().toISOString(),
      });

      // Send email
      sendOrderStatusEmail(orderId, orderData.customerName, orderData.userEmail, status).catch(
        (err) => console.error('Email error:', err)
      );

      // Log activity
      try {
        await db.collection('activityLogs').add({
          action: `Order #${orderId.slice(0, 8).toUpperCase()} status changed to ${status}`,
          module: 'Orders',
          user: 'Admin',
          createdAt: new Date().toISOString(),
        });
      } catch {
        // Logging not critical
      }

      res.status(200).json({
        success: true,
        message: `Order status updated to ${status}`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({
        error: 'Failed to update order status',
        details: error.message,
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};
