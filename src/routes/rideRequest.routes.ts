// /routes/rideRequest.routes.ts
import { Router } from 'express';
import { 
    getAllRideRequests,
    getRideRequestById,
    getRideRequestsByDate,
    updateRideRequestStatus,
    deleteRideRequest,
    updateRideRequestTags,
    createRideRequestPDFById,
    createRideRequestPDFBulk
} from '../controllers/rideRequest.controller';

const router = Router();

// Middleware
import { verifyFirebaseToken } from '../middlewares/verifyFirebaseToken';

router.get('/route/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Ride Request routes are working.' });
})

router.get('/export/pdf/bulk', verifyFirebaseToken, createRideRequestPDFBulk)

router.get('/export/pdf/:id', verifyFirebaseToken, createRideRequestPDFById)

router.get('/', verifyFirebaseToken, getAllRideRequests);

router.get('/date/:date', verifyFirebaseToken, getRideRequestsByDate);

router.get('/:id', verifyFirebaseToken, getRideRequestById);

router.put('/:id/status', verifyFirebaseToken, updateRideRequestStatus)

router.put('/:id/tags', verifyFirebaseToken, updateRideRequestTags)

router.delete('/:id', verifyFirebaseToken, deleteRideRequest)

export default router;