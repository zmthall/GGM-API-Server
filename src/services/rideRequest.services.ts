// /services/rideRequest.services.ts
import { deleteDocument, getDocument, getPaginatedDocuments, getPaginatedDocumentsByDateRange, saveEmailData, updateDocument } from "../helpers/firebase";
import { Zippper } from "../helpers/fileZip";
import { RideRequestPDFGenerator } from "../helpers/pdfGenerator/rideRequestPDFGenerator";
import type { RideRequestData, RideRequestDocument } from "../types/rideRequest";
import type { PaginatedResult, PaginationOptions } from "../types/pagination";
import type { PDFFile } from "../types/PDF";
import { cryptoService } from "./crypto.services";
import * as EmailService from "./email.services"

export const submitRideRequestForm = async (rideData: RideRequestData) => {
  let results: {
    success: boolean;
    emailSuccess: boolean;
    documentId: string | undefined;
    messageId: string | undefined;
    emailError?: string | undefined;
  } = {
    success: true,
    emailSuccess: false,
    documentId: '',
    messageId: ''
  }

  // Step 1: encrypt data
  const encryptedData = cryptoService.encryptRideRequest(rideData);

  // Step 2: Save to database
  try {
    const saveResult = await saveEmailData(encryptedData, 'ride_requests', {
      contact_type: 'Ride Request'
    });
    if(saveResult.id)
      results.documentId = saveResult.id;
  } catch (error) {
    throw new Error(`Failed to save to database: {ERROR} - ${(error as Error).message}`)
  }

  // Step 3: Send email
  try {
    const emailResult = await EmailService.sendRideRequestEmail(rideData);
    if(emailResult.success) {
      results.messageId = emailResult.messageId
      results.emailSuccess = true;
    } else {
      results.emailError = emailResult.error;
      results.emailSuccess = false;
    }
  } catch (error) {
    throw new Error(`Failed to send ride request form email: {ERROR} - ${(error as Error).message}`)
  }

  // Step 4: Update database record with email status
  try {
    if (results.messageId !== '') {
      const updateData = {
        email_status: 'email_sent',
        email_sent_at: new Date().toISOString(),
        ...(results.messageId && { message_id: results.messageId })
      };
      if(results.documentId)
        await updateDocument('ride_requests', results.documentId, updateData);
    } else {
      const updateData = {
        email_status: 'email_failed',
        email_failed_at: new Date().toISOString(),
        ...(results.emailError && { email_error: results.emailError })
      };
      if(results.documentId)
        await updateDocument('ride_requests', results.documentId, updateData);
    }
  } catch (error) {
    throw new Error(`Failed to update ride request status: {ERROR} - ${(error as Error).message}`)
  }

  return results;
}

