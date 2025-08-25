import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { EmailMessage } from '../../types/nodeMailer';
import { nodeMailerEmail } from '../../config/email';

export class EmailService {
  protected transporter: nodemailer.Transporter;

  constructor(transporterConfig: nodemailer.TransportOptions | SMTPTransport.Options) {
    this.transporter = nodemailer.createTransport(transporterConfig);
  }

  validateEmailMessage = (message: EmailMessage): void => {
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
    
  sendEmail = async (message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> => {
      // Validate the message
      this.validateEmailMessage(message);

      // Set default from address if not provided
      if (!message.from) {
        message.from = nodeMailerEmail;
      }

      return await this.transporter.sendMail(message);
  }
  
  sendBulkEmails = async (messages: EmailMessage[]): Promise<any[]> => {
    return Promise.allSettled(
      messages.map(message => this.sendEmail(message))
    );
  }
  
  verifyConnection = async (): Promise<boolean> => {
    try {
        await this.transporter.verify();
        return true;
    } catch (error) {
        console.error('Email connection verification failed:', error);
        return false;
    }
  }
}