import { useState } from 'react';
import { getOfferings, purchasePackage, ensureUserLinkedToRevenueCat } from '../utils/subscriptions';
import { trackEvent } from '../utils/analytics';
import type { PurchasesPackage } from 'react-native-purchases';

interface PurchaseOptions {
  tier: 'premium' | 'premiumPlus';
  billingPeriod: 'monthly' | 'annual';
  source: string; // 'settings', 'study_limit', 'history', etc.
  paywallVariant?: string; // Optional: for A/B testing
  userId?: string; // User ID - required to ensure RevenueCat linking
}

export interface PurchaseError {
  title: string;
  message: string;
  type: 'error' | 'warning';
}

export function usePurchase() {
  const [loading, setLoading] = useState(false);
  const [offerings, setOfferings] = useState<any>(null);
  const [error, setError] = useState<PurchaseError | null>(null);

  const loadOfferings = async () => {
    try {
      const current = await getOfferings();
      setOfferings(current);
      return current;
    } catch (error) {
      console.error('Load offerings error:', error);
      return null;
    }
  };

  const makePurchase = async (options: PurchaseOptions) => {
    const { tier, billingPeriod, source, paywallVariant, userId } = options;

    // Clear any previous errors
    setError(null);

    if (!offerings) {
      setError({
        title: 'Error',
        message: 'Subscription options not loaded yet. Please try again.',
        type: 'error',
      });
      return { success: false, error: 'offerings_not_loaded' };
    }

    // CRITICAL: Ensure user is linked to RevenueCat before purchase
    // Without this, webhook can't find user in database
    if (userId) {
      try {
        await ensureUserLinkedToRevenueCat(userId, 3); // Retry up to 3 times
      } catch (error: any) {
        setError({
          title: 'Setup Required',
          message: error.message || 'Unable to verify your account. Please try again or contact support.',
          type: 'error',
        });
        trackEvent('purchase_blocked_linking_failed', {
          tier,
          billingPeriod,
          source,
          error: error.message,
        });
        return { success: false, error: 'linking_failed' };
      }
    } else {
      setError({
        title: 'Error',
        message: 'User ID not available. Please restart the app and try again.',
        type: 'error',
      });
      trackEvent('purchase_blocked_no_user_id', {
        tier,
        billingPeriod,
        source,
      });
      return { success: false, error: 'no_user_id' };
    }

    setLoading(true);

    // Track purchase attempt
    trackEvent('purchase_initiated', {
      tier,
      billingPeriod,
      source,
      paywall_variant: paywallVariant,
    });

    try {
      // Map to RevenueCat package identifier
      // These should match your package identifiers in RevenueCat
      // Format: premium_monthly, premium_annual, premium_plus_monthly, premium_plus_annual
      const packageId = `${tier === 'premium' ? 'premium' : 'premium_plus'}_${billingPeriod}`;
      
      // Try to find package by identifier
      let packageToPurchase = offerings.availablePackages.find(
        (pkg: PurchasesPackage) => pkg.identifier === packageId
      );
      
      // Fallback: if not found by identifier, try to find by product ID pattern
      if (!packageToPurchase) {
        const productIdPattern = tier === 'premium' 
          ? (billingPeriod === 'monthly' ? 'premium_monthly' : 'premium_annual')
          : (billingPeriod === 'monthly' ? 'premium_plus_monthly' : 'premium_plus_annual');
        
        packageToPurchase = offerings.availablePackages.find(
          (pkg: PurchasesPackage) => 
            pkg.product.identifier.includes(productIdPattern) ||
            pkg.identifier.includes(productIdPattern)
        );
      }

      if (!packageToPurchase) {
        throw new Error(`Package ${packageId} not found`);
      }

      // Make the purchase
      const result = await purchasePackage(packageToPurchase);

      setLoading(false);

      if (result.success && result.customerInfo) {
        trackEvent('purchase_success', {
          tier,
          billingPeriod,
          source,
          paywall_variant: paywallVariant,
          product_id: packageToPurchase.product.identifier,
          price: packageToPurchase.product.price,
        });

        return {
          success: true,
          customerInfo: result.customerInfo,
        };
      } else if (result.error !== 'cancelled') {
        throw new Error(result.error || 'Unknown error');
      } else {
        // User cancelled
        trackEvent('purchase_cancelled', { tier, billingPeriod, source });
        return { success: false, cancelled: true };
      }
    } catch (error: any) {
      setLoading(false);

      trackEvent('purchase_failed', {
        tier,
        billingPeriod,
        source,
        error: error.message,
      });

      setError({
        title: 'Purchase Failed',
        message: error.message || 'An error occurred. Please try again.',
        type: 'error',
      });

      return { success: false, error: error.message };
    }
  };

  return {
    loading,
    offerings,
    loadOfferings,
    makePurchase,
    error, // Expose error for components to show in modal
    clearError: () => setError(null), // Allow clearing error
  };
}

