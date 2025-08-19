// services/lead.service.ts
import { Lead, LeadStats, LeadStatus } from '../types/lead';
import { createDocument, createDocumentsBatch, deleteDocument, getDocument, getLeadsWithDateFilters, getPaginatedDocuments, getPaginatedDocumentsByDateRange, processDateFilters, searchByEmail, searchByNamePrefix, updateDocument } from '../helpers/firebase'; // Assuming you have this utility
import { validateLead } from '../helpers/leadValidation';
import { PaginatedResult, PaginationOptions } from '../types/pagination';
import { PDFGenerator } from '../helpers/pdfGenerator';

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

export const getLeadById = async (id: string): Promise<Lead | null> => {
  try {
    const result = await getDocument<Lead>('leads', id);
    return result as Lead | null;
  } catch (error) {
    throw new Error(`Failed to get lead by ID: ${(error as Error).message}`);
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

export const searchLeads = async (
  searchTerm: string,
  additionalFilters: Record<string, any> = {},
  dateFilters: Record<string, string> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<Lead>> => {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new Error('Search term is required');
    }

    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const cleanSearchTerm = searchTerm.trim().toLowerCase();
    
    // Convert date filters to ISO strings for Firestore
    const processedDateFilters = await processDateFilters(dateFilters);
    
    // For name prefix search (most common use case)
    const nameResults = await searchByNamePrefix(cleanSearchTerm, additionalFilters, processedDateFilters);
    
    // For email search (exact domain or prefix)
    const emailResults = await searchByEmail(cleanSearchTerm, additionalFilters, processedDateFilters);
    
    // Get all leads for phone/notes/source search (fallback for complex searches)
    // Apply date filters here too
    const allLeadsResults = await getLeadsWithDateFilters(additionalFilters, processedDateFilters);
    
    // Client-side filter for phone, notes, source, tags
    const clientFilteredResults = allLeadsResults.filter(lead => 
      lead.phone?.includes(searchTerm) || // Phone exact match
      lead.notes?.toLowerCase().includes(cleanSearchTerm) ||
      lead.source?.toLowerCase().includes(cleanSearchTerm) ||
      lead.tag?.some(tag => tag.toLowerCase().includes(cleanSearchTerm))
    );

    // Combine and deduplicate results
    const combinedResults = new Map<string, Lead>();
    
    // Add name search results
    nameResults.forEach(lead => combinedResults.set(lead.id, lead));
    
    // Add email search results
    emailResults.forEach(lead => combinedResults.set(lead.id, lead));
    
    // Add client-filtered results
    clientFilteredResults.forEach(lead => combinedResults.set(lead.id, lead));
    
    // Convert to array and sort by creation_date (newest first)
    const allResults = Array.from(combinedResults.values()).sort((a, b) => 
      new Date(b.creation_date).getTime() - new Date(a.creation_date).getTime()
    );

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = allResults.slice(startIndex, endIndex);
    
    const hasNextPage = endIndex < allResults.length;
    const hasPreviousPage = page > 1;

    return {
      data: pageData,
      pagination: {
        currentPage: page,
        pageSize,
        hasNextPage,
        hasPreviousPage,
        totalPages: Math.ceil(allResults.length / pageSize),
        totalCount: allResults.length
      }
    };
  } catch (error) {
    throw new Error(`Failed to search leads: ${(error as Error).message}`);
  }
};

export const getLeadStats = async (): Promise<LeadStats> => {
  try {
    // Get all leads to calculate stats
    const allLeads = await getPaginatedDocuments<Lead>(
      'leads',
      {},
      {
        pageSize: 1000, // Get a large batch for stats calculation
        page: 1,
        orderField: 'creation_date',
        orderDirection: 'desc'
      }
    );

    const leads = allLeads.data;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Calculate status breakdown
    const statusBreakdown: Record<LeadStatus, number> = {
      'New': 0,
      'Reviewed': 0,
      'Contacted': 0,
      'Qualified': 0,
      'Converted': 0,
      'Lost': 0,
      'Spam': 0
    };

    // Calculate source breakdown
    const sourceBreakdown: Record<string, number> = {};

    // Calculate time-based stats
    let leadsThisWeek = 0;
    let leadsThisMonth = 0;
    let leadsLastMonth = 0;

    const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0);

    leads.forEach(lead => {
      // Status breakdown
      statusBreakdown[lead.status]++;

      // Source breakdown
      if (lead.source) {
        sourceBreakdown[lead.source] = (sourceBreakdown[lead.source] || 0) + 1;
      }

      // Time-based stats
      const creationDate = new Date(lead.creation_date);
      
      if (creationDate >= oneWeekAgo) {
        leadsThisWeek++;
      }
      
      if (creationDate >= startOfMonth) {
        leadsThisMonth++;
      }
      
      if (creationDate >= startOfLastMonth && creationDate <= endOfLastMonth) {
        leadsLastMonth++;
      }
    });

    // Calculate conversion rate
    const totalLeads = leads.length;
    const convertedLeads = statusBreakdown.Converted;
    const conversionRate = totalLeads > 0 ? Number(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0;

    // Calculate month-over-month growth
    const monthlyGrowthRate = leadsLastMonth > 0 
      ? Number((((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100).toFixed(1))
      : leadsThisMonth > 0 ? 100 : 0;

    // Top sources (limit to top 5)
    const topSources = Object.entries(sourceBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {} as Record<string, number>);

    return {
      totalLeads,
      statusBreakdown,
      conversionRate,
      recentActivity: {
        leadsThisWeek,
        leadsThisMonth,
        leadsLastMonth,
        monthlyGrowthRate
      },
      sourceBreakdown: topSources,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to get lead stats: ${(error as Error).message}`);
  }
};

export const createLeadPDFById = async (id: string): Promise<Buffer> => {
  try {
    const lead = await getLeadById(id);
    
    if (!lead) {
      throw new Error('Lead not found');
    }

    const pdfBuffer = await PDFGenerator.createSingleLeadPDF(lead);
    return pdfBuffer;
  } catch (error) {
    throw new Error(`Failed to create lead PDF: ${(error as Error).message}`);
  }
};

export const createLeadPDFAll = async (): Promise<Buffer> => {
  try {
    // Get all leads (using a large page size to get everything)
    const allLeadsResult = await getPaginatedDocuments<Lead>(
      'leads',
      {},
      {
        pageSize: 1000, // Adjust based on your expected lead volume
        page: 1,
        orderField: 'creation_date',
        orderDirection: 'desc'
      }
    );

    const leads = allLeadsResult.data;
    
    if (leads.length === 0) {
      throw new Error('No leads found to export');
    }

    const pdfBuffer = await PDFGenerator.createLeadsPDF(leads);
    return pdfBuffer;
  } catch (error) {
    throw new Error(`Failed to create all leads PDF: ${(error as Error).message}`);
  }
};

export const createLeadPDFByDateRange = async (
  startDate: string, 
  endDate: string
): Promise<Buffer> => {
  try {
    // Get leads within the date range
    const leadsResult = await getLeadsByDateRange(
      { startDate, endDate },
      {}, // No additional filters
      { pageSize: 1000, page: 1 } // Get all leads in range
    );

    const leads = leadsResult.data;
    
    if (leads.length === 0) {
      throw new Error(`No leads found between ${startDate} and ${endDate}`);
    }

    // Create PDF with date range in header
    const pdfBuffer = await PDFGenerator.createLeadsDateRangePDF(leads, startDate, endDate);
    return pdfBuffer;
  } catch (error) {
    throw new Error(`Failed to create date range PDF: ${(error as Error).message}`);
  }
};

export const createLeadPDFByDate= async (
  date: string
): Promise<Buffer> => {
  try {
    // Get leads within the date range
    const leadsResult = await getLeadsByDate(
      date,
      {}, // No additional filters
      { pageSize: 1000, page: 1 } // Get all leads in range
    );

    const leads = leadsResult.data;
    
    if (leads.length === 0) {
      throw new Error(`No leads found on ${date}`);
    }

    // Create PDF with date range in header
    const pdfBuffer = await PDFGenerator.createLeadsDatePDF(leads, date);
    return pdfBuffer;
  } catch (error) {
    throw new Error(`Failed to create date range PDF: ${(error as Error).message}`);
  }
};