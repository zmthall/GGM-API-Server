// /services/email.services.ts
import nodemailer from 'nodemailer';
import { nodeMailerEmail, nodeMailerPassword, nodeMailerContactFormEmail, nodeMailerContactFormCCEmails, nodeMailerRideRequestEmail, nodeMailerRideRequestCCEmails } from '../config/email';
import { ContactFormData, EmailMessage, RideRequestData } from '../types/nodeMailer';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      secure: true,
      auth: {
        user: nodeMailerEmail,
        pass: nodeMailerPassword,
      },
      tls: {
        rejectUnauthorized: false
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  }

  private validateEmailMessage(message: EmailMessage): void {
    if (!message.to) {
      throw new Error('Recipient email address is required');
    }
    
    if (!message.subject) {
      throw new Error('Email subject is required');
    }
    
    if (!message.text && !message.html) {
      throw new Error('Email must contain either text or HTML content');
    }

    // Check for undefined values in text content
    if (message.text && message.text.includes('undefined')) {
      throw new Error('Email text contains undefined fields');
    }

    if (message.html && message.html.includes('undefined')) {
      throw new Error('Email HTML contains undefined fields');
    }
  }

  async sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Validate the message
      this.validateEmailMessage(message);

      // Set default from address if not provided
      if (!message.from) {
        message.from = nodeMailerEmail;
      }

      const info = await this.transporter.sendMail(message);
      
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async sendBulkEmails(messages: EmailMessage[]): Promise<{ 
    success: boolean; 
    results: Array<{ success: boolean; messageId?: string; error?: string }>;
    successCount: number;
    failureCount: number;
  }> {
    const results = await Promise.allSettled(
      messages.map(message => this.sendEmail(message))
    );

    const processedResults = results.map(result => 
      result.status === 'fulfilled' ? result.value : { success: false, error: 'Promise rejected' }
    );

    const successCount = processedResults.filter(result => result.success).length;
    const failureCount = processedResults.length - successCount;

    return {
      success: successCount > 0,
      results: processedResults,
      successCount,
      failureCount
    };
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection verification failed:', error);
      return false;
    }
  }

  async sendContactFormEmail(
    contactData: ContactFormData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Validate email configuration
      const recipientEmail = nodeMailerContactFormEmail || nodeMailerEmail;
      if (!recipientEmail) {
        return {
          success: false,
          error: 'Email configuration is missing - no recipient email configured'
        };
      }
      
      console.log(nodeMailerContactFormCCEmails ? nodeMailerContactFormCCEmails.split(',').map(email => email.trim()) : undefined,)

      // Prepare email message
      const message: EmailMessage = {
        from: nodeMailerEmail,
        to: recipientEmail,
        cc: nodeMailerContactFormCCEmails ? nodeMailerContactFormCCEmails.split(',').map(email => email.trim()) : undefined,
        subject: `Message From: ${contactData.first_name} ${contactData.last_name}`,
        text: `Reason: ${contactData.reason}\nName: ${contactData.first_name} ${contactData.last_name}\nEmail Address: ${contactData.email}\nPhone Number: ${contactData.phone}\nPreferred Contact Method: ${contactData.contact_method}\nMessage: ${contactData.message}`,
        html: `
          <p><strong>Reason:</strong> ${contactData.reason}</p>
          <p><strong>Name:</strong> ${contactData.first_name} ${contactData.last_name}</p>
          <p><strong>Email Address:</strong> <a href="mailto:${contactData.email}">${contactData.email}</a></p>
          <p><strong>Phone Number:</strong> <a href="tel:${contactData.phone}">${contactData.phone}</a></p>
          <p><strong>Preferred Contact Method:</strong> ${contactData.contact_method}</p>
          <p><strong>Message:</strong> ${contactData.message}</p>
        `
      };

      const result = await this.sendEmail(message);
      return result;
    } catch (error) {
      console.error('Contact form email error:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async sendRideRequestEmail(
    rideData: RideRequestData
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            // Validate email configuration - use RIDE_REQUEST_EMAIL specifically
            const recipientEmail = nodeMailerRideRequestEmail || nodeMailerEmail;
            if (!recipientEmail) {
            return {
                success: false,
                error: 'Email configuration is missing - no ride request email configured'
            };
            }

            // Date formatting
            const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });
            const timeFormat = new Intl.DateTimeFormat("en-US", {
            timeStyle: "long",
            timeZone: "America/Denver",
            });

            const appointmentDate = new Date(rideData.apt_date);
            const appointmentTime = new Date(rideData.apt_time);
            const dateOfBirth = new Date(rideData.dob);

            console.log(nodeMailerRideRequestCCEmails ? nodeMailerRideRequestCCEmails.split(',').map(email => email.trim()) : undefined)

            // Prepare email message
            const message: EmailMessage = {
            from: nodeMailerEmail,
            to: recipientEmail,
            cc: nodeMailerRideRequestCCEmails ? nodeMailerRideRequestCCEmails.split(',').map(email => email.trim()) : undefined,
            subject: `Ride Request From: ${rideData.name} on ${dateFormat.format(appointmentDate)} at ${timeFormat.format(appointmentTime)}`,
            text: `Name: ${rideData.name}\nDate of Birth: ${dateFormat.format(dateOfBirth)}\nPhone Number: ${rideData.phone}\nEmail Address: ${rideData.email}\nMedicaid ID: ${rideData.med_id}\nAppointment Date: ${dateFormat.format(appointmentDate)}\nAppointment Time: ${timeFormat.format(appointmentTime)}\nPickup Location: ${rideData.pickup_address}\nDrop-Off Location: ${rideData.dropoff_address}\nNotes/Messages/Special Requirements: ${rideData.notes}`,
            html: `
                <article style="font-size: 1.25rem;">
                <h1 style="text-decoration: underline;">Ride Request:</h1>
                <p><span style="font-weight: 700;">Name:</span> ${rideData.name}</p>
                <p><span style="font-weight: 700;">Date of Birth:</span> ${dateFormat.format(dateOfBirth)}</p>
                <p><span style="font-weight: 700;">Phone Number:</span> <a href="tel:${rideData.phone}">${rideData.phone}</a></p>
                <p><span style="font-weight: 700;">Email Address:</span> <a href="mailto:${rideData.email}">${rideData.email}</a></p>
                <p><span style="font-weight: 700;">Medicaid ID:</span> ${rideData.med_id}</p>
                <p><span style="font-weight: 700;">Appointment Date:</span> ${dateFormat.format(appointmentDate)}</p>
                <p><span style="font-weight: 700;">Appointment Time:</span> ${timeFormat.format(appointmentTime)}</p>
                <p><span style="font-weight: 700;">Pickup Location:</span> ${rideData.pickup_address}</p>
                <p><span style="font-weight: 700;">Drop-Off Location:</span> ${rideData.dropoff_address}</p>
                <p><span style="font-weight: 700;">Notes/Messages/Special Requirements:</span> ${rideData.notes}</p>
                </article>
            `
            };

            const result = await this.sendEmail(message);
            return result;
        } catch (error) {
            console.error('Ride request email error:', error);
            return {
            success: false,
            error: (error as Error).message
            };
        }
    }
}



export const emailService = new EmailService();