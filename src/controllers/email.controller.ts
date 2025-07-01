// /controllers/email.controller.ts
import { Request, Response } from 'express';
import * as emailService from '../services/email.services';

export const sendSingleEmail = async (req: Request, res: Response) => {
  try {
    const emailMessage = req.body;
    
    const result = await emailService.emailService.sendEmail(emailMessage);
    
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
    
    const result = await emailService.emailService.sendBulkEmails(emails);
    
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
    const isConnected = await emailService.emailService.verifyConnection();
    
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
  try {
    const contactData = req.body;
    
    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'reason', 'contact_method', 'message'];
    const missingFields = requiredFields.filter(field => !contactData[field]);
    
    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
      return;
    }

    const result = await emailService.emailService.sendContactFormEmail(contactData);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Contact form email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to send contact form email'
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

export const sendRideRequestEmail = async (req: Request, res: Response) => {
  try {
    const rideData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'dob', 'phone', 'email', 'med_id', 'apt_date', 'apt_time', 'pickup_address', 'dropoff_address', 'notes'];
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

    const result = await emailService.emailService.sendRideRequestEmail(rideData);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Ride request email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to send ride request email'
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