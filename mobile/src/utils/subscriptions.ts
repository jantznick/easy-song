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

// Track initialization state
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize RevenueCat
 * Call this once on app startup
 * Returns a promise that resolves when initialization is complete
 */
export const initializeSubscriptions = async (userId?: string): Promise<void> => {
  // If already initialized, return immediately
  if (isInitialized) {
    return;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = (async () => {
    try {
      // Configure SDK
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      } else {
        Purchases.setLogLevel(LOG_LEVEL.INFO);
      }

      const apiKey = Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android;

      if (!apiKey) {
        console.error(
          `RevenueCat API key not found for ${Platform.OS}. Subscriptions will not work.`
        );
        // Don't mark as initialized if no key - this will cause errors but at least we know
        throw new Error(`RevenueCat API key not found for ${Platform.OS}`);
      }

      await Purchases.configure({
        apiKey,
        appUserID: userId, // Optional: your user ID
      });

      isInitialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('RevenueCat initialization error:', error);
      isInitialized = true; // Mark as initialized to prevent infinite retries
      throw error;
    }
  })();

  return initializationPromise;
};

/**
 * Ensure RevenueCat is initialized before making API calls
 */
const ensureInitialized = async (): Promise<void> => {
  if (isInitialized) {
    return; // Already initialized
  }

  if (initializationPromise) {
    // Wait for ongoing initialization
    await initializationPromise;
    return;
  }

  // If not initialized and no promise, initialize now
  console.log('RevenueCat not initialized, initializing now...');
  await initializeSubscriptions();
};

/**
 * Check if user is currently linked to RevenueCat
 * Returns true if the current app user ID matches the provided user ID
 */
export const isUserLinkedToRevenueCat = async (userId: string): Promise<boolean> => {
  try {
    await ensureInitialized();
    const customerInfo = await Purchases.getCustomerInfo();
    // Check if the current app user ID matches our user ID
    return customerInfo.originalAppUserId === userId;
  } catch (error) {
    console.error('Error checking RevenueCat link:', error);
    return false;
  }
};

/**
 * Ensure user is linked to RevenueCat (with retry)
 * Tries to link if not already linked
 * Throws error if linking fails after retries
 */
export const ensureUserLinkedToRevenueCat = async (
  userId: string,
  retries: number = 2
): Promise<void> => {
  // Check if already linked
  const isLinked = await isUserLinkedToRevenueCat(userId);
  if (isLinked) {
    console.log('User already linked to RevenueCat');
    return;
  }

  // Try to link with retries
  let lastError: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await linkUserToRevenueCat(userId);
      console.log('User successfully linked to RevenueCat');
      return;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        console.log(`Link attempt ${attempt + 1} failed, retrying...`);
        // Wait 1 second before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // All retries failed
  throw new Error(
    `Failed to link user to RevenueCat after ${retries + 1} attempts. ` +
    `This is required for purchases to sync to your account. Please try again or contact support.`
  );
};

/**
 * Link RevenueCat customer to your user ID
 * Call this after user logs in
 */
export const linkUserToRevenueCat = async (userId: string) => {
  try {
    await ensureInitialized();
    const { customerInfo } = await Purchases.logIn(userId);
    console.log('RevenueCat user linked:', userId);
    return customerInfo;
  } catch (error) {
    console.error('Error linking user to RevenueCat:', error);
    throw error;
  }
};

/**
 * Get available subscription offerings
 */
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    console.log('getOfferings called, ensuring initialized...');
    await ensureInitialized();
    console.log('RevenueCat initialized, fetching offerings...');
    const offerings = await Purchases.getOfferings();
    console.log('Offerings fetched:', offerings.current ? 'found' : 'null');
    return offerings.current;
  } catch (error) {
    console.error('Get offerings error:', error);
    throw error; // Re-throw so caller can handle it
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
    await ensureInitialized();
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
    await ensureInitialized();
    const customerInfo = await Purchases.restorePurchases();
    return { success: true, customerInfo };
  } catch (error) {
    console.error('Restore purchases error:', error);
    return { success: false };
  }
};

/**
 * Set up listener for subscription changes
 * Note: RevenueCat's addCustomerInfoUpdateListener doesn't return an unsubscribe function
 * The listener is automatically cleaned up when the component unmounts
 */
export const setupSubscriptionListener = async (
  onUpdate: (customerInfo: CustomerInfo) => void
): Promise<() => void> => {
  await ensureInitialized();
  Purchases.addCustomerInfoUpdateListener(onUpdate);
  // Return a no-op function for cleanup (RevenueCat handles cleanup automatically)
  return () => {};
};

