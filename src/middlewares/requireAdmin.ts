// /middlewares/requireAdmin.ts
import { Request, Response, NextFunction } from 'express';

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Make sure user is authenticated first (should come from verifyFirebaseToken)
    if (!req.user?.uid) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Get admin UUIDs from environment variable
    const adminUuidsEnv = process.env.FIREBASE_ADMIN_UUIDS;
    
    if (!adminUuidsEnv) {
      console.error('FIREBASE_ADMIN_UUIDS not configured in environment');
      res.status(500).json({
        success: false,
        message: 'Admin configuration error'
      });
      return;
    }

    // Parse the comma-separated UUIDs into an array
    const adminUuids = adminUuidsEnv.split(',').map(uuid => uuid.trim());
    
    // Check if current user's UID is in the admin list
    if (!adminUuids.includes(req.user.uid)) {
      res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
      return;
    }

    // User is admin, proceed
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
    return;
  }
};