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

// Cache for the full response (both requirements and description)
interface CachedPasswordData {
  requirements: PasswordRequirements;
  description: string[];
}

let cachedPasswordData: CachedPasswordData | null = null;

/**
 * Fetches password requirements and description from backend (single fetch, cached)
 */
async function fetchPasswordData(): Promise<CachedPasswordData> {
  if (cachedPasswordData !== null) {
    return cachedPasswordData;
  }

  try {
    const baseUrl = getApiUrl().replace('/api', '');
    const response = await fetch(`${baseUrl}/api/user/password-requirements`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch password requirements');
    }
    
    const data = await response.json();
    
    // Extract description into array
    const descriptionArray: string[] = [];
    if (data.description.minLength) descriptionArray.push(data.description.minLength);
    if (data.description.uppercase) descriptionArray.push(data.description.uppercase);
    if (data.description.lowercase) descriptionArray.push(data.description.lowercase);
    if (data.description.numbers) descriptionArray.push(data.description.numbers);
    if (data.description.specialChars) descriptionArray.push(data.description.specialChars);
    
    cachedPasswordData = {
      requirements: data.requirements,
      description: descriptionArray,
    };
    
    return cachedPasswordData;
  } catch (error) {
    console.error('Error fetching password requirements, using defaults:', error);
    // Fallback to defaults if API fails
    const fallback: CachedPasswordData = {
      requirements: {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      },
      description: [
        'At least 8 characters',
        'One uppercase letter',
        'One lowercase letter',
        'One number',
      ],
    };
    cachedPasswordData = fallback;
    return fallback;
  }
}

/**
 * Gets password requirements from backend (cached)
 */
export async function getPasswordRequirements(): Promise<PasswordRequirements> {
  const data = await fetchPasswordData();
  return data.requirements;
}

/**
 * Gets password requirements description from backend (cached)
 */
export async function getPasswordRequirementsDescription(): Promise<string[]> {
  const data = await fetchPasswordData();
  return data.description;
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

