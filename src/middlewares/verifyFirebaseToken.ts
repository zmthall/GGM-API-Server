// /middlewares/verifyFirebaseToken.ts
import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
      };
    }
  }
}

export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Authorization header is required'
      });
      return;
    }

    // Check if it starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authorization header must start with "Bearer "'
      });
      return;
    }

    // Extract the token
    const idToken = authHeader.split(' ')[1];
    
    if (!idToken) {
      res.status(401).json({
        success: false,
        message: 'ID token is required'
      });
      return;
    }

    // Verify the token with Firebase Admin SDK
    const decodedToken = await getAuth().verifyIdToken(idToken);
    
    // Add user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};