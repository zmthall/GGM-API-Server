// /services/rideRequest.services.ts
import { deleteDocument, getDocument, getPaginatedDocuments, getPaginatedDocumentsByDateRange, updateDocument } from "../helpers/firebase";
import { RideRequestDocument } from "../types/rideRequest";
import { PaginatedResult, PaginationOptions } from "../types/pagination";

export const getAllRideRequests = async (
  filters: Record<string, any> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<RideRequestDocument>> => {
  try {
    const page = options.page || 1;
    const pageSize = options.pageSize || 5;
    
    const result = await getPaginatedDocuments<RideRequestDocument>(
      'ride_requests',
      filters, // Dynamic filters
      {
        pageSize,
        page,
        orderField: 'created_at',
        orderDirection: 'desc', // Newest first
        ...options
      }
    );

    return {
      data: result.data,
      pagination: result.pagination
    };
  } catch (error) {
    throw new Error(`Failed to get ride requests: ${(error as Error).message}`);
  }
};

export const getRideRequestById = async (id: string): Promise<RideRequestDocument | null> => {
  try {
    const result = await getDocument('ride_requests', id);
    return result as RideRequestDocument | null;
  } catch (error) {
    throw new Error(`Failed to get ride request: ${(error as Error).message}`);
  }
};

export const getRideRequestsByDate = async (
  date: string,
  filters: Record<string, any> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<RideRequestDocument>> => {
  try {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    
    // Parse the date as UTC to avoid timezone issues
    const [year, month, day] = date.split('-');
    const startDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999));
    
    const result = await getPaginatedDocumentsByDateRange<RideRequestDocument>(
      'ride_requests',
      'created_at',
      startDate.toISOString(),
      endDate.toISOString(),
      filters,
      {
        pageSize,
        page,
        orderDirection: 'desc',
        ...options
      }
    );
    
    return result;
  } catch (error) {
    console.error('Date query error:', error);
    throw new Error(`Failed to get ride requests by date: ${(error as Error).message}`);
  }
};

export const updateRideRequestStatus = async (
  id: string, 
  status: 'new' | 'completed' | 'reviewing' | 'declined'
): Promise<{ id: string; status: string; updated_at: string }> => {
  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    const result = await updateDocument('ride_requests', id, updateData);
    return result;
  } catch (error) {
    throw new Error(`Failed to update ride request status: ${(error as Error).message}`);
  }
};

export const addTagsToRideRequest = async (
  id: string, 
  newTags: string[]
): Promise<{ id: string; tags: string[]; updated_at: string }> => {
  try {
    // First get the existing ride request to get current tags
    const existingRideRequest = await getDocument('ride_requests', id);
    
    if (!existingRideRequest) {
      throw new Error('Ride request not found');
    }

    // Get existing tags or default to empty array
    const existingTags = existingRideRequest.tags || [];
    
    // Combine existing tags with new tags and remove duplicates
    const updatedTags = [...new Set([...existingTags, ...newTags])];
    
    const updateData = {
      tags: updatedTags,
      updated_at: new Date().toISOString()
    };

    const result = await updateDocument('ride_requests', id, updateData);
    return result;
  } catch (error) {
    throw new Error(`Failed to add tags to ride request: ${(error as Error).message}`);
  }
};

export const deleteRideRequest = async (id: string): Promise<void> => {
  try {
    await deleteDocument('ride_requests', id);
  } catch (error) {
    throw new Error(`Failed to delete ride request: ${(error as Error).message}`);
  }
};