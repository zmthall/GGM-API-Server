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

// PUT -
// GET - 
// GET - 
// GET - 
// POST -
// DELETE - 
// PUT - ARCHIVE 
router.post('/', authenticateKey, createEvent);
router.get('/', getAllEvents);
router.get('/archived', getArchivedEvents)
router.get('/:id', getEventById);
router.put('/:id', authenticateKey, updateEvent);
router.delete('/:id', authenticateKey, deleteEvent);
router.put('/:id/archive', authenticateKey, archiveEvent); // archive/unarchive

export default router;