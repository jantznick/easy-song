/**
 * Password validation utility
 * Fetches password requirements from backend API to stay in sync
 */

// Get API URL helper
const getApiUrl = () => {
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
};

export interface PasswordRequirements {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  specialChars: string;
}

let cachedRequirements: PasswordRequirements | null = null;

/**
 * Fetches password requirements from backend
 */
export async function getPasswordRequirements(): Promise<PasswordRequirements> {
  if (cachedRequirements !== null) {
    return cachedRequirements;
  }

  try {
    const baseUrl = getApiUrl().replace('/api', '');
    const response = await fetch(`${baseUrl}/api/user/password-requirements`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch password requirements');
    }
    
    const data = await response.json();
    const requirements: PasswordRequirements = data.requirements;
    cachedRequirements = requirements;
    return requirements;
  } catch (error) {
    console.error('Error fetching password requirements, using defaults:', error);
    // Fallback to defaults if API fails
    const fallback: PasswordRequirements = {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    };
    return fallback;
  }
}

/**
 * Gets password requirements description from backend
 */
export async function getPasswordRequirementsDescription(): Promise<string[]> {
  try {
    const baseUrl = getApiUrl().replace('/api', '');
    const response = await fetch(`${baseUrl}/api/user/password-requirements`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch password requirements');
    }
    
    const data = await response.json();
    const requirements: string[] = [];
    
    if (data.description.minLength) requirements.push(data.description.minLength);
    if (data.description.uppercase) requirements.push(data.description.uppercase);
    if (data.description.lowercase) requirements.push(data.description.lowercase);
    if (data.description.numbers) requirements.push(data.description.numbers);
    if (data.description.specialChars) requirements.push(data.description.specialChars);
    
    return requirements;
  } catch (error) {
    console.error('Error fetching password requirements description:', error);
    // Fallback
    return [
      'At least 8 characters',
      'One uppercase letter',
      'One lowercase letter',
      'One number',
    ];
  }
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  checks: {
    minLength: boolean;
    maxLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    specialChars: boolean;
  };
}

/**
 * Validates a password against the requirements
 * Note: This should be called with requirements from getPasswordRequirements()
 */
export function validatePassword(password: string, requirements: PasswordRequirements): PasswordValidationResult {
  const errors: string[] = [];
  const { minLength, maxLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars, specialChars } = requirements;

  const checks = {
    minLength: password.length >= minLength,
    maxLength: password.length <= maxLength,
    uppercase: !requireUppercase || /[A-Z]/.test(password),
    lowercase: !requireLowercase || /[a-z]/.test(password),
    numbers: !requireNumbers || /[0-9]/.test(password),
    specialChars: !requireSpecialChars || new RegExp(`[${specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password),
  };

  if (!checks.minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (!checks.maxLength) {
    errors.push(`Password must be no more than ${maxLength} characters long`);
  }

  if (!checks.uppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!checks.lowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!checks.numbers) {
    errors.push('Password must contain at least one number');
  }

  if (!checks.specialChars) {
    errors.push(`Password must contain at least one special character (${specialChars})`);
  }

  return {
    valid: errors.length === 0,
    errors,
    checks,
  };
}

