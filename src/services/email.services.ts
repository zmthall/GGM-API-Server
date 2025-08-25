// /services/email.services.ts
import type { EmailMessage, RideRequestData } from '../types/nodeMailer';
import type { ContactFormData } from '../types/contactForm';

import { Emailer } from '../helpers/email';

export const sendSingleEmail = async (message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
      const email = await Emailer.main.sendEmail(message);
      
      return {
        success: true,
        messageId: email.messageId
      };
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
}

export const sendBulkEmails = async (messages: EmailMessage[]): Promise<{ 
    success: boolean; 
    results: Array<{ success: boolean; messageId?: string; error?: string }>;
    successCount: number;
    failureCount: number;
  }> => {
  const results = await Emailer.main.sendBulkEmails(messages);

  const processedResults = results.map(result => {
    if (result.status === 'fulfilled') {
      return { success: true, messageId: result.value.messageId };
    } else {
      return { success: false, error: result.reason?.message || 'Unknown error' };
    }
  });

  const successCount = processedResults.filter(result => result.success).length;
  const failureCount = processedResults.length - successCount;

  return {
    success: successCount > 0,
    results: processedResults,
    successCount,
    failureCount
  };
}

export const verifyEmailConnection = async (): Promise<boolean> => {
  return Emailer.main.verifyConnection();
}

export const sendContactFormEmail = async (contactData: ContactFormData): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const result = await Emailer.main.sendContactFormEmail(contactData);

    return {
      success: true,
      messageId: result.messageId
    }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    }
  }
}

export const sendRideRequestEmail = async (
  rideData: RideRequestData
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const result = await Emailer.main.sendRideRequestEmail(rideData);
    return {
      success: true,
      messageId: result.messageId
    }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    }
  }
}