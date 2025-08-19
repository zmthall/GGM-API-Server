// controllers/lead.controller.ts
import { Request, Response } from 'express';
import * as leadService from '../services/lead.services';

export const createLead = async (req: Request, res: Response) => {
  try {
    const lead = await leadService.createLead(req.body);
    
    res.status(201).json({
      success: true,
      data: lead,
      message: 'Lead created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const createMultipleLeads = async (req: Request, res: Response) => {
  try {
    const leads = await leadService.createMultipleLeads(req.body);

    res.status(201).json({
      success: true,
      data: leads,
      message: 'Lead created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message
    });
  }
}

// controllers/lead.controller.ts
export const getLeads = async (req: Request, res: Response) => {
  try {
    // Read both page and limit/pageSize parameters
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.limit as string) || parseInt(req.query.pageSize as string) || 10;

    const result = await leadService.getAllLeads({ page, pageSize });
    
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

export const getLeadsByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    
    // Read pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.limit as string) || parseInt(req.query.pageSize as string) || 10;

    const result = await leadService.getLeadsByDate(date, {}, { page, pageSize });
    
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

export const getLeadsByDateRange = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.params;
    
    // Read pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.limit as string) || parseInt(req.query.pageSize as string) || 10;

    const result = await leadService.getLeadsByDateRange({startDate, endDate}, {}, { page, pageSize });
    
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

export const getLeadsByStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    
    // Read pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.limit as string) || parseInt(req.query.pageSize as string) || 10;

    const result = await leadService.getLeadsByStatus({status: status}, { page, pageSize });
    
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

export const getLeadsByFilters = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.limit as string) || parseInt(req.query.pageSize as string) || 10;

    // Remove pagination params from filters
    const { page: _, limit: __, pageSize: ___, ...filters } = req.query;

    const result = await leadService.getLeadsByStatus({...filters}, { page, pageSize });
    
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

export const updateLead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedLead = await leadService.updateLead(id, updateData);
    
    res.json({
      success: true,
      data: updatedLead,
      message: 'Lead updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const updateLeadTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tag } = req.body;

    const updatedLead = await leadService.updateLeadTag(id, tag);
    
    res.json({
      success: true,
      data: updatedLead,
      message: 'Lead tags updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const updateLeadStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedLead = await leadService.updateLeadStatus(id, status);
    
    res.json({
      success: true,
      data: updatedLead,
      message: 'Lead status updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const updateLeadStatusBulk = async (req: Request, res: Response) => {
  try {
    const { ids, status } = req.body;

    const updatedLeads = await leadService.updateLeadStatusBulk(ids, status);
    
    res.json({
      success: true,
      data: updatedLeads,
      message: `${updatedLeads.length} leads status updated successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const deleteLead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await leadService.deleteLead(id);
    
    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const searchLeads = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Search query parameter "q" is required'
      });
      return;
    }

    if (q.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters long'
      });
      return;
    }

    // Read pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.limit as string) || parseInt(req.query.pageSize as string) || 10;

    // Extract date filters
    const dateFilters: Record<string, string> = {};
    if (req.query.creation_date_from) dateFilters.creation_date_from = req.query.creation_date_from as string;
    if (req.query.creation_date_to) dateFilters.creation_date_to = req.query.creation_date_to as string;
    if (req.query.last_updated_from) dateFilters.last_updated_from = req.query.last_updated_from as string;
    if (req.query.last_updated_to) dateFilters.last_updated_to = req.query.last_updated_to as string;

    // Validate date formats (MM-DD-YYYY)
    const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])-\d{4}$/;
    for (const [key, value] of Object.entries(dateFilters)) {
      if (!dateRegex.test(value)) {
        res.status(400).json({
          success: false,
          message: `Invalid date format for ${key}. Use MM-DD-YYYY`
        });
        return;
      }
    }

    // Extract other filters (excluding pagination and date params)
    const { 
      q: _, page: __, limit: ___, pageSize: ____, 
      creation_date_from: _____, creation_date_to: ______, 
      last_updated_from: _______, last_updated_to: ________, 
      ...otherFilters 
    } = req.query;

    const result = await leadService.searchLeads(q.trim(), otherFilters, dateFilters, { page, pageSize });
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      searchTerm: q.trim(),
      appliedFilters: otherFilters,
      dateFilters: dateFilters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const getLeadStats = async (req: Request, res: Response) => {
  try {
    const stats = await leadService.getLeadStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const getLeadById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const lead = await leadService.getLeadById(id);
    
    if (!lead) {
      res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
      return;
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const createLeadPDFById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pdfBuffer = await leadService.createLeadPDFById(id);
    
    // Get lead name for filename (optional - could just use ID)
    const lead = await leadService.getLeadById(id);
    const filename = lead 
      ? `lead-${lead.name.replace(/\s+/g, '-').toLowerCase()}-${id.substring(0, 8)}.pdf`
      : `lead-${id.substring(0, 8)}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const createLeadPDFAll = async (req: Request, res: Response) => {
  try {
    const pdfBuffer = await leadService.createLeadPDFAll();
    
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = `all-leads-report-${currentDate}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const createLeadPDFByDateRange = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        message: 'Both startDate and endDate are required (MM-DD-YYYY format)'
      });
      return;
    }

    // Validate date formats (MM-DD-YYYY)
    const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])-\d{4}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Use MM-DD-YYYY'
      });
      return;
    }

    const pdfBuffer = await leadService.createLeadPDFByDateRange(startDate, endDate);
    
    const filename = `leads-report-${startDate.replace(/\//g, '-')}-to-${endDate.replace(/\//g, '-')}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};

export const createLeadPDFByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    if (!date) {
      res.status(400).json({
        success: false,
        message: 'Date is required (MM-DD-YYYY format)'
      });
      return;
    }

    // Validate date formats (MM-DD-YYYY)
    const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])-\d{4}$/;
    if (!dateRegex.test(date)) {
      res.status(400).json({
        success: false,
        message: 'Invalid date format. Use MM-DD-YYYY'
      });
      return;
    }

    const pdfBuffer = await leadService.createLeadPDFByDate(date);
    
    const filename = `leads-report-${date.replace(/\//g, '-')}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message
    });
  }
};