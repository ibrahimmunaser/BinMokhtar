import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY not set - emails will not be sent');
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Domain verified in Resend - using binmukhtarretail.com
const FROM_EMAIL = process.env.FROM_EMAIL || 'Bin Mukhtar Retail <orders@binmukhtarretail.com>';
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL || 'info@binmukhtarretail.com';

interface OrderConfirmationEmailData {
  customerEmail: string;
  customerName: string;
  orderId: string;
  orderNumber: string;
  items: Array<{
    title: string;
    qty: number;
    unitPrice: number;
    imageUrl?: string;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  fulfillmentMethod: 'delivery' | 'pickup';
  shippingAddress?: {
    fullName: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(data: OrderConfirmationEmailData) {
  console.log('📧 ===== sendOrderConfirmationEmail STARTED =====');
  console.log('📧 Timestamp:', new Date().toISOString());
  console.log('📧 Customer email:', data.customerEmail);
  console.log('📧 Customer name:', data.customerName);
  console.log('📧 Order number:', data.orderNumber);
  console.log('📧 Items count:', data.items.length);
  console.log('📧 Fulfillment method:', data.fulfillmentMethod);
  
  console.log('📧 Environment check:');
  console.log('  - RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
  console.log('  - RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length || 0);
  console.log('  - RESEND_API_KEY starts with "re_":', process.env.RESEND_API_KEY?.startsWith('re_') || false);
  console.log('  - RESEND_API_KEY first 10 chars:', process.env.RESEND_API_KEY?.substring(0, 10) || 'NOT SET');
  console.log('  - Resend instance exists:', !!resend);
  console.log('  - FROM_EMAIL:', FROM_EMAIL);
  console.log('  - REPLY_TO_EMAIL:', REPLY_TO_EMAIL);
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not set in environment variables');
    console.error('❌ Add RESEND_API_KEY=re_... to your Render environment variables');
    console.error('❌ For local testing, add to .env.local file');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }
  
  if (!resend) {
    console.error('❌ Resend instance not created - check RESEND_API_KEY format');
    console.error('❌ RESEND_API_KEY should start with "re_"');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const formatPrice = (cents: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: data.currency || 'USD',
      }).format(cents / 100);
    };

    console.log('📧 Preparing email payload:');
    console.log('  - From:', FROM_EMAIL);
    console.log('  - To:', data.customerEmail);
    console.log('  - Reply-to:', REPLY_TO_EMAIL);
    console.log('  - Subject:', `Order Confirmation - ${data.orderNumber}`);
    
    console.log('📧 Calling resend.emails.send...');
    const emailPayload = {
      from: FROM_EMAIL,
      to: data.customerEmail,
      reply_to: REPLY_TO_EMAIL,
      subject: `Order Confirmation - ${data.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f5f2ee; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 28px; color: #111;">Thank You for Your Order!</h1>
              <p style="margin: 10px 0 0; color: #666;">Order #${data.orderNumber}</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ddd;">
              <h2 style="margin-top: 0; font-size: 20px; color: #111;">Order Details</h2>
              
              ${data.items.map(item => `
                <div style="display: flex; gap: 15px; padding: 15px 0; border-bottom: 1px solid #eee;">
                  ${item.imageUrl ? `
                    <img src="${item.imageUrl}" alt="${item.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">
                  ` : ''}
                  <div style="flex: 1;">
                    <h3 style="margin: 0 0 5px; font-size: 16px; color: #111;">${item.title}</h3>
                    <p style="margin: 0; color: #666; font-size: 14px;">Quantity: ${item.qty}</p>
                    <p style="margin: 5px 0 0; font-weight: bold; color: #111;">${formatPrice(item.unitPrice * item.qty)}</p>
                  </div>
                </div>
              `).join('')}
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ddd;">
              <h2 style="margin-top: 0; font-size: 20px; color: #111;">Order Summary</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Subtotal:</td>
                  <td style="text-align: right; padding: 8px 0; color: #111;">${formatPrice(data.subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Shipping:</td>
                  <td style="text-align: right; padding: 8px 0; color: #111;">${data.shipping > 0 ? formatPrice(data.shipping) : 'FREE'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Tax:</td>
                  <td style="text-align: right; padding: 8px 0; color: #111;">${formatPrice(data.tax)}</td>
                </tr>
                <tr style="border-top: 2px solid #111;">
                  <td style="padding: 12px 0; font-weight: bold; color: #111; font-size: 18px;">Total:</td>
                  <td style="text-align: right; padding: 12px 0; font-weight: bold; color: #111; font-size: 18px;">${formatPrice(data.total)}</td>
                </tr>
              </table>
            </div>

            ${data.fulfillmentMethod === 'delivery' && data.shippingAddress ? `
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ddd;">
                <h2 style="margin-top: 0; font-size: 20px; color: #111;">Shipping Address</h2>
                <p style="margin: 5px 0; color: #666;">
                  ${data.shippingAddress.fullName}<br>
                  ${data.shippingAddress.address}${data.shippingAddress.address2 ? `<br>${data.shippingAddress.address2}` : ''}<br>
                  ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}<br>
                  ${data.shippingAddress.country}
                </p>
              </div>
            ` : ''}

            ${data.fulfillmentMethod === 'pickup' ? `
              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ffc107;">
                <h2 style="margin-top: 0; font-size: 20px; color: #856404;">Pickup Instructions</h2>
                <p style="margin: 5px 0; color: #856404;">
                  <strong>We are located in Detroit Metro Area.</strong><br>
                  To arrange your pickup, please send us a direct message on Instagram with your order reference (#${data.orderNumber}).
                </p>
                <p style="margin: 15px 0 0;">
                  <a href="https://www.instagram.com/binmukhtarretail?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
                     style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #833AB4, #E1306C); color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    DM on Instagram
                  </a>
                </p>
              </div>
            ` : ''}

            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ddd;">
              <h2 style="margin-top: 0; font-size: 20px; color: #111;">What's Next?</h2>
              ${data.fulfillmentMethod === 'delivery' ? `
                <p style="margin: 5px 0; color: #666;">
                  Our team will carefully prepare your order. This usually takes 1-2 business days. Once shipped, you'll receive tracking information via email.
                </p>
              ` : `
                <p style="margin: 5px 0; color: #666;">
                  Our team will carefully prepare your order. Once ready, we'll contact you via Instagram to arrange pickup.
                </p>
              `}
            </div>

            <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
              <p style="margin: 0;">Questions about your order?</p>
              <p style="margin: 5px 0;">
                <a href="mailto:${REPLY_TO_EMAIL}" style="color: #111; text-decoration: underline;">Contact us</a>
              </p>
              <p style="margin: 20px 0 0; font-size: 12px;">
                © ${new Date().getFullYear()} Bin Mukhtar Retail. All rights reserved.
              </p>
            </div>
          </body>
        </html>
      `,
    };
    
    console.log('📧 Email payload prepared, sending...');
    const startTime = Date.now();
    const { data: emailData, error } = await resend.emails.send(emailPayload);
    const duration = Date.now() - startTime;
    
    console.log('📧 Resend API call completed in', duration, 'ms');
    
    if (error) {
      console.error('❌ ===== EMAIL SEND FAILED =====');
      console.error('❌ Resend API error:', JSON.stringify(error, null, 2));
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error keys:', Object.keys(error || {}));
      return { success: false, error: JSON.stringify(error) };
    }

    console.log('✅ ===== EMAIL SEND SUCCESS =====');
    console.log('✅ Email sent to:', data.customerEmail);
    console.log('✅ Email ID:', emailData?.id);
    console.log('✅ Response data:', JSON.stringify(emailData, null, 2));
    return { success: true, emailId: emailData?.id };
  } catch (error: any) {
    console.error('❌ ===== EMAIL SEND EXCEPTION =====');
    console.error('❌ Exception type:', error?.constructor?.name);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error stack:', error?.stack);
    console.error('❌ Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

