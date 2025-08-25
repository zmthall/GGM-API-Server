// /controllers/email.controller.ts
import { Request, Response } from 'express';
import * as EmailService from '../services/email.services';
import { saveEmailData, updateDocument } from '../helpers/firebase';

export const sendSingleEmail = async (req: Request, res: Response) => {
  try {
    const emailMessage = req.body;
    
    const result = await EmailService.sendSingleEmail(emailMessage);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to send email',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: (error as Error).message
    });
  }
};

export const sendBulkEmails = async (req: Request, res: Response) => {
  try {
    const { emails } = req.body;
    
    if (!Array.isArray(emails)) {
      res.status(400).json({
        success: false,
        message: 'Emails must be provided as an array'
      });
      return;
    }
    
    const result = await EmailService.sendBulkEmails(emails);
    
    res.status(200).json({
      success: result.success,
      message: `Bulk email operation completed. ${result.successCount} sent, ${result.failureCount} failed.`,
      results: result.results,
      successCount: result.successCount,
      failureCount: result.failureCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: (error as Error).message
    });
  }
};

export const verifyEmailConnection = async (req: Request, res: Response) => {
  try {
    const isConnected = await EmailService.verifyEmailConnection();
    
    res.status(200).json({
      success: true,
      connected: isConnected,
      message: isConnected ? 'Email service is connected' : 'Email service connection failed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify email connection',
      error: (error as Error).message
    });
  }
};

export const sendContactFormEmail = async (req: Request, res: Response) => {
  let documentId: string | undefined;
  
  try {
    const contactData = req.body;
    
    // Validate required fields
    const requiredFields = ['first_name', 'email', 'reason', 'contact_method', 'message'];
    const missingFields = requiredFields.filter(field => !contactData[field]);
    
    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
      return;
    }

    // Step 1: Save to database
    try {
      const saveResult = await saveEmailData(contactData, 'contact_messages');
      documentId = saveResult.id;
    } catch (dbError) {
      res.status(500).json({
        success: false,
        message: 'Failed to save contact form data',
        error: (dbError as Error).message
      });
      return;
    }

    // Step 2: Send email
    const emailResult = await EmailService.sendContactFormEmail(contactData);
    
    // Step 3: Update database record with email status
    try {
      if (emailResult.success) {
        const updateData = {
          email_status: 'email_sent',
          email_sent_at: new Date().toISOString(),
          ...(emailResult.messageId && { message_id: emailResult.messageId })
        };
        await updateDocument('contact_messages', documentId, updateData);
      } else {
        const updateData = {
          email_status: 'email_failed',
          email_failed_at: new Date().toISOString(),
          ...(emailResult.error && { email_error: emailResult.error })
        };
        await updateDocument('contact_messages', documentId, updateData);
      }
    } catch (updateError) {
      console.error('Failed to update contact form status:', updateError);
      // Don't fail the whole request for this
    }

    // Return response based on email result
    if (emailResult.success) {
      res.status(200).json({
        success: true,
        message: 'Contact form email sent successfully',
        messageId: emailResult.messageId,
        contactId: documentId
      });
    } else {
      res.status(400).json({
        success: false,
        message: emailResult.error || 'Failed to send contact form email',
        contactId: documentId
      });
    }
  } catch (error) {
    // If we have a document ID but something failed, mark it as failed
    if (documentId) {
      try {
        await updateDocument('contact_messages', documentId, {
          status: 'processing_failed',
          error_message: (error as Error).message,
          failed_at: new Date().toISOString()
        });
      } catch (updateError) {
        console.error('Failed to mark document as failed:', updateError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: (error as Error).message,
      ...(documentId && { contactId: documentId })
    });
  }
};

export const sendRideRequestEmail = async (req: Request, res: Response) => {
  let documentId: string | undefined;
  
  try {
    const rideData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'dob', 'phone', 'email', 'med_id', 'apt_date', 'apt_time', 'pickup_address', 'dropoff_address'];
    const missingFields = requiredFields.filter(field => !rideData[field]);
    
    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
      return;
    }

    // Validate date formats
    const appointmentDate = new Date(rideData.apt_date);
    const appointmentTime = new Date(rideData.apt_time);
    const dateOfBirth = new Date(rideData.dob);

    if (isNaN(appointmentDate.getTime()) || isNaN(appointmentTime.getTime()) || isNaN(dateOfBirth.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format provided'
      });
      return;
    }

    // Step 1: Save to database
    try {
      const saveResult = await saveEmailData(rideData, 'ride_requests', {
        contact_type: 'Ride Request'
      });
      documentId = saveResult.id;
    } catch (dbError) {
      res.status(500).json({
        success: false,
        message: 'Failed to save ride request data',
        error: (dbError as Error).message
      });
      return;
    }

    // Step 2: Send email
    const emailResult = await EmailService.sendRideRequestEmail(rideData);
    
    // Step 3: Update database record with email status
    try {
      if (emailResult.success) {
        const updateData = {
          email_status: 'email_sent',
          email_sent_at: new Date().toISOString(),
          ...(emailResult.messageId && { message_id: emailResult.messageId })
        };
        await updateDocument('ride_requests', documentId, updateData);
      } else {
        const updateData = {
          email_status: 'email_failed',
          email_failed_at: new Date().toISOString(),
          ...(emailResult.error && { email_error: emailResult.error })
        };
        await updateDocument('ride_requests', documentId, updateData);
      }
    } catch (updateError) {
      console.error('Failed to update ride request status:', updateError);
      // Don't fail the whole request for this
    }

    // Return response based on email result
    if (emailResult.success) {
      res.status(200).json({
        success: true,
        message: 'Ride request email sent successfully',
        messageId: emailResult.messageId,
        rideRequestId: documentId
      });
    } else {
      res.status(400).json({
        success: false,
        message: emailResult.error || 'Failed to send ride request email',
        rideRequestId: documentId
      });
    }
  } catch (error) {
    // If we have a document ID but something failed, mark it as failed
    if (documentId) {
      try {
        await updateDocument('ride_requests', documentId, {
          status: 'processing_failed',
          error_message: (error as Error).message,
          failed_at: new Date().toISOString()
        });
      } catch (updateError) {
        console.error('Failed to mark document as failed:', updateError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: (error as Error).message,
      ...(documentId && { rideRequestId: documentId })
    });
  }
};