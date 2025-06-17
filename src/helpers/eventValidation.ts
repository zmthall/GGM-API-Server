import { Event } from '../types/event';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validateEvent = (data: Partial<Event>): ValidationResult => {
  const errors: ValidationError[] = [];

  // Required fields
    if (!data.title?.trim()) {
    errors.push({ field: 'title', message: 'Title is required' });
  }

  if (!data.date?.trim()) {
    errors.push({ field: 'date', message: 'Date is required' });
  } else {
    // Validate date format (MM/DD/YYYY)
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    if (!dateRegex.test(data.date)) {
      errors.push({ field: 'date', message: 'Date must be in MM/DD/YYYY format' });
    } else {
      // Additional check to ensure it's a valid date
      const [month, day, year] = data.date.split('/').map(Number);
      const dateObj = new Date(year, month - 1, day);
      if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
        errors.push({ field: 'date', message: 'Date must be a valid date' });
      }
    }
  }

  if (!data.location?.trim()) {
    errors.push({ field: 'location', message: 'Location is required' });
  }

  if (!data.address?.trim()) {
    errors.push({ field: 'address', message: 'Address is required' });
  }

  if (!data.description?.trim()) {
    errors.push({ field: 'description', message: 'Description is required' });
  }

  if (!data.link?.trim()) {
    errors.push({ field: 'link', message: 'Link is required' });
  } else {
    // Basic URL validation
    try {
      new URL(data.link);
    } catch {
      errors.push({ field: 'link', message: 'Link must be a valid URL' });
    }
  }

  // Optional dateTo validation
    if (data.dateTo) {
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    if (!dateRegex.test(data.dateTo)) {
      errors.push({ field: 'dateTo', message: 'End date must be in MM/DD/YYYY format' });
    } else {
      // Check if dateTo is after date
      if (data.date && data.dateTo) {
        const [startMonth, startDay, startYear] = data.date.split('/').map(Number);
        const [endMonth, endDay, endYear] = data.dateTo.split('/').map(Number);
        const startDate = new Date(startYear, startMonth - 1, startDay);
        const endDate = new Date(endYear, endMonth - 1, endDay);
        
        if (endDate < startDate) {
          errors.push({ field: 'dateTo', message: 'End date must be after start date' });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};