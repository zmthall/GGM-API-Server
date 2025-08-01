// /routes/userManagement.routes.ts
import { Router } from 'express';
import { verifyFirebaseToken } from '../middlewares/verifyFirebaseToken';
import { requireAdmin } from '../middlewares/requireAdmin';
import { 
  createUser,
  deleteUser,
  getAllUsers,
  updateUserRole
} from '../controllers/userManagement.controller';

const router = Router();

router.get('/route/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'User Management routes are working.' });
});

// Admin-only routes
router.post('/admin/users', verifyFirebaseToken, requireAdmin, createUser);
router.delete('/admin/users/:uid', verifyFirebaseToken, requireAdmin, deleteUser);
router.get('/admin/users', verifyFirebaseToken, requireAdmin, getAllUsers);
router.put('/admin/users/:uid/role', verifyFirebaseToken, requireAdmin, updateUserRole);

// User profile routes
// router.get('/profile/:uid', verifyFirebaseToken, getUserProfile);
// router.put('/profile/:uid', verifyFirebaseToken, updateProfile);
// router.put('/profile/change-password', verifyFirebaseToken, changePassword);
// router.post('/profile/send-verification', verifyFirebaseToken, sendEmailVerification);

export default router;