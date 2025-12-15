/**
 * Password requirements configuration
 * This file can be shared across mobile app, frontend, and backend
 */

export interface PasswordRequirements {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  specialChars: string;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Validates a password against the requirements
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const { minLength, maxLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars, specialChars } = PASSWORD_REQUIREMENTS;

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (password.length > maxLength) {
    errors.push(`Password must be no more than ${maxLength} characters long`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requireSpecialChars) {
    const specialCharsRegex = new RegExp(`[${specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (!specialCharsRegex.test(password)) {
      errors.push(`Password must contain at least one special character (${specialChars})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gets a human-readable description of password requirements
 */
export function getPasswordRequirementsDescription(): string {
  const { minLength, maxLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars, specialChars } = PASSWORD_REQUIREMENTS;
  
  const requirements: string[] = [
    `Between ${minLength} and ${maxLength} characters`,
  ];

  if (requireUppercase) requirements.push('At least one uppercase letter');
  if (requireLowercase) requirements.push('At least one lowercase letter');
  if (requireNumbers) requirements.push('At least one number');
  if (requireSpecialChars) requirements.push(`At least one special character (${specialChars})`);

  return requirements.join(', ');
}

