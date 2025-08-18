// services/lead.service.ts
import { Lead, LeadStatus } from '../types/lead';
import { createDocument, createDocumentsBatch, deleteDocument, getPaginatedDocuments, getPaginatedDocumentsByDateRange, updateDocument } from '../helpers/firebase'; // Assuming you have this utility
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

export const createMultipleLeads = async (leadsData: Omit<Lead, 'id'>[]): Promise<Lead[]> => {
  const processedLeads: Omit<Lead, 'id'>[] = [];
  
  // Validate and process each lead first
  for (const leadData of leadsData) {
    const currentTimestamp = new Date().toISOString();
    
    const processedData = {
      ...leadData,
      creation_date: currentTimestamp,
      status: leadData.status || 'New',
      tag: leadData.tag || []
    };

    const validation = validateLead(processedData);
    if (!validation.isValid) {
      throw new Error(`Validation failed for lead ${leadData.name}: ${validation.errors.map(e => e.message).join(', ')}`);
    }
    
    processedLeads.push(processedData);
  }
  
  // Create all leads in a single batch
  const results = await createDocumentsBatch('leads', processedLeads);
  
  return results.map(result => ({
    id: result.id,
    ...result.data
  } as Lead));
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

export const updateLead = async (
  id: string, 
  updateData: Partial<Omit<Lead, 'id' | 'creation_date'>>
): Promise<Lead> => {
  try {
    // Add last_updated timestamp
    const processedData = {
      ...updateData,
      last_updated: new Date().toISOString()
    };

    // Validate the update data
    const validation = validateLead(processedData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }
    
    const result = await updateDocument('leads', id, processedData);
    
    return result as Lead;
  } catch (error) {
    throw new Error(`Failed to update lead: ${(error as Error).message}`);
  }
};

export const updateLeadTag = async (id: string, tag: string[]): Promise<Lead> => {
  try {
    const updateData = {
      tag,
      last_updated: new Date().toISOString()
    };

    const result = await updateDocument('leads', id, updateData);
    return result as Lead;
  } catch (error) {
    throw new Error(`Failed to update lead tags: ${(error as Error).message}`);
  }
};

export const updateLeadStatus = async (id: string, status: LeadStatus): Promise<Lead> => {
  try {
    // Validate status
    const validStatuses: LeadStatus[] = ['New', 'Reviewed', 'Contacted', 'Qualified', 'Converted', 'Lost', 'Spam'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid lead status');
    }

    const updateData = {
      status,
      last_updated: new Date().toISOString()
    };

    const result = await updateDocument('leads', id, updateData);
    return result as Lead;
  } catch (error) {
    throw new Error(`Failed to update lead status: ${(error as Error).message}`);
  }
};

export const updateLeadStatusBulk = async (
  ids: string[], 
  statuses: LeadStatus | LeadStatus[]
): Promise<Lead[]> => {
  try {
    const validStatuses: LeadStatus[] = ['New', 'Reviewed', 'Contacted', 'Qualified', 'Converted', 'Lost', 'Spam'];
    
    let statusArray: LeadStatus[];
    
    if (Array.isArray(statuses)) {
      if (statuses.length === 1) {
        // Single status in array - apply to all
        statusArray = new Array(ids.length).fill(statuses[0]);
      } else if (statuses.length === ids.length) {
        // Individual status for each ID
        statusArray = statuses;
      } else {
        throw new Error('Status array must have either 1 element or match the length of IDs array');
      }
      
      // Validate all statuses
      for (const status of statusArray) {
        if (!validStatuses.includes(status)) {
          throw new Error(`Invalid lead status: ${status}`);
        }
      }
    } else {
      // Single status - apply to all
      if (!validStatuses.includes(statuses)) {
        throw new Error(`Invalid lead status: ${statuses}`);
      }
      statusArray = new Array(ids.length).fill(statuses);
    }

    const results: Lead[] = [];
    const currentTimestamp = new Date().toISOString();
    
    // Update each lead with its corresponding status
    for (let i = 0; i < ids.length; i++) {
      const updateData = {
        status: statusArray[i],
        last_updated: currentTimestamp
      };

      const result = await updateDocument('leads', ids[i], updateData);
      results.push(result as Lead);
    }

    return results;
  } catch (error) {
    throw new Error(`Failed to update lead status in bulk: ${(error as Error).message}`);
  }
};

export const deleteLead = async (id: string): Promise<void> => {
  try {
    await deleteDocument('leads', id);
  } catch (error) {
    throw new Error(`Failed to delete lead: ${(error as Error).message}`);
  }
};