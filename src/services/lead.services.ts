// services/lead.service.ts
import { Lead } from '../types/lead';
import { createDocument, getPaginatedDocuments, getPaginatedDocumentsByDateRange } from '../helpers/firebase'; // Assuming you have this utility
import { validateLead } from '../helpers/leadValidation';
import { PaginatedResult, PaginationOptions } from '../types/pagination';

export const createLead = async (data: Omit<Lead, 'id'>): Promise<Lead> => {
  const currentTimestamp = new Date().toISOString();
  
  const processedData = {
    ...data,
    creation_date: currentTimestamp,
    status: data.status || 'New',
    tag: data.tag || []
  };

  const validation = validateLead(processedData);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
  }
  
  try {
    const result = await createDocument('leads', processedData);
    
    return {
      id: result.id,
      ...result.data
    } as Lead;
  } catch (error) {
    throw new Error(`Failed to create lead: ${(error as Error).message}`);
  }
};

export const getAllLeads = async (options: PaginationOptions = {}): Promise<PaginatedResult<Lead>> => {
  try {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
   
    const result = await getPaginatedDocuments<Lead>(
      'leads',
      {}, // No filter needed unless you want to exclude certain leads
      {
        pageSize,
        page,
        orderField: 'creation_date',
        orderDirection: 'desc', // Most recent leads first
        ...options
      }
    );

    return {
      data: result.data,
      pagination: result.pagination
    };
  } catch (error) {
    throw new Error(`Failed to get leads: ${(error as Error).message}`);
  }
};

export const getLeadsByDate = async (
  date: string,
  filters: Record<string, any> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<Lead>> => {
  try {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    
    const [month, day, year] = date.split('-')

    const startDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999));
    
    console.log(startDate, ',', endDate)
    
    const result = await getPaginatedDocumentsByDateRange<Lead>(
        'leads',
        'creation_date',
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
    console.error('Service error:', error);
    throw new Error(`Failed to get leads by date: ${(error as Error).message}`);
  }
};

export const getLeadsByDateRange = async (
  dateRange: Record<string, any> = {},
  filters: Record<string, any> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<Lead>> => {
  try {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    
    const [startMonth, startDay, startYear] = dateRange.startDate.split('-');
    const startDate = new Date(Date.UTC(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay), 0, 0, 0, 0));

    const [endMonth, endDay, endYear] = dateRange.endDate.split('-');
    const endDate = new Date(Date.UTC(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay), 23, 59, 59, 999));
    
    console.log(startDate, ',', endDate)
    
    const result = await getPaginatedDocumentsByDateRange<Lead>(
        'leads',
        'creation_date',
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
    console.error('Service error:', error);
    throw new Error(`Failed to get leads by date: ${(error as Error).message}`);
  }
};

export const getLeadsByStatus = async (
  statusFilter: Record<string, any> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<Lead>> => {
  try {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    
    const result = await getPaginatedDocuments<Lead>(
      'leads',
      statusFilter,
      {
        pageSize,
        page,
        orderField: 'creation_date',
        orderDirection: 'desc',
        ...options
      }
    );

    return result;
  } catch (error) {
    throw new Error(`Failed to get leads by status: ${(error as Error).message}`);
  }
};

export const getLeadsByFilters = async (
  additionalFilters: Record<string, any> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<Lead>> => {
  try {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    
    const result = await getPaginatedDocuments<Lead>(
      'leads',
      additionalFilters,
      {
        pageSize,
        page,
        orderField: 'creation_date',
        orderDirection: 'desc',
        ...options
      }
    );

    return result;
  } catch (error) {
    throw new Error(`Failed to get leads by filters: ${(error as Error).message}`);
  }
};