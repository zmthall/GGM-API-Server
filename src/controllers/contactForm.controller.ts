// /controllers/contactForm.controller.ts
import * as contactForm from '../services/contactForm.services';
import type { NextFunction, Request, Response } from 'express';
import contentDisposition from 'content-disposition';

// tiny helper to keep filenames header-safe
const safe = (s: string) =>
  (s ?? '')
    .normalize('NFKC')
    .replace(/[\\/:*?"<>|\r\n]/g, '_')
    .trim()
    .slice(0, 120);

export const getAllContactForms = async (req: Request, res: Response) => {
  try {
    // Read both page and limit/pageSize parameters
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.limit as string) || parseInt(req.query.pageSize as string) || 10;

    // Extract filters from query parameters
    const filters: Record<string, any> = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.email_status) filters.email_status = req.query.email_status;
    if (req.query.reason) filters.reason = req.query.reason;
    if (req.query.contact_method) filters.contact_method = req.query.contact_method;
    // Add more filters as needed

    const result = await contactForm.getAllContactForms(filters, { page, pageSize });
    
    // Return the format your frontend expects
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

export const getContactFormById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Contact form ID is required'
      });
      return;
    }

    const contactFormData = await contactForm.getContactFormById(id);
    
    if (!contactFormData) {
      res.status(404).json({
        success: false,
        message: 'Contact form not found'
      });
      return;
    }

    res.json({
      success: true,
      data: contactFormData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const getContactFormsByDate = async (req: Request, res: Response) => {
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

    // Extract additional filters from query parameters
    const filters: Record<string, any> = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.email_status) filters.email_status = req.query.email_status;
    if (req.query.reason) filters.reason = req.query.reason;
    if (req.query.contact_method) filters.contact_method = req.query.contact_method;

    const result = await contactForm.getContactFormsByDate(date, filters, { page, pageSize });
    
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

export const getContactFormsByDateRange = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.params;
    
    // Read pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.limit as string) || parseInt(req.query.pageSize as string) || 10;

    const result = await contactForm.getContactFormsByDateRange(
      { startDate, endDate }, 
      {}, 
      { page, pageSize }
    );
    
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

export const getContactFormsByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    
    // Read pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.limit as string) || parseInt(req.query.pageSize as string) || 10;

    const result = await contactForm.getContactFormsByStatus(
      { status: status }, 
      { page, pageSize }
    );
    
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

export const updateContactFormStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Contact form ID is required'
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
    const validStatuses = ['new', 'completed', 'reviewing', 'spam', 'closed'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
      return;
    }

    const result = await contactForm.updateContactFormStatus(id, status);
    
    res.json({
      success: true,
      message: 'Contact form status updated successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const addTagsToContactForm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Contact form ID is required'
      });
      return;
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Tags array is required and must contain at least one tag'
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

    const result = await contactForm.addTagsToContactForm(id, cleanedTags);
    
    res.json({
      success: true,
      message: 'Tags added to contact form successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const deleteContactForm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Contact form ID is required'
      });
      return;
    }

    // Check if contact form exists before deleting
    const existingContactForm = await contactForm.getContactFormById(id);
    if (!existingContactForm) {
      res.status(404).json({
        success: false,
        message: 'Contact form not found'
      });
      return;
    }

    await contactForm.deleteContactForm(id);
    
    res.json({
      success: true,
      message: 'Contact form deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const createContactFormPDFById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const log = req.log.child({ route: 'contactForm.exportPDF', contactFormId: id });

  if (!id) {
    log.warn('missing-id');
    res.status(400).json({ success: false, message: 'Missing route param: id' });
    return;
  }

  const t0 = process.hrtime.bigint();
  log.info('start');

  try {
    // ⚡ See #2 about avoiding the second DB fetch
    const tGen0 = process.hrtime.bigint();
    const pdfBuffer = await contactForm.createContactFormPDFById(id);
    const genMs = Number((process.hrtime.bigint() - tGen0) / 1_000_000n);
    log.debug({ genMs, pdfBytes: pdfBuffer.length }, 'pdf-generated');

    const contactFormDocument = await contactForm.getContactFormById(id);
    if (!contactFormDocument) log.warn('contact-form-not-found-for-filename');

    const base = contactFormDocument
      ? safe(`contact-form-${contactFormDocument.first_name}-${contactFormDocument.last_name}`)
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

    const durationMs = Number((process.hrtime.bigint() - t0) / 1_000_000n);
    log.info({ durationMs, filename, pdfBytes: pdfBuffer.length }, 'success');
  } catch (err) {
    log.error({ err }, 'export-pdf-error');
    next(err); // let the central error handler respond
    return;
  }
};


export const createContactFormPDFBulk = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        success: false,
        message: 'ids array is required and cannot be empty'
      });
      return;
    }

    const zipBuffer = await contactForm.createContactFormPDFBulk(ids);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `contact-forms-bulk-${timestamp}.zip`;
    
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