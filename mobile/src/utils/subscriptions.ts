import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys (get from RevenueCat dashboard)
// Add these to your .env file:
// EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxx
// EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxx
const API_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '',
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',
};

/**
 * Initialize RevenueCat
 * Call this once on app startup
 */
export const initializeSubscriptions = async (userId?: string) => {
  try {
    // Configure SDK
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    } else {
      Purchases.setLogLevel(LOG_LEVEL.INFO);
    }

    const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;

    if (!apiKey) {
      console.warn(
        `RevenueCat API key not found for ${Platform.OS}. Subscriptions will not work.`
      );
      return;
    }

    await Purchases.configure({
      apiKey,
      appUserID: userId, // Optional: your user ID
    });

    console.log('RevenueCat initialized');
  } catch (error) {
    console.error('RevenueCat initialization error:', error);
  }
};

/**
 * Link RevenueCat customer to your user ID
 * Call this after user logs in
 */
export const linkUserToRevenueCat = async (userId: string) => {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    console.log('RevenueCat user linked:', userId);
    return customerInfo;
  } catch (error) {
    console.error('Error linking user to RevenueCat:', error);
    throw error;
  }
};

/**
 * Get current subscription status from RevenueCat
 */
export const getSubscriptionStatus = async (): Promise<{
  isPremium: boolean;
  isPremiumPlus: boolean;
  expirationDate?: Date;
  willRenew: boolean;
  tier: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS';
}> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();

    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
    const isPremiumPlus =
      customerInfo.entitlements.active['premium_plus'] !== undefined;

    const premiumEntitlement =
      customerInfo.entitlements.active['premium'] ||
      customerInfo.entitlements.active['premium_plus'];

    const expirationDate = premiumEntitlement?.expirationDate
      ? new Date(premiumEntitlement.expirationDate)
      : undefined;

    const willRenew = premiumEntitlement?.willRenew ?? false;

    // Determine tier
    let tier: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS' = 'FREE';
    if (isPremiumPlus) {
      tier = 'PREMIUM_PLUS';
    } else if (isPremium) {
      tier = 'PREMIUM';
    }

    return {
      isPremium: isPremium || isPremiumPlus,
      isPremiumPlus,
      expirationDate,
      willRenew,
      tier,
    };
  } catch (error) {
    console.error('Get subscription status error:', error);
    return {
      isPremium: false,
      isPremiumPlus: false,
      willRenew: false,
      tier: 'FREE',
    };
  }
};

/**
 * Get available subscription offerings
 */
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Get offerings error:', error);
    return null;
  }
};

/**
 * Purchase a subscription package
 */
export const purchasePackage = async (
  pkg: PurchasesPackage
): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, customerInfo };
  } catch (error: any) {
    // Handle user cancellation gracefully
    if (error.userCancelled) {
      return { success: false, error: 'cancelled' };
    }

    console.error('Purchase error:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

/**
 * Restore purchases (for users who reinstall app)
 */
export const restorePurchases = async (): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
}> => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { success: true, customerInfo };
  } catch (error) {
    console.error('Restore purchases error:', error);
    return { success: false };
  }
};

/**
 * Set up listener for subscription changes
 * Returns unsubscribe function
 */
export const setupSubscriptionListener = (
  onUpdate: (customerInfo: CustomerInfo) => void
): (() => void) => {
  return Purchases.addCustomerInfoUpdateListener(onUpdate);
};

