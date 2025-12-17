import express from 'express';
import { prisma } from '../lib/prisma';
import { SubscriptionTier } from '@prisma/client';

const router = express.Router();

/**
 * RevenueCat Webhook Handler
 * Receives subscription events in real-time from RevenueCat
 * 
 * Webhook events:
 * - INITIAL_PURCHASE: User subscribes for first time
 * - RENEWAL: Subscription renews
 * - CANCELLATION: User cancels subscription
 * - EXPIRATION: Subscription expires
 * - BILLING_ISSUE: Payment fails
 * - PRODUCT_CHANGE: User upgrades/downgrades
 */
router.post('/revenuecat', express.json(), async (req, res) => {
  try {
    const event = req.body;

    console.log('[Webhook] RevenueCat event received:', event.type);

    const {
      type,
      app_user_id, // This is your user.id (set when calling Purchases.logIn())
      product_id,
      purchased_at_ms,
      expiration_at_ms,
      period_type, // 'NORMAL', 'TRIAL', 'INTRO'
    } = event;

    // Verify app_user_id exists
    if (!app_user_id) {
      console.error('[Webhook] Missing app_user_id');
      return res.status(400).json({ error: 'Missing app_user_id' });
    }

    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: app_user_id },
    });

    if (!user) {
      console.error('[Webhook] User not found:', app_user_id);
      return res.status(404).json({ error: 'User not found' });
    }

    // Handle different event types
    switch (type) {
      case 'INITIAL_PURCHASE':
        await handleInitialPurchase(user.id, event);
        break;

      case 'RENEWAL':
        await handleRenewal(user.id, event);
        break;

      case 'CANCELLATION':
        await handleCancellation(user.id, event);
        break;

      case 'EXPIRATION':
        await handleExpiration(user.id, event);
        break;

      case 'BILLING_ISSUE':
        await handleBillingIssue(user.id, event);
        break;

      case 'PRODUCT_CHANGE':
        await handleProductChange(user.id, event);
        break;

      default:
        console.log('[Webhook] Unhandled event type:', type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Handle initial purchase
 */
async function handleInitialPurchase(userId: string, event: any) {
  const { product_id, expiration_at_ms } = event;

  // Determine tier based on product_id
  const tier = getTierFromProductId(product_id);

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: tier,
    },
  });

  console.log(`[Webhook] User ${userId} purchased ${product_id} -> ${tier}`);
}

/**
 * Handle subscription renewal
 */
async function handleRenewal(userId: string, event: any) {
  const { product_id, expiration_at_ms } = event;

  // Determine tier based on product_id
  const tier = getTierFromProductId(product_id);

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: tier,
    },
  });

  console.log(`[Webhook] User ${userId} subscription renewed -> ${tier}`);
}

/**
 * Handle subscription cancellation
 * Note: User still has access until expiration
 */
async function handleCancellation(userId: string, event: any) {
  // Don't change tier immediately - user still has access until expiration
  // The EXPIRATION event will handle removing access
  console.log(`[Webhook] User ${userId} cancelled subscription (access until expiration)`);
}

/**
 * Handle subscription expiration
 * User loses access - downgrade to FREE
 */
async function handleExpiration(userId: string, event: any) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: SubscriptionTier.FREE,
    },
  });

  console.log(`[Webhook] User ${userId} subscription expired -> FREE`);
}

/**
 * Handle billing issue
 * Payment failed - user may lose access soon
 */
async function handleBillingIssue(userId: string, event: any) {
  // Optionally notify user or handle grace period
  // For now, just log it
  console.log(`[Webhook] User ${userId} has billing issue`);
  
  // TODO: Send email notification to user
  // TODO: Implement grace period logic if needed
}

/**
 * Handle product change (upgrade/downgrade)
 */
async function handleProductChange(userId: string, event: any) {
  const { new_product_id } = event;

  // Determine tier based on new product
  const tier = getTierFromProductId(new_product_id);

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: tier,
    },
  });

  console.log(`[Webhook] User ${userId} changed product to ${new_product_id} -> ${tier}`);
}

/**
 * Helper: Map product_id to SubscriptionTier
 */
function getTierFromProductId(productId: string): SubscriptionTier {
  // Product IDs from RevenueCat match your App Store products
  // Format: com.songlang.premiumplus.annual, com.songlang.premium.monthly, etc.
  
  if (productId.includes('premiumplus') || productId.includes('premium_plus')) {
    return SubscriptionTier.PREMIUM_PLUS;
  } else if (productId.includes('premium')) {
    return SubscriptionTier.PREMIUM;
  } else {
    // Default to FREE if unknown
    return SubscriptionTier.FREE;
  }
}

export default router;

