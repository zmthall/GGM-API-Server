// /controllers/email.controller.ts
import { Request, Response } from 'express';
import * as EmailService from '../services/email.services';

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