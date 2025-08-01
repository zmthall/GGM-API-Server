import { generateEmailVerification, getDocument } from '../helpers/firebase';
import * as userManagement from '../services/userManagement.services';
import { nodeMailerEmail } from '../config/email';
import type { Request, Response } from 'express';
import { EmailMessage } from '../types/nodeMailer';
import * as emailer from '../services/email.services';

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, role } = req.body;
    const createdByUid = req.user?.uid;

    if (!createdByUid) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: Admin authentication required'
      });
      return;
    }

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
      return;
    }

    // Validate password length
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
      return;
    }

    // Validate role if provided
    if (role && !['admin', 'user'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Role must be either "admin" or "user"'
      });
      return;
    }

    const result = await userManagement.createUser(
      { email, password, displayName, role },
      createdByUid
    );
    
    const validationLink = await generateEmailVerification(result.email);

    const message: EmailMessage = {
        from: nodeMailerEmail,
        to: result.email,
        subject: `Validate New Account on Golden Gate Manor Inc Website`,
        text: `Please validate your account with the link below\n${validationLink}\n\nThank you`,
        html: `
            <p>Please validate your account with the link below.</p>
            <p><a href="${validationLink}">${validationLink}</a></p>
            <p>Thank you</p>
        `
    };

    await emailer.emailService.sendEmail(message);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const adminUid = req.user?.uid;

    if (!uid) {
      res.status(400).json({
        success: false,
        message: 'User UID is required'
      });
      return;
    }

    // Prevent admin from deleting themselves
    if (uid === adminUid) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
      return;
    }

    // Check if user exists first
    try {
      await getDocument('users', uid);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    await userManagement.deleteUser(uid);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userManagement.getAllUsers();

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;

    if (!uid) {
      res.status(400).json({
        success: false,
        message: 'User UID is required'
      });
      return;
    }

    if (!role) {
      res.status(400).json({
        success: false,
        message: 'Role is required'
      });
      return;
    }

    // Validate role
    if (!['admin', 'user'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Role must be either "admin" or "user"'
      });
      return;
    }

    // Check if user exists
    const existingUser = await getDocument('users', uid);
    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    const result = await userManagement.updateUserRole(uid, role);

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};