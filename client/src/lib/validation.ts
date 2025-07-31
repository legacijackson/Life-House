/**
 * Real-time validation utilities for form inputs
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// Email validation
export function validateEmail(email: string): ValidationResult {
  if (!email) return { isValid: false, message: 'Email is required' };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }

  return { isValid: true, message: 'Valid email address' };
}

// Phone validation
export function validatePhone(phone: string): ValidationResult {
  if (!phone) return { isValid: false, message: 'Phone number is required' };

  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  if (digits.length !== 10) {
    return { isValid: false, message: 'Please enter a 10-digit phone number' };
  }

  return { isValid: true, message: 'Valid phone number' };
}

// Name validation
export function validateName(name: string): ValidationResult {
  if (!name) return { isValid: false, message: 'Name is required' };

  if (name.length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters' };
  }

  if (name.length > 50) {
    return { isValid: false, message: 'Name must be less than 50 characters' };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name)) {
    return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true, message: 'Valid name' };
}

// Date validation
export function validateDate(date: string, options?: { 
  minAge?: number; 
  maxAge?: number; 
  futureAllowed?: boolean;
  label?: string;
}): ValidationResult {
  if (!date) return { isValid: false, message: `${options?.label || 'Date'} is required` };

  const dateObj = new Date(date);
  const today = new Date();

  if (isNaN(dateObj.getTime())) {
    return { isValid: false, message: 'Please enter a valid date' };
  }

  // Check if future dates are allowed
  if (!options?.futureAllowed && dateObj > today) {
    return { isValid: false, message: 'Date cannot be in the future' };
  }

  // Check age constraints
  if (options?.minAge || options?.maxAge) {
    const age = Math.floor((today.getTime() - dateObj.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    if (options.minAge && age < options.minAge) {
      return { isValid: false, message: `Must be at least ${options.minAge} years old` };
    }

    if (options.maxAge && age > options.maxAge) {
      return { isValid: false, message: `Must be less than ${options.maxAge} years old` };
    }
  }

  return { isValid: true, message: 'Valid date' };
}

// Password validation
export function validatePassword(password: string): ValidationResult {
  if (!password) return { isValid: false, message: 'Password is required' };

  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters' };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const missing = [];
  if (!hasUpperCase) missing.push('uppercase letter');
  if (!hasLowerCase) missing.push('lowercase letter');
  if (!hasNumbers) missing.push('number');
  if (!hasSpecialChar) missing.push('special character');

  if (missing.length > 0) {
    return { 
      isValid: false, 
      message: `Password needs: ${missing.join(', ')}` 
    };
  }

  return { isValid: true, message: 'Strong password' };
}

// Required field validation
export function validateRequired(value: string | boolean | number, fieldName: string): ValidationResult {
  if (value === null || value === undefined || value === '' || value === false) {
    return { isValid: false, message: `${fieldName} is required` };
  }

  return { isValid: true };
}

// Text length validation
export function validateLength(
  text: string, 
  min: number, 
  max: number, 
  fieldName: string
): ValidationResult {
  if (!text) return { isValid: false, message: `${fieldName} is required` };

  if (text.length < min) {
    return { 
      isValid: false, 
      message: `${fieldName} must be at least ${min} characters` 
    };
  }

  if (text.length > max) {
    return { 
      isValid: false, 
      message: `${fieldName} must be less than ${max} characters` 
    };
  }

  return { isValid: true, message: `Valid ${fieldName.toLowerCase()}` };
}

// Custom validation wrapper
export function createValidator(
  validationFn: (value: any) => boolean,
  errorMessage: string,
  successMessage?: string
) {
  return (value: any): ValidationResult => {
    const isValid = validationFn(value);
    return {
      isValid,
      message: isValid ? successMessage : errorMessage
    };
  };
}

// Form field validators for specific use cases
export const validators = {
  email: validateEmail,
  phone: validatePhone,
  name: validateName,
  date: validateDate,
  password: validatePassword,
  required: validateRequired,
  length: validateLength,

  // Specific validators for our forms
  emergencyContact: (name: string) => validateName(name),
  organizationName: (name: string) => validateLength(name, 2, 100, 'Organization name'),
  clientName: (name: string) => validateName(name),

  dateOfBirth: (date: string) => validateDate(date, { 
    minAge: 18, 
    maxAge: 100, 
    label: 'Date of birth' 
  }),

  releaseDate: (date: string) => validateDate(date, { 
    futureAllowed: true, 
    label: 'Release date' 
  }),

  donationAmount: (amount: string): ValidationResult => {
    if (!amount) return { isValid: false, message: 'Amount is required' };

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { isValid: false, message: 'Please enter a valid amount' };
    }

    if (numAmount < 1) {
      return { isValid: false, message: 'Minimum donation is $1' };
    }

    if (numAmount > 50000) {
      return { isValid: false, message: 'Maximum donation is $50,000' };
    }

    return { isValid: true, message: `Donation amount: $${numAmount.toFixed(2)}` };
  },

  urgencyLevel: (urgency: string): ValidationResult => {
    const validUrgencies = ['immediate', 'urgent', 'standard', 'planning'];
    if (!validUrgencies.includes(urgency)) {
      return { isValid: false, message: 'Please select an urgency level' };
    }
    return { isValid: true };
  },

  justiceStatus: (status: string): ValidationResult => {
    const validStatuses = ['parole', 'probation', 'stop', 'ecm', 'formerly_incarcerated', 'other'];
    if (!validStatuses.includes(status)) {
      return { isValid: false, message: 'Please select a justice system status' };
    }
    return { isValid: true };
  }
};
export const resourceFormSchema = z.object({
  name: z.string().min(1, "Resource name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  url: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  state: z.string().default("CA"),
  zip: z.string().optional(),
  hours: z.string().optional(),
  eligibility: z.string().optional(),
  tags: z.string().optional(),
  languages: z.string().optional(),
});
export type ResourceFormData = z.infer<typeof resourceFormSchema>;