import { Router } from 'express';
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  archiveEvent,
} from '../controllers/event.controller';

const router = Router();

router.post('/', createEvent);
router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);
router.put('/:id/archive', archiveEvent); // archive/unarchive

export default router;