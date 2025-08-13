// /services/event.services.ts
import { convertISOToMMDDYYYY } from '../helpers/dateFormat';
import { validateEvent } from '../helpers/eventValidation';
import { createDocument, deleteDocument, getDocument, getPaginatedDocuments, updateDocument } from '../helpers/firebase';
import type { Event } from '../types/event';
import type { PaginatedResult, PaginationOptions } from '../types/pagination'; 

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

  processedData.date = new Date(processedData.date).toISOString();

  if (processedData.dateTo) {
    processedData.dateTo = new Date(processedData.dateTo).toISOString();
  }
  
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

    // Convert ISO dates back to MM/DD/YYYY for frontend display
    const convertedData = result.data.map((event: Event) => ({
      ...event,
      date: convertISOToMMDDYYYY(event.date),
      dateTo: event.dateTo ? convertISOToMMDDYYYY(event.dateTo) : undefined
    }));

    return {
      data: convertedData,
      pagination: result.pagination
    };
  } catch (error) {
    throw new Error(`Failed to get events: ${(error as Error).message}`);
  }
};

// Do the same for getArchivedEvents
export const getArchivedEvents = async (options: PaginationOptions = {}): Promise<PaginatedResult<Event>> => {
  try {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    
    const result = await getPaginatedDocuments<Event>(
      'events',
      { archived: true },
      {
        page,
        pageSize,
        orderField: 'date',
        orderDirection: 'desc',
        ...options
      }
    );

    // Convert ISO dates back to MM/DD/YYYY for frontend display
    const convertedData = result.data.map((event: Event) => ({
      ...event,
      date: convertISOToMMDDYYYY(event.date),
      dateTo: event.dateTo ? convertISOToMMDDYYYY(event.dateTo) : undefined
    }));

    return {
      data: convertedData,
      pagination: result.pagination
    };
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

    // Validate the update data (only validate provided fields) - BEFORE ISO conversion
    const validation = validateEvent({ ...existingEvent, ...data });
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Convert dates to ISO format AFTER validation (same as createEvent)
    const processedData = { ...data };
    if (processedData.date) {
      processedData.date = new Date(processedData.date).toISOString();
    }
    if (processedData.dateTo) {
      processedData.dateTo = new Date(processedData.dateTo).toISOString();
    }

    // Update the document with processed data
    await updateDocument('events', id, processedData);
    
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