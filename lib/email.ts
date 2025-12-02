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
            <title>Order Confirmation - Bin Mukhtar Retail</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #000000; background-color: #F7F3EF;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F7F3EF; padding: 0; margin: 0;">
              <tr>
                <td align="center" style="padding: 40px 20px 30px;">
                  <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #FFFFFF; border-radius: 8px; overflow: hidden;">
                    <!-- Logo Header -->
                    <tr>
                      <td align="center" style="padding: 40px 30px 30px; background-color: #F7F3EF;">
                        <div style="text-align: center;">
                          <div style="font-size: 36px; font-weight: bold; letter-spacing: -0.02em; color: #000000; line-height: 1; margin-bottom: 4px;">BMR</div>
                          <div style="font-size: 10px; letter-spacing: 0.3em; color: #000000; text-transform: uppercase; margin-top: 4px;">BIN MUKHTAR RETAIL</div>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Thank You Header -->
                    <tr>
                      <td style="padding: 30px 30px 20px; background-color: #FFFFFF;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #000000; text-align: center; line-height: 1.2;">Thank You for Your Order!</h1>
                        <p style="margin: 12px 0 0; font-size: 16px; color: #666666; text-align: center;">Order #${data.orderNumber}</p>
                      </td>
                    </tr>

                    <!-- Order Items -->
                    <tr>
                      <td style="padding: 0 30px 30px; background-color: #FFFFFF;">
                        <h2 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #000000; text-transform: uppercase; letter-spacing: 0.05em;">Your Order</h2>
                        ${data.items.map(item => `
                          <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #F7F3EF;">
                            <tr>
                              ${item.imageUrl ? `
                                <td style="width: 100px; padding-right: 15px; vertical-align: top;">
                                  <img src="${item.imageUrl}" alt="${item.title}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px; display: block;">
                                </td>
                              ` : ''}
                              <td style="vertical-align: top;">
                                <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 500; color: #000000; line-height: 1.4;">${item.title}</h3>
                                <p style="margin: 0 0 8px; font-size: 14px; color: #666666;">Quantity: ${item.qty}</p>
                                <p style="margin: 0; font-size: 16px; font-weight: 600; color: #000000;">${formatPrice(item.unitPrice * item.qty)}</p>
                              </td>
                            </tr>
                          </table>
                        `).join('')}
                      </td>
                    </tr>

                    <!-- Order Summary -->
                    <tr>
                      <td style="padding: 0 30px 30px; background-color: #FFFFFF;">
                        <h2 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #000000; text-transform: uppercase; letter-spacing: 0.05em;">Order Summary</h2>
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #666666;">Subtotal</td>
                            <td align="right" style="padding: 8px 0; font-size: 14px; color: #000000;">${formatPrice(data.subtotal)}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #666666;">Shipping</td>
                            <td align="right" style="padding: 8px 0; font-size: 14px; color: #000000;">${data.shipping > 0 ? formatPrice(data.shipping) : 'FREE'}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #666666;">Tax</td>
                            <td align="right" style="padding: 8px 0; font-size: 14px; color: #000000;">${formatPrice(data.tax)}</td>
                          </tr>
                          <tr>
                            <td colspan="2" style="padding: 16px 0 8px; border-top: 2px solid #C8A94E;"></td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 18px; font-weight: 600; color: #000000;">Total</td>
                            <td align="right" style="padding: 8px 0; font-size: 18px; font-weight: 600; color: #000000;">${formatPrice(data.total)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Shipping Address -->
                    ${data.fulfillmentMethod === 'delivery' && data.shippingAddress ? `
                      <tr>
                        <td style="padding: 0 30px 30px; background-color: #FFFFFF;">
                          <h2 style="margin: 0 0 20px; font-size: 18px; font-weight: 600; color: #000000; text-transform: uppercase; letter-spacing: 0.05em;">Shipping Address</h2>
                          <div style="font-size: 14px; color: #666666; line-height: 1.8;">
                            <div style="color: #000000; font-weight: 500; margin-bottom: 4px;">${data.shippingAddress.fullName}</div>
                            <div>${data.shippingAddress.address}${data.shippingAddress.address2 ? `<br>${data.shippingAddress.address2}` : ''}</div>
                            <div>${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}</div>
                            <div>${data.shippingAddress.country}</div>
                          </div>
                        </td>
                      </tr>
                    ` : ''}

                    <!-- Pickup Instructions -->
                    ${data.fulfillmentMethod === 'pickup' ? `
                      <tr>
                        <td style="padding: 0 30px 30px; background-color: #FFFFFF;">
                          <div style="background-color: #F7F3EF; padding: 20px; border-radius: 4px; border-left: 3px solid #C8A94E;">
                            <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #000000;">Pickup Instructions</h2>
                            <p style="margin: 0 0 16px; font-size: 14px; color: #666666; line-height: 1.6;">
                              <strong style="color: #000000;">We are located in Dearborn, Michigan.</strong><br>
                              To arrange your pickup, please send us a direct message on Instagram with your order reference (#${data.orderNumber}).
                            </p>
                            <div style="text-align: center;">
                              <a href="https://www.instagram.com/binmukhtarretail?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
                                 style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #833AB4, #E1306C); color: #FFFFFF; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 14px;">
                                DM on Instagram
                              </a>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ` : ''}

                    <!-- What Happens Next -->
                    <tr>
                      <td style="padding: 0 30px 30px; background-color: #FFFFFF;">
                        <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #000000; text-transform: uppercase; letter-spacing: 0.05em;">What Happens Next?</h2>
                        ${data.fulfillmentMethod === 'delivery' ? `
                          <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.8;">
                            We're so excited to prepare your order! Our team will carefully handpick and package each item with care. Your order typically takes 1-2 business days to process. Once your package ships, you'll receive a tracking number via email so you can follow your order's journey to your door.
                          </p>
                        ` : `
                          <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.8;">
                            We're so excited to prepare your order! Our team will carefully handpick and package each item with care. Once your order is ready, we'll reach out to you via Instagram to coordinate a convenient pickup time. We can't wait to see you!
                          </p>
                        `}
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="padding: 40px 30px; background-color: #F7F3EF; border-top: 1px solid #E5E5E5;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td align="center" style="padding-bottom: 24px;">
                              <div style="font-size: 20px; font-weight: bold; letter-spacing: -0.02em; color: #000000; line-height: 1; margin-bottom: 4px;">BMR</div>
                              <div style="font-size: 9px; letter-spacing: 0.3em; color: #666666; text-transform: uppercase; margin-top: 4px;">BIN MUKHTAR RETAIL</div>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding-bottom: 20px;">
                              <p style="margin: 0 0 8px; font-size: 13px; color: #666666; line-height: 1.6;">
                                Dearborn, Michigan<br>
                                <a href="mailto:support@binmukhtarretail.com" style="color: #C8A94E; text-decoration: none;">support@binmukhtarretail.com</a>
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding-bottom: 20px;">
                              <table role="presentation" style="margin: 0 auto; border-collapse: collapse;">
                                <tr>
                                  <td style="padding: 0 8px;">
                                    <a href="https://binmukhtarretail.com/" style="color: #666666; text-decoration: none; font-size: 13px;">Website</a>
                                  </td>
                                  <td style="padding: 0 8px; color: #E5E5E5;">|</td>
                                  <td style="padding: 0 8px;">
                                    <a href="https://www.instagram.com/binmukhtarretail?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" style="color: #666666; text-decoration: none; font-size: 13px;">Instagram</a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding-top: 20px; border-top: 1px solid #E5E5E5;">
                              <p style="margin: 0; font-size: 12px; color: #999999;">
                                © ${new Date().getFullYear()} Bin Mukhtar Retail. All rights reserved.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
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

