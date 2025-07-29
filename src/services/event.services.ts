// /services/event.services.ts
import { validateEvent } from '../helpers/eventValidation';
import { createDocument, deleteDocument, getDocument, getPaginatedDocuments, updateDocument } from '../helpers/firebase';
import type { Event, PaginatedResult, PaginationOptions } from '../types/event'; 

export const createEvent = async (data: Omit<Event, 'id'>): Promise<Event> => {
  // Convert date to ISO format if it's not already
  const processedData = {
    ...data,
    archived: false
  };

  const validation = validateEvent(processedData);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }

  processedData.date = new Date(processedData.date).toISOString() // Ensure ISO format
  
  try {
    const result = await createDocument('events', processedData);
    
    return {
      id: result.id,
      ...result.data
    } as Event;
  } catch (error) {
    throw new Error(`Failed to create event: ${(error as Error).message}`);
  }
};

export const getAllEvents = async (options: PaginationOptions = {}): Promise<PaginatedResult<Event>> => {
  try {
    const page = options.page || 1;
    const pageSize = options.pageSize || 5;
    
    const result = await getPaginatedDocuments<Event>(
      'events',
      { archived: false },
      {
        pageSize,
        page,
        orderField: 'date',
        orderDirection: 'asc',
        ...options
      }
    );

    // Transform the result to match your PaginatedResult interface
    const hasNextPage = result.data.length === pageSize;
    const hasPreviousPage = page > 1;

    return {
      data: result.data,
      pagination: {
        currentPage: page,
        pageSize,
        hasNextPage,
        hasPreviousPage,
        // Optional: add these if you can get them from somewhere
        totalPages: undefined,
        totalCount: undefined
      }
    };
  } catch (error) {
    throw new Error(`Failed to get events: ${(error as Error).message}`);
  }
};

export const getArchivedEvents = async (options: PaginationOptions = {}): Promise<PaginatedResult<Event>> => {
  try {
    // Get archived events, ordered by date (most recent first)
    const result = await getPaginatedDocuments<Event>(
      'events',
      { archived: true }, // Filter for archived events only
      {
        pageSize: 10,
        orderField: 'date',
        orderDirection: 'desc',
        ...options // Allow overriding defaults
      }
    );

    return result;
  } catch (error) {
    throw new Error(`Failed to get archived events: ${(error as Error).message}`);
  }
};

export const getEvent = async (id: string): Promise<Event | null> => {
  try {
    const event = await getDocument('events', id);
    
    if (!event) {
      return null;
    }
    
    return event as Event;
  } catch (error) {
    throw new Error(`Failed to get event: ${(error as Error).message}`);
  }
};

export const updateEvent = async (id: string, data: Partial<Omit<Event, 'id'>>): Promise<Event | null> => {
  try {
    // First check if the event exists
    const existingEvent = await getDocument('events', id);
    
    if (!existingEvent) {
      return null;
    }

    // Validate the update data (only validate provided fields)
    const validation = validateEvent({ ...existingEvent, ...data });
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Update the document
    await updateDocument('events', id, data);
    
    // Get the updated document to return the full event
    const updatedEvent = await getDocument('events', id);
    
    return updatedEvent as Event;
  } catch (error) {
    throw new Error(`Failed to update event: ${(error as Error).message}`);
  }
};

export const deleteEvent = async (id: string): Promise<boolean> => {
  try {
    // First check if the event exists
    const existingEvent = await getDocument('events', id);
    
    if (!existingEvent) {
      return false;
    }

    // Permanently delete the document
    await deleteDocument('events', id);
    
    return true;
  } catch (error) {
    throw new Error(`Failed to delete event: ${(error as Error).message}`);
  }
};

export const archiveEvent = async (id: string): Promise<Event | null> => {
  try {
    // First check if the event exists
    const existingEvent = await getDocument('events', id);
    
    if (!existingEvent) {
      return null;
    }

    // Toggle the archived status
    const newArchivedStatus = !existingEvent.archived;
    
    // Update the document
    await updateDocument('events', id, { archived: newArchivedStatus });
    
    // Get the updated document to return
    const updatedEvent = await getDocument('events', id);
    
    return updatedEvent as Event;
  } catch (error) {
    throw new Error(`Failed to archive event: ${(error as Error).message}`);
  }
};