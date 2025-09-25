import { generateEmailVerification, generatePasswordReset, getDocument } from '../helpers/firebase';
import * as userManagement from '../services/userManagement.services';
import type { Request, Response } from 'express';
import { Emailer } from '../helpers/email';
import { UserProfile } from '../types/user';

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
    
    const verificationLink = await generateEmailVerification(result.email);

    await Emailer.noreply.sendVerificationLinkEmail(result.email, verificationLink);

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

export const disableUserToggle = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const adminUid = req.user?.uid;
    let disabled;

    if (!uid) {
      res.status(400).json({
        success: false,
        message: 'User UID is required'
      });
      return;
    }

    if(!adminUid) {
      res.status(400).json({
        success: false,
        message: 'An admin logged in is required'
      });
      return;
    }

    // Prevent admin from disabling themselves
    if (uid === adminUid) {
      res.status(400).json({
        success: false,
        message: 'Cannot disable your own account'
      });
      return;
    }


    // Check if user exists first
    try {
      const user = await getDocument<{ id: string, status: 'active' | 'disabled' }>('users', uid);

      disabled = user?.status === "active" ? true : false;
    } catch (error) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    await userManagement.disableUserToggle(uid, disabled, adminUid);

    res.json({
      success: true,
      message: 'User disabled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const deleteCurrentUser = async (req: Request, res: Response) => {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      res.status(400).json({
        success: false,
        message: 'User is not logged in.'
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
    // Read both page and limit/pageSize parameters
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.limit as string) || parseInt(req.query.pageSize as string) || 5;

    const result = await userManagement.getAllUsers({ page, pageSize });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
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

    const requester = req.user?.uid;
    if(!requester) {
      res.status(400).json({
        success: false,
        message: 'An admin logged in is required'
      });
      return;
    }

    if(uid === requester) {
      res.status(400).json({
        success: false,
        message: 'You cannot change your own role.'
      });
      return;
    }

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

    const result = await userManagement.updateUserRole(uid, role, requester);

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

export const updateLastLogin = async (req: Request, res: Response) => {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      res.status(400).json({
        success: false,
        message: 'User is not logged in.'
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

    const result = await userManagement.updateLastLogin(uid)

    res.json({
      success: true,
      message: 'User login updated successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
}

export const updateLastPasswordReset = async (req: Request, res: Response) => {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      res.status(400).json({
        success: false,
        message: 'User is not logged in.'
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

    const result = await userManagement.updateLastPasswordReset(uid)

    res.json({
      success: true,
      message: 'User login updated successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
}

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const uid = req.user?.uid
    
    if (!uid) {
      res.status(400).json({
        success: false,
        message: 'User is not logged in'
      });
      return;
    }

    const userProfileData = await userManagement.getUserProfile(uid);
    
    if (!userProfileData) {
      res.status(404).json({
        success: false,
        message: 'Ride request not found'
      });
      return;
    }

    res.json({
      success: true,
      data: userProfileData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const updateDisplayName = async (req: Request, res: Response) => {
  try {
    const uid = req.user?.uid;

    const { displayName } = req.body;

    if (!uid) {
      res.status(400).json({
        success: false,
        message: 'User is not logged in.'
      });
      return;
    }

    // Validate displayName
    if (displayName.length > 15) {
      res.status(400).json({
        success: false,
        message: 'Display name cannot be longer than 15 characters.'
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

    const result = await userManagement.updateDisplayName(uid, displayName)

    res.json({
      success: true,
      message: 'User login updated successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
}

export const changePassword = async (req: Request, res: Response) => {
  try {
    const email = req.user?.email;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'User is not logged in.'
      });
      return;
    }

    const passwordResetLink = await generatePasswordReset(email);

    const result = await Emailer.noreply.sendPasswordResetEmail(email, passwordResetLink);

    res.status(201).json({
      success: true,
      message: 'Password reset link sent successfully.',
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
}

export const changePasswordByID = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;

    // Check if user exists
    const user = await getDocument<UserProfile>('users', uid);
    if (!user) {
      res.status(404).json({
        success: false,
        message: `User with UID[${uid}] not found.`
      });
      return;
    }

    const passwordResetLink = await generatePasswordReset(user.email);

    const updatePasswordReset = await userManagement.updateLastPasswordReset(uid);
    if(!updatePasswordReset) {
      res.status(404).json({
        success: false,
        message: `Failed to update last password reset for UID[${uid}.]`
      });
      return;
    }

    const result = await Emailer.noreply.sendPasswordResetEmail(user.email, passwordResetLink);

    res.status(201).json({
      success: true,
      message: 'Password reset link sent successfully.',
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
}

export const resendEmailVerification = async (req: Request, res: Response) => {
  try {
    const email = req.user?.email;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'User is not logged in.'
      });
      return;
    }

    const verificationLink = await generateEmailVerification(email);

    const result = await Emailer.noreply.sendVerificationLinkEmail(email, verificationLink);

    res.status(201).json({
      success: true,
      message: 'Email verification link sent successfully.',
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
}