// /services/contactForm.services.ts
import { Zippper } from "../helpers/fileZip";
import { deleteDocument, getDocument, getPaginatedDocuments, getPaginatedDocumentsByDateRange, updateDocument } from "../helpers/firebase";
import { ContactFormPDFGenerator } from "../helpers/pdfGenerator/contactFormPDFGenerator";
import { ContactFormDocument } from "../types/contactForm";
import { PaginatedResult, PaginationOptions } from "../types/pagination";
import { PDFFile } from "../types/PDF";

export const getAllContactForms = async (
  filters: Record<string, any> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<ContactFormDocument>> => {
  try {
    const page = options.page || 1;
    const pageSize = options.pageSize || 5;
    
    const result = await getPaginatedDocuments<ContactFormDocument>(
      'contact_messages',
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
    throw new Error(`Failed to get contact forms: ${(error as Error).message}`);
  }
};

export const getContactFormById = async (id: string): Promise<ContactFormDocument | null> => {
  try {
    const result = await getDocument('contact_messages', id);
    return result as ContactFormDocument | null;
  } catch (error) {
    throw new Error(`Failed to get contact form: ${(error as Error).message}`);
  }
};

export const getContactFormsByDate = async (
  date: string,
  filters: Record<string, any> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<ContactFormDocument>> => {
  try {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    
    // Parse the date as UTC to avoid timezone issues
    const [month, day, year] = date.split('-');
    const startDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999));
    
    const result = await getPaginatedDocumentsByDateRange<ContactFormDocument>(
      'contact_messages',
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
    throw new Error(`Failed to get contact forms by date: ${(error as Error).message}`);
  }
};

export const getContactFormsByDateRange = async (
  dateRange: Record<string, any> = {},
  filters: Record<string, any> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<ContactFormDocument>> => {
  try {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    
    const [startMonth, startDay, startYear] = dateRange.startDate.split('-');
    const startDate = new Date(Date.UTC(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay), 0, 0, 0, 0));

    const [endMonth, endDay, endYear] = dateRange.endDate.split('-');
    const endDate = new Date(Date.UTC(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay), 23, 59, 59, 999));
    
    const result = await getPaginatedDocumentsByDateRange<ContactFormDocument>(
      'contact_messages',
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
    console.error('Service error:', error);
    throw new Error(`Failed to get contact forms by date: ${(error as Error).message}`);
  }
};

export const getContactFormsByStatus = async (
  statusFilter: Record<string, any> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<ContactFormDocument>> => {
  try {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    
    const result = await getPaginatedDocuments<ContactFormDocument>(
      'contact_messages',
      statusFilter,
      {
        pageSize,
        page,
        orderField: 'created_at',
        orderDirection: 'desc',
        ...options
      }
    );

    return result;
  } catch (error) {
    throw new Error(`Failed to get contact forms by status: ${(error as Error).message}`);
  }
};

export const updateContactFormStatus = async (
  id: string, 
  status: 'new' | 'completed' | 'reviewing' | 'declined'
): Promise<{ id: string; status: string; updated_at: string }> => {
  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    const result = await updateDocument('contact_messages', id, updateData);
    return result;
  } catch (error) {
    throw new Error(`Failed to update contact form status: ${(error as Error).message}`);
  }
};

export const addTagsToContactForm = async (
  id: string, 
  newTags: string[]
): Promise<{ id: string; tags: string[]; updated_at: string }> => {
  try {
    // First get the existing contact form to get current tags
    const existingContactForm = await getDocument('contact_messages', id);
    
    if (!existingContactForm) {
      throw new Error('Contact form not found');
    }

    // Get existing tags or default to empty array
    const existingTags = existingContactForm.tags || [];
    
    // Combine existing tags with new tags and remove duplicates
    const updatedTags = [...new Set([...existingTags, ...newTags])];
    
    const updateData = {
      tags: updatedTags,
      updated_at: new Date().toISOString()
    };

    const result = await updateDocument('contact_messages', id, updateData);
    return result;
  } catch (error) {
    throw new Error(`Failed to add tags to contact form: ${(error as Error).message}`);
  }
};

export const deleteContactForm = async (id: string): Promise<void> => {
  try {
    await deleteDocument('contact_messages', id);
  } catch (error) {
    throw new Error(`Failed to delete contact form: ${(error as Error).message}`);
  }
};

export const createContactFormPDFById = async (id: string): Promise<Buffer> => {
  try {
    const contactForm = await getContactFormById(id);

    if (!contactForm) {
      throw new Error('Contact form not found');
    }

    const pdfBuffer = await ContactFormPDFGenerator.createSinglePDF(contactForm);
    return pdfBuffer;
  } catch (error) {
    throw new Error(`Failed to create contact form PDF: ${(error as Error).message}`);
  }
};

export const createContactFormPDFBulk = async (ids: string[]): Promise<Buffer> => {
  try {
    const pdfFiles: PDFFile[] = [];
    
    // Generate PDF for each contact form
    for (const id of ids) {
      const contactForm = await getContactFormById(id);
      
      if (!contactForm) {
        console.warn(`Contact form with ID ${id} not found, skipping...`);
        continue;
      }
      
      const pdfBuffer = await ContactFormPDFGenerator.createSinglePDF(contactForm);
      const filename = `contact-form-${contactForm.first_name}-${contactForm.last_name}-${id.substring(0, 8)}.pdf`;
      
      pdfFiles.push({
        buffer: pdfBuffer,
        filename: filename
      });
    }
    
    if (pdfFiles.length === 0) {
      throw new Error('No valid contact forms found for the provided IDs');
    }
    
    const zipBuffer = await Zippper.createPDFZip(pdfFiles);
    return zipBuffer;
  } catch (error) {
    throw new Error(`Failed to create bulk contact form PDFs: ${(error as Error).message}`);
  }
};