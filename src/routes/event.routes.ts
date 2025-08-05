// /routes/event.routes.ts
import { Router } from 'express';
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  archiveEvent,
  getArchivedEvents,
} from '../controllers/event.controller';

// Middleware
import { verifyFirebaseToken } from '../middlewares/verifyFirebaseToken';

const router = Router();

// Normal User Routes
// GET -  http://127.0.0.1:4000/api/events | Fetches all events from the firebase database with pagination and 5 events per page
// GET -  http://127.0.0.1:4000/api/events/archived | Fetches all archived events from the firebase database with pagination and 10 events per page
// GET - http://127.0.0.1:4000/api/events/:id | Fetches specific events by UUID
router.get('/', getAllEvents);
router.get('/archived', getArchivedEvents);
router.get('/:id', getEventById);

// Administrative API Calls, requires firebaseToken for authentication
// POST - http://127.0.0.1:4000/api/events | Adds a new event to the firebase database
// PUT - http://127.0.0.1:4000/api/events/:id | Updates specific event by UUID
// DELETE - http://127.0.0.1:4000/api/events/:id | Deletes specific event by UUID (permanent delete)
// PUT - ARCHIVE - http://127.0.0.1:4000/api/events/:id/archive | Deletes and event by archiving it by UUID (temporary delete)
router.post('/', verifyFirebaseToken, createEvent);
router.put('/:id', verifyFirebaseToken, updateEvent);
router.delete('/:id', verifyFirebaseToken, deleteEvent);
router.put('/:id/archive', verifyFirebaseToken, archiveEvent); // archive/unarchive

router.get('/route/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Event Routes are working.' });
})

export default router;