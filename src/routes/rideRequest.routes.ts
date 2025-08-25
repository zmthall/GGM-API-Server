// /routes/rideRequest.routes.ts
import { Router } from 'express';
import { 
    getAllRideRequests,
    getRideRequestById,
    getRideRequestsByDate,
    updateRideRequestStatus,
    deleteRideRequest,
    addTagsToRideRequest,
    createRideRequestPDFById,
    createRideRequestPDFBulk
} from '../controllers/rideRequest.controller';

const router = Router();

// Middleware
import { authenticateKey } from '../middlewares/authenticateKey';

router.get('/route/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Ride Request routes are working.' });
})

router.post('/export/pdf/:id', createRideRequestPDFById)

router.post('/export/pdf/bulk', createRideRequestPDFBulk)

router.get('/', authenticateKey, getAllRideRequests);

router.get('/date/:date', authenticateKey, getRideRequestsByDate);

router.get('/:id', authenticateKey, getRideRequestById);

router.put('/:id/status', authenticateKey, updateRideRequestStatus)

router.put('/:id/tags', authenticateKey, addTagsToRideRequest)

router.delete('/:id', authenticateKey, deleteRideRequest)

export default router;