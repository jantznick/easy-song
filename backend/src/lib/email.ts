import { Resend } from 'resend';
import { config } from '../config';

// Only initialize Resend if email sending is enabled
const resend = config.enableEmailSending ? new Resend(config.resendApiKey) : null;

export interface SendMagicCodeEmailParams {
  email: string;
  code: string;
  type: 'login' | 'email_verification';
}

export async function sendMagicCodeEmail({ email, code, type }: SendMagicCodeEmailParams): Promise<void> {
  const subject = type === 'login' 
    ? 'Your Easy Song Login Code'
    : 'Verify Your Easy Song Email';

  // If email sending is disabled, just log to console for local development
  if (!config.enableEmailSending) {
    console.log('\n' + '='.repeat(60));
    console.log(`📧 EMAIL (${type.toUpperCase()}) - Email sending disabled`);
    console.log('='.repeat(60));
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`\n🔐 Code: ${code}`);
    console.log(`\n⏰ This code expires in 10 minutes`);
    console.log('='.repeat(60) + '\n');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Easy Song</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">${subject}</h2>
          <p style="color: #4b5563; font-size: 16px;">
            ${type === 'login' 
              ? 'Use the code below to sign in to your Easy Song account:'
              : 'Use the code below to verify your email address:'}
          </p>
          <div style="background: white; border: 2px solid #6366F1; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #6366F1; font-family: 'Courier New', monospace;">
              ${code}
            </div>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This code will expire in 10 minutes. If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
${subject}

${type === 'login' 
  ? 'Use the code below to sign in to your Easy Song account:'
  : 'Use the code below to verify your email address:'}

${code}

This code will expire in 10 minutes. If you didn't request this code, you can safely ignore this email.
  `.trim();

  if (!resend) {
    throw new Error('Resend client not initialized. Email sending is disabled.');
  }

  try {
    await resend.emails.send({
      from: config.resendFromEmail,
      to: email,
      subject,
      html,
      text,
    });
    console.log(`✅ Email sent to ${email} (${type})`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

