import sgMail from '@sendgrid/mail';

const apiKey = process.env.SENDGRID_API_KEY;

if (!apiKey) {
  throw new Error('SendGrid API key not configured');
}

sgMail.setApiKey(apiKey);

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(template: EmailTemplate): Promise<{ success: boolean; message: string }> {
  try {
    await sgMail.send({
      to: template.to,
      from: process.env.FROM_EMAIL || 'noreply@doctorappointments.com',
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    
    return {
      success: true,
      message: 'Email sent successfully',
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: 'Failed to send email',
    };
  }
}

export function createBookingConfirmationEmail(
  patientName: string,
  doctorName: string,
  appointmentTime: string,
  clinicAddress: string,
  appointmentId: string
): EmailTemplate {
  const subject = 'Appointment Confirmation';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Appointment Confirmed!</h2>
      <p>Dear ${patientName},</p>
      <p>Your appointment has been successfully confirmed.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Appointment Details</h3>
        <p><strong>Doctor:</strong> ${doctorName}</p>
        <p><strong>Date & Time:</strong> ${appointmentTime}</p>
        <p><strong>Location:</strong> ${clinicAddress}</p>
        <p><strong>Appointment ID:</strong> ${appointmentId}</p>
      </div>
      
      <p>Please arrive 10 minutes before your scheduled time.</p>
      <p>If you need to cancel or reschedule, please contact us at least 24 hours in advance.</p>
      
      <p>Best regards,<br>Doctor Appointment Team</p>
    </div>
  `;
  
  const text = `
    Appointment Confirmed!
    
    Dear ${patientName},
    
    Your appointment has been successfully confirmed.
    
    Appointment Details:
    - Doctor: ${doctorName}
    - Date & Time: ${appointmentTime}
    - Location: ${clinicAddress}
    - Appointment ID: ${appointmentId}
    
    Please arrive 10 minutes before your scheduled time.
    If you need to cancel or reschedule, please contact us at least 24 hours in advance.
    
    Best regards,
    Doctor Appointment Team
  `;
  
  return {
    to: '', // Will be set when sending
    subject,
    html,
    text,
  };
}

export function createBookingReminderEmail(
  patientName: string,
  doctorName: string,
  appointmentTime: string,
  clinicAddress: string
): EmailTemplate {
  const subject = 'Appointment Reminder - Tomorrow';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Appointment Reminder</h2>
      <p>Dear ${patientName},</p>
      <p>This is a reminder that you have an appointment tomorrow.</p>
      
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Appointment Details</h3>
        <p><strong>Doctor:</strong> ${doctorName}</p>
        <p><strong>Date & Time:</strong> ${appointmentTime}</p>
        <p><strong>Location:</strong> ${clinicAddress}</p>
      </div>
      
      <p>Please arrive 10 minutes before your scheduled time.</p>
      <p>If you need to cancel or reschedule, please contact us as soon as possible.</p>
      
      <p>Best regards,<br>Doctor Appointment Team</p>
    </div>
  `;
  
  const text = `
    Appointment Reminder - Tomorrow
    
    Dear ${patientName},
    
    This is a reminder that you have an appointment tomorrow.
    
    Appointment Details:
    - Doctor: ${doctorName}
    - Date & Time: ${appointmentTime}
    - Location: ${clinicAddress}
    
    Please arrive 10 minutes before your scheduled time.
    If you need to cancel or reschedule, please contact us as soon as possible.
    
    Best regards,
    Doctor Appointment Team
  `;
  
  return {
    to: '', // Will be set when sending
    subject,
    html,
    text,
  };
}

export function createCancellationEmail(
  patientName: string,
  doctorName: string,
  appointmentTime: string,
  refundAmount?: number
): EmailTemplate {
  const subject = 'Appointment Cancelled';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Appointment Cancelled</h2>
      <p>Dear ${patientName},</p>
      <p>Your appointment has been cancelled.</p>
      
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Cancelled Appointment Details</h3>
        <p><strong>Doctor:</strong> ${doctorName}</p>
        <p><strong>Date & Time:</strong> ${appointmentTime}</p>
        ${refundAmount ? `<p><strong>Refund Amount:</strong> $${refundAmount}</p>` : ''}
      </div>
      
      ${refundAmount ? '<p>Your refund will be processed within 5-7 business days.</p>' : ''}
      <p>If you have any questions, please contact our support team.</p>
      
      <p>Best regards,<br>Doctor Appointment Team</p>
    </div>
  `;
  
  const text = `
    Appointment Cancelled
    
    Dear ${patientName},
    
    Your appointment has been cancelled.
    
    Cancelled Appointment Details:
    - Doctor: ${doctorName}
    - Date & Time: ${appointmentTime}
    ${refundAmount ? `- Refund Amount: $${refundAmount}` : ''}
    
    ${refundAmount ? 'Your refund will be processed within 5-7 business days.' : ''}
    If you have any questions, please contact our support team.
    
    Best regards,
    Doctor Appointment Team
  `;
  
  return {
    to: '', // Will be set when sending
    subject,
    html,
    text,
  };
}
