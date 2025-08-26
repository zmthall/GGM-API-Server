// /routes/userManagement.routes.ts
import { Router } from 'express';
import { verifyFirebaseToken } from '../middlewares/verifyFirebaseToken';
import { requireAdmin } from '../middlewares/requireAdmin';
import { 
  createUser,
  deleteUser,
  getAllUsers,
  updateUserRole,
  updateLastLogin,
  updateLastPasswordReset,
  getUserProfile,
  updateDisplayName,
  // deleteCurrentUser,
  changePassword,
  resendEmailVerification
} from '../controllers/userManagement.controller';

const router = Router();

router.get('/route/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'User Management routes are working.' });
});

// Admin-only routes
router.post('/admin/create-user', verifyFirebaseToken, requireAdmin, createUser);
router.delete('/admin/delete-user/:uid', verifyFirebaseToken, requireAdmin, deleteUser);
router.get('/admin/get-users', verifyFirebaseToken, requireAdmin, getAllUsers);
router.put('/admin/edit-user/:uid/role', verifyFirebaseToken, requireAdmin, updateUserRole);

// User profile routes
router.put('/update-login', verifyFirebaseToken, updateLastLogin)
router.put('/update-password-reset', verifyFirebaseToken, updateLastPasswordReset)
router.get('/profile', verifyFirebaseToken, getUserProfile);
router.put('/profile', verifyFirebaseToken, updateDisplayName);
router.post('/profile/change-password', verifyFirebaseToken, changePassword);
router.post('/profile/send-verification', verifyFirebaseToken, resendEmailVerification);
// router.delete('/profile/delete-current-user', verifyFirebaseToken, deleteCurrentUser)

export default router;