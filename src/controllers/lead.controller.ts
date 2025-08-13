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