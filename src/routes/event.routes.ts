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
import { authenticateKey } from '../middlewares/authenticateKey';

const router = Router();

// POST - http://127.0.0.1:4000/api/events | Adds a new event to the firebase database
// GET -  http://127.0.0.1:4000/api/events | Fetches all events from the firebase database with pagination and 5 events per page
// GET -  http://127.0.0.1:4000/api/events/archived | Fetches all archived events from the firebase database with pagination and 10 events per page
// GET - http://127.0.0.1:4000/api/events/:id | Fetches specific events by UUID
// PUT - http://127.0.0.1:4000/api/events/:id | Updates specific event by UUID
// DELETE - http://127.0.0.1:4000/api/events/:id | Deletes specific event by UUID (permanent delete)
// PUT - ARCHIVE - http://127.0.0.1:4000/api/events/:id/archive | Deletes and event by archiving it by UUID (temporary delete)
router.post('/', authenticateKey, createEvent);
router.get('/', getAllEvents);
router.get('/archived', getArchivedEvents)
router.get('/:id', getEventById);
router.put('/:id', authenticateKey, updateEvent);
router.delete('/:id', authenticateKey, deleteEvent);
router.put('/:id/archive', authenticateKey, archiveEvent); // archive/unarchive

router.get('/route/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Event Routes are working.' });
})

export default router;