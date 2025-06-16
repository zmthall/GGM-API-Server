import * as eventService from '../services/event.services';
import { Request, Response } from 'express';

export const createEvent = async (req: Request, res: Response) => {
  const result = await eventService.createEvent(req.body);
  res.status(201).json(result);

  return;
};

export const getAllEvents = async (_req: Request, res: Response) => {
  const events = eventService.getAllEvents();
  res.json(events);

  return;
};

export const getEventById = async (req: Request, res: Response) => {
  const event = await eventService.getEventById(req.params.id);
  res.json(event);

  return;
};

export const updateEvent = async (req: Request, res: Response) => {
  const updated = await eventService.updateEvent(req.params.id, req.body);
  res.json(updated);

  return;
};

export const deleteEvent = async (req: Request, res: Response) => {
  eventService.deleteEvent(req.params.id);
  res.status(204).send();

  return;
};

export const archiveEvent = async (req: Request, res: Response) => {
  const archived = await eventService.archiveEvent(req.params.id);
  res.json(archived);

  return;
};