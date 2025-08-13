import { Lead, LeadStatus } from '../types/lead';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validateLead = (data: Partial<Lead>): ValidationResult => {
  const errors: ValidationError[] = [];

  // Required fields
  if (!data.name?.trim()) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  // At least one contact method required
  if (!data.email?.trim() && !data.phone?.trim()) {
    errors.push({ field: 'contact', message: 'Either email or phone number is required' });
  }

  // Email validation if provided
  if (data.email?.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push({ field: 'email', message: 'Email must be in valid format' });
    }
  }

  // Phone validation if provided
  if (data.phone?.trim()) {
    // Basic phone validation - adjust regex based on your requirements
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(data.phone.trim())) {
      errors.push({ field: 'phone', message: 'Phone number must be valid' });
    }
  }

  // Status validation if provided
  if (data.status) {
    const validStatuses: LeadStatus[] = ['New', 'Reviewed', 'Contacted', 'Qualified', 'Converted', 'Lost', 'Spam'];
    if (!validStatuses.includes(data.status as LeadStatus)) {
      errors.push({ field: 'status', message: 'Status must be a valid lead status' });
    }
  }

  // Contact date validation if provided
  if (data.creation_date) {
    const dateObj = new Date(data.creation_date);
    if (isNaN(dateObj.getTime())) {
      errors.push({ field: 'contact_date', message: 'Contact date must be a valid date' });
    }
  }

  // Tag validation if provided
  if (data.tag && Array.isArray(data.tag)) {
    data.tag.forEach((tag, index) => {
      if (typeof tag !== 'string' || !tag.trim()) {
        errors.push({ field: `tag[${index}]`, message: 'Tags must be non-empty strings' });
      }
    });
  } else if (data.tag && !Array.isArray(data.tag)) {
    errors.push({ field: 'tag', message: 'Tags must be an array' });
  }

  // Notes length validation if provided
  if (data.notes && data.notes.trim().length > 1000) {
    errors.push({ field: 'notes', message: 'Notes must be less than 1000 characters' });
  }

  // Source validation if provided
  if (data.source && data.source.trim().length > 100) {
    errors.push({ field: 'source', message: 'Source must be less than 100 characters' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};