export const getAllRideRequests = async (
  filters: Record<string, any> = {},
  omits: Record<string, string[] | string> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<RideRequestDocument>> => {
  try {
    const page = options.page || 1;
    const pageSize = options.pageSize || 5;

    // normalize omits to string[]
    const omitMap: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(omits || {})) {
      const arr = Array.isArray(v) ? v : [v];
      const cleaned = arr.map(s => String(s).trim()).filter(Boolean);
      if (cleaned.length) omitMap[k] = Array.from(new Set(cleaned));
    }

    const omitFields = Object.keys(omitMap);

    // Case A: exactly one omit field with exactly one value -> let helper push a single "!="
    if (omitFields.length === 1 && omitMap[omitFields[0]].length === 1) {
      const singleField = omitFields[0];
      const singleValue = omitMap[singleField][0];

      const result = await getPaginatedDocuments<RideRequestDocument>(
        'ride_requests',
        filters,
        { [singleField]: singleValue }, // uses your helper's single '!='
        {
          pageSize,
          page,
          orderField: 'created_at',
          orderDirection: 'desc',
          ...options,
        }
      );

      const decryptedResults = cryptoService.decryptRideRequests(result.data);
      return {
        data: decryptedResults,
        pagination: result.pagination,
      };
    }

    // Case B: multiple omits or multiple values -> fetch with NO omits, post-filter, then paginate
    // We ask helper for a large page to get everything because your helper fetches all then paginates in JS anyway.
    const raw = await getPaginatedDocuments<RideRequestDocument>(
      'ride_requests',
      filters,
      {}, // no omits in Firestore to avoid the multiple-negative error
      {
        pageSize: 1000000, // effectively "all" (dataset assumed small per your helper's comment)
        page: 1,
        orderField: 'created_at',
        orderDirection: 'desc',
        ...options,
      }
    );

    // decrypt then apply omits in memory
    const decryptedAll = cryptoService.decryptRideRequests(raw.data);

    const filtered = decryptedAll.filter(row => {
      for (const [field, values] of Object.entries(omitMap)) {
        const v = (row as any)[field];
        if (values.includes(String(v))) return false; // omit match
      }
      return true;
    });

    // paginate the filtered set
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = filtered.slice(startIndex, endIndex);

    return {
      data: pageData,
      pagination: {
        currentPage: page,
        pageSize,
        hasNextPage: endIndex < filtered.length,
        hasPreviousPage: page > 1,
        totalPages: Math.ceil(filtered.length / pageSize),
        totalCount: filtered.length,
      },
    };
  } catch (error) {
    throw new Error(`Failed to get ride requests: ${(error as Error).message}`);
  }
};

export const getRideRequestById = async (id: string): Promise<RideRequestDocument> => {
  try {
    const result = await getDocument<RideRequestDocument>('ride_requests', id);

    if (!result) {
      throw new Error('Contact form not found');
    }

    const decryptedResult = cryptoService.decryptRideRequest(result);

    return decryptedResult;
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
    
    const decryptedData = cryptoService.decryptRideRequests(result.data);
    
    return {
      ...result,
      data: decryptedData
    };
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

export const updateRideRequestTags = async (
  id: string, 
  newTags: string[]
): Promise<{ id: string; tags: string[]; updated_at: string }> => {
  try {
    // First get the existing ride request to get current tags
    const existingRideRequest = await getDocument('ride_requests', id);
    
    if (!existingRideRequest) {
      throw new Error('Ride request not found');
    }
    
    // Combine existing tags with new tags and remove duplicates
    const updatedTags = [...new Set([...newTags])];
    
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

export const createRideRequestPDFById = async (id: string): Promise<Buffer> => {
  try {
    const rideRequest = await getRideRequestById(id);
    
    if (!rideRequest) {
      throw new Error('Ride request not found');
    }

    const pdfBuffer = await RideRequestPDFGenerator.createSinglePDF(rideRequest);
    return pdfBuffer;
  } catch (error) {
    throw new Error(`Failed to create ride request PDF: ${(error as Error).message}`);
  }
};

export const createRideRequestPDFBulk = async (ids: string[]): Promise<Buffer> => {
  try {
    const pdfFiles: PDFFile[] = [];
    
    // Generate PDF for each ride request
    for (const id of ids) {
      const rideRequest = await getRideRequestById(id);
      
      if (!rideRequest) {
        console.warn(`Ride request with ID ${id} not found, skipping...`);
        continue;
      }
      
      const pdfBuffer = await RideRequestPDFGenerator.createSinglePDF(rideRequest);
      const filename = `ride-request-${rideRequest.name.replace(/\s+/g, '-').toLowerCase()}-${id.substring(0, 8)}.pdf`;
      
      pdfFiles.push({
        buffer: pdfBuffer,
        filename: filename
      });
    }
    
    if (pdfFiles.length === 0) {
      throw new Error('No valid ride requests found for the provided IDs');
    }
    
    const zipBuffer = await Zippper.createPDFZip(pdfFiles);
    return zipBuffer;
  } catch (error) {
    throw new Error(`Failed to create bulk ride request PDFs: ${(error as Error).message}`);
  }
};