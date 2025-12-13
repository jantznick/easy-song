import { prisma } from '../lib/prisma';
import { sendMagicCodeEmail } from '../lib/email';
import { MagicCodeType } from '@prisma/client';

/**
 * Generates a random 6-digit code
 */
export function generateMagicCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Creates a magic code and sends it via email
 */
export async function createAndSendMagicCode(
  email: string,
  type: MagicCodeType,
  userId?: string
): Promise<string> {
  // Clean up expired codes
  await prisma.magicCode.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  // Generate code
  const code = generateMagicCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Create magic code record
  await prisma.magicCode.create({
    data: {
      email,
      code,
      type,
      expiresAt,
      userId: userId || null,
    },
  });

  // Send email
  await sendMagicCodeEmail({
    email,
    code,
    type: type === 'LOGIN' ? 'login' : 'email_verification',
  });

  return code;
}

/**
 * Verifies a magic code
 */
export async function verifyMagicCode(
  email: string,
  code: string,
  type: MagicCodeType
): Promise<{ valid: boolean; userId?: string }> {
  const magicCode = await prisma.magicCode.findFirst({
    where: {
      email,
      code,
      type,
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!magicCode) {
    return { valid: false };
  }

  // Mark as used
  await prisma.magicCode.update({
    where: { id: magicCode.id },
    data: { used: true },
  });

  return {
    valid: true,
    userId: magicCode.userId || undefined,
  };
}

