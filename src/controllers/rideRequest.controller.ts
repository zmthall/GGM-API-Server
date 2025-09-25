// /controllers/rideRequest.controller.ts
import * as rideRequest from '../services/rideRequest.services';
import type { NextFunction, Request, Response } from 'express';
import contentDisposition from 'content-disposition';

const safe = (s: string) =>
  (s ?? '')
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|\r\n\s]/g, '_') // includes spaces now
    .trim()
    .slice(0, 120);

export const submitRideRequestForm = async (req: Request, res: Response) => {  
  try {
    const rideData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'dob', 'phone', 'email', 'med_id', 'apt_date', 'apt_time', 'pickup_address', 'dropoff_address'];
    const missingFields = requiredFields.filter(field => !rideData[field]);
    
    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
      return;
    }

    // Validate date formats
    const appointmentDate = new Date(rideData.apt_date);
    const appointmentTime = new Date(rideData.apt_time);
    const dateOfBirth = new Date(rideData.dob);

    if (isNaN(appointmentDate.getTime()) || isNaN(appointmentTime.getTime()) || isNaN(dateOfBirth.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format provided'
      });
      return;
    }

    const results = await rideRequest.submitRideRequestForm(rideData)

    if (results.success) {
      res.status(200).json({
        success: true,
        message: 'Ride request form submitted successfully',
        messageId: results.messageId,
        contactId: results.documentId
      });
      res.status(400).json({
        success: false,
        message: results.emailError || 'Failed to send ride request form email',
        contactId: results.documentId
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: (error as Error).message
    });
  }
};

export const getAllRideRequests = async (req: Request, res: Response) => {
  try {
    // Read both page and limit/pageSize parameters
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.limit as string) || parseInt(req.query.pageSize as string) || 5;

    // Extract filters from query parameters
    const filters: Record<string, any> = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.email_status) filters.email_status = req.query.email_status;
    // Add ride request specific filters
    if (req.query.name) filters.name = req.query.name;
    if (req.query.med_id) filters.med_id = req.query.med_id;

    const result = await rideRequest.getAllRideRequests(filters, { page, pageSize });
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const getRideRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Ride request ID is required'
      });
      return;
    }

    const rideRequestData = await rideRequest.getRideRequestById(id);
    
    if (!rideRequestData) {
      res.status(404).json({
        success: false,
        message: 'Ride request not found'
      });
      return;
    }

    res.json({
      success: true,
      data: rideRequestData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const getRideRequestsByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.limit as string) || parseInt(req.query.pageSize as string) || 10;
    
    if (!date) {
      res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
      return;
    }

    // Validate MM-DD-YYYY format
    const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])-\d{4}$/;
    if (!dateRegex.test(date)) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Use MM-DD-YYYY'
      });
      return;
    }

    // Convert MM-DD-YYYY to YYYY-MM-DD for Date constructor
    const [month, day, year] = date.split('-');
    const isoDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    // Validate the converted date
    const parsedDate = new Date(isoDateString);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid date provided'
      });
      return;
    }

    // Extract additional filters from query parameters
    const filters: Record<string, any> = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.email_status) filters.email_status = req.query.email_status;
    if (req.query.name) filters.name = req.query.name;
    if (req.query.med_id) filters.med_id = req.query.med_id;

    const result = await rideRequest.getRideRequestsByDate(isoDateString, filters, { page, pageSize });
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      date: date // Return the original MM-DD-YYYY format
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const updateRideRequestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Ride request ID is required'
      });
      return;
    }

    if (!status) {
      res.status(400).json({
        success: false,
        message: 'Status is required'
      });
      return;
    }

    // Validate status values
    const validStatuses = ['new', 'completed', 'reviewing', 'spam', 'declined'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
      return;
    }

    const result = await rideRequest.updateRideRequestStatus(id, status);
    
    res.json({
      success: true,
      message: 'Ride request status updated successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const updateRideRequestTags = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Ride request ID is required'
      });
      return;
    }

    if (!tags || !Array.isArray(tags)) {
      res.status(400).json({
        success: false,
        message: 'Tags array is required'
      });
      return;
    }

    // Validate that all tags are strings
    const invalidTags = tags.filter(tag => typeof tag !== 'string' || tag.trim() === '');
    if (invalidTags.length > 0) {
      res.status(400).json({
        success: false,
        message: 'All tags must be non-empty strings'
      });
      return;
    }

    // Clean and format tags (trim whitespace, convert to lowercase for consistency)
    const cleanedTags = tags.map(tag => tag.trim().toLowerCase());

    const result = await rideRequest.updateRideRequestTags(id, cleanedTags);
    
    res.json({
      success: true,
      message: 'Tags added to ride request successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const deleteRideRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Ride request ID is required'
      });
      return;
    }

    // Check if ride request exists before deleting
    const existingRideRequest = await rideRequest.getRideRequestById(id);
    if (!existingRideRequest) {
      res.status(404).json({
        success: false,
        message: 'Ride request not found'
      });
      return;
    }

    await rideRequest.deleteRideRequest(id);
    
    res.json({
      success: true,
      message: 'Ride request deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const createRideRequestPDFById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const log = req.log.child({ route: 'rideRequest.exportPDF', rideRequestId: id });
  
    if (!id) {
      log.warn('missing-id');
      res.status(400).json({ success: false, message: 'Missing route param: id' });
      return;
    }

    try {
      const pdfBuffer = await rideRequest.createRideRequestPDFById(id);
  
      const rideRequestDocument = await rideRequest.getRideRequestById(id);
      if (!rideRequestDocument) log.warn('contact-form-not-found-for-filename');
  
      const base = rideRequestDocument
        ? safe(`contact-form-${rideRequestDocument.name.trim()}`)
        : 'contact-form';
      const filename = `${base}-${id.slice(0, 8)}.pdf`;
  
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', contentDisposition(filename));
      res.setHeader('X-Filename', encodeURIComponent(filename));
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, X-Filename');
      res.setHeader('Content-Length', String(pdfBuffer.length));
  
      // log aborted downloads too
      res.on('close', () => {
        if (!res.writableEnded) {
          log.warn({ statusCode: res.statusCode }, 'download-aborted');
        }
      });
  
      res.end(pdfBuffer);
  
      log.info({ filename, pdfBytes: pdfBuffer.length }, 'success');
    } catch (err) {
      log.error({ err }, 'export-pdf-error');
      next(err); // let the central error handler respond
      return;
    }
};

export const createRideRequestPDFBulk = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        success: false,
        message: 'ids array is required and cannot be empty'
      });
      return;
    }

    const zipBuffer = await rideRequest.createRideRequestPDFBulk(ids);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `ride-requests-bulk-${timestamp}.zip`;
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(zipBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};