const nodemailer = require('nodemailer');

const createTransporter = () => {
    // If SMTP credentials are provided, use them
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            service: 'gmail', // You can change this to your email provider (e.g. 'smtp.mailtrap.io', 'sendgrid', etc.)
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return null;
};

const sendOrderStatusEmail = async (orderId, customerName, userEmail, newStatus) => {
    if (!userEmail) {
        console.log(`[Email] No email attached to Order #${orderId}. Skipping notification.`);
        return false;
    }

    const transporter = createTransporter();

    if (!transporter) {
        console.warn(`[Email Warning] Order #${orderId} status changed to ${newStatus}.
         To send emails, please configure SMTP_USER and SMTP_PASS in backend/.env.
         Would have sent to: ${userEmail}`);
        return false;
    }

    const displayOrderId = orderId.slice(0, 8).toUpperCase();
    
    // Customize email content based on status
    let statusMessage = '';
    let statusIcon = '';
    
    switch (newStatus) {
        case 'Confirmed':
            statusMessage = 'Great news! Your order has been confirmed and is being processed.';
            statusIcon = '✅';
            break;
        case 'Packed':
            statusMessage = 'Your order is packed and ready to be shipped out soon!';
            statusIcon = '📦';
            break;
        case 'Out for Delivery':
            statusMessage = 'Your order is out for delivery! Our delivery partner will reach you soon.';
            statusIcon = '🚚';
            break;
        case 'Delivered':
            statusMessage = 'Your order has been delivered! Thank you for shopping with Sri Amman Paints.';
            statusIcon = '🎉';
            break;
        case 'Cancelled':
            statusMessage = 'Your order has been cancelled.';
            statusIcon = '❌';
            break;
        default:
            statusMessage = `Your order status has been updated to: ${newStatus}`;
            statusIcon = '🔔';
    }

    const mailOptions = {
        from: `"Sri Amman Paints" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: `Order Update: #${displayOrderId} is now ${newStatus}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e9ecef; border-radius: 10px; overflow: hidden;">
                <div style="background-color: #ff6b6b; padding: 20px; text-align: center; color: white;">
                    <h2 style="margin: 0;">Sri Amman Paints</h2>
                    <p style="margin: 5px 0 0;">Order Status Update</p>
                </div>
                <div style="padding: 30px; background-color: #ffffff;">
                    <h3 style="color: #212529; margin-top: 0;">Hi ${customerName || 'Customer'},</h3>
                    <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 40px; margin-bottom: 10px;">${statusIcon}</div>
                        <h2 style="color: #ff6b6b; margin: 0;">Order ${newStatus}</h2>
                        <p style="color: #6c757d; font-size: 16px; line-height: 1.5;">${statusMessage}</p>
                    </div>
                    
                    <p style="color: #495057;"><strong>Order ID:</strong> #${displayOrderId}</p>
                    <p style="color: #495057;">You can track your full order progress by logging into your account and navigating to <strong>My Orders</strong>.</p>
                    
                    <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;" />
                    <p style="color: #adb5bd; font-size: 13px; text-align: center; margin: 0;">
                        Need help? Contact our support team.
                    </p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Successfully sent status update to ${userEmail} for Order #${orderId}`);
        return true;
    } catch (error) {
        console.error(`[Email Error] Failed to send email to ${userEmail}:`, error);
        return false;
    }
};

module.exports = {
    sendOrderStatusEmail
};
