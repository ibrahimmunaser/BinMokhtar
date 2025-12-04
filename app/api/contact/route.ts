import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const FROM_EMAIL = process.env.FROM_EMAIL || 'Bin Mukhtar Retail <orders@binmukhtarretail.com>';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'info@binmukhtarretail.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    console.log('📧 Contact form submission received:');
    console.log('  - Name:', name);
    console.log('  - Email:', email);
    console.log('  - Phone:', phone || 'Not provided');
    console.log('  - Message:', message.substring(0, 100) + (message.length > 100 ? '...' : ''));

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured - contact form submission logged but no email sent');
      // Still return success - the form submission was received
      return NextResponse.json({ 
        success: true, 
        warning: 'Email service not configured. Your message was received but no confirmation email was sent.' 
      });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send notification email to store owner
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: CONTACT_EMAIL,
      reply_to: email,
      subject: `New Contact Form Message from ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="padding: 30px; background-color: #1a1a1a; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: -0.02em;">BMR</div>
                        <div style="font-size: 10px; letter-spacing: 0.3em; color: #999999; text-transform: uppercase; margin-top: 4px;">NEW CONTACT MESSAGE</div>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 30px;">
                        <h2 style="margin: 0 0 20px; font-size: 20px; color: #1a1a1a;">Contact Form Submission</h2>
                        
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                              <strong style="color: #666;">Name:</strong>
                              <div style="margin-top: 4px; color: #1a1a1a;">${name}</div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                              <strong style="color: #666;">Email:</strong>
                              <div style="margin-top: 4px;">
                                <a href="mailto:${email}" style="color: #C8A94E; text-decoration: none;">${email}</a>
                              </div>
                            </td>
                          </tr>
                          ${phone ? `
                          <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
                              <strong style="color: #666;">Phone:</strong>
                              <div style="margin-top: 4px;">
                                <a href="tel:${phone}" style="color: #C8A94E; text-decoration: none;">${phone}</a>
                              </div>
                            </td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="padding: 12px 0;">
                              <strong style="color: #666;">Message:</strong>
                              <div style="margin-top: 8px; color: #1a1a1a; line-height: 1.6; white-space: pre-wrap;">${message}</div>
                            </td>
                          </tr>
                        </table>
                        
                        <div style="margin-top: 30px; padding: 20px; background-color: #f8f8f8; border-radius: 6px;">
                          <p style="margin: 0; font-size: 14px; color: #666;">
                            <strong>Quick Reply:</strong> Simply reply to this email to respond directly to ${name}.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px 30px; background-color: #f5f5f5; text-align: center; border-top: 1px solid #eee;">
                        <p style="margin: 0; font-size: 12px; color: #999;">
                          This message was sent from the contact form on binmukhtarretail.com
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (emailError) {
      console.error('❌ Failed to send contact notification email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 }
      );
    }

    console.log('✅ Contact notification email sent successfully:', emailData?.id);

    // Optionally send confirmation email to the customer
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Thank you for contacting Bin Mukhtar Retail',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                      <td style="padding: 30px; background-color: #1a1a1a; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: -0.02em;">BMR</div>
                        <div style="font-size: 10px; letter-spacing: 0.3em; color: #999999; text-transform: uppercase; margin-top: 4px;">BIN MUKHTAR RETAIL</div>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="margin: 0 0 20px; font-size: 24px; color: #1a1a1a;">Thank You for Reaching Out!</h2>
                        
                        <p style="margin: 0 0 16px; font-size: 16px; color: #444; line-height: 1.6;">
                          Hi ${name},
                        </p>
                        
                        <p style="margin: 0 0 16px; font-size: 16px; color: #444; line-height: 1.6;">
                          We've received your message and will get back to you as soon as possible, typically within 24-48 hours.
                        </p>
                        
                        <p style="margin: 0 0 16px; font-size: 16px; color: #444; line-height: 1.6;">
                          In the meantime, feel free to browse our collection of premium thobes and modest fashion.
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="https://binmukhtarretail.com/shop" style="display: inline-block; padding: 14px 28px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; border-radius: 4px;">
                            Shop Now
                          </a>
                        </div>
                        
                        <p style="margin: 0; font-size: 16px; color: #444; line-height: 1.6;">
                          Best regards,<br>
                          <strong>The BMR Team</strong>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px; background-color: #f8f8f8; text-align: center; border-top: 1px solid #eee;">
                        <p style="margin: 0 0 8px; font-size: 13px; color: #666;">
                          Dearborn, Michigan<br>
                          <a href="mailto:info@binmukhtarretail.com" style="color: #C8A94E; text-decoration: none;">info@binmukhtarretail.com</a>
                        </p>
                        <p style="margin: 16px 0 0; font-size: 12px; color: #999;">
                          © ${new Date().getFullYear()} Bin Mukhtar Retail. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Contact form error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

