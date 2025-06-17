import * as eventService from '../services/event.services';
import { Request, Response } from 'express';

export const createEvent = async (req: Request, res: Response) => {
  try {
    const event = await eventService.createEvent(req.body);
    
    res.status(201).json({
      success: true,
      data: event,
      message: 'Event created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    
    const result = await eventService.getAllEvents({ pageSize });
    
    res.json({
      success: true,
      data: result.data,
      pagination: {
        hasNextPage: result.hasNextPage,
        pageSize,
        count: result.data.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const getArchivedEvents = async (req: Request, res: Response) => {
  try {
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    
    const result = await eventService.getArchivedEvents({ pageSize });
    
    res.json({
      success: true,
      data: result.data,
      pagination: {
        hasNextPage: result.hasNextPage,
        pageSize,
        count: result.data.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const event = await eventService.getEvent(id);
    
    if (!event) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });

      return;
    }
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });

    return;
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const updatedEvent = await eventService.updateEvent(id, req.body);
    
    if (!updatedEvent) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: updatedEvent,
      message: 'Event updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const deleted = await eventService.deleteEvent(id);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const archiveEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const updatedEvent = await eventService.archiveEvent(id);
    
    if (!updatedEvent) {
      res.status(404).json({
        success: false,
        message: 'Event not found'
      });
      return;
    }
    
    const action = updatedEvent.archived ? 'archived' : 'unarchived';
    
    res.json({
      success: true,
      data: updatedEvent,
      message: `Event ${action} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};