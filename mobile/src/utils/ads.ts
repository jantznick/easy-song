/**
 * Google AdMob utilities and configuration
 */

import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

/**
 * Check if ads should be shown
 * Set SHOWADS=false in .env to disable ads during testing
 */
export const shouldShowAds = (): boolean => {
  const showAds = process.env.SHOWADS;
  // Default to true if not set, but allow explicit false to disable
  return showAds !== 'false';
};

/**
 * Initialize AdMob
 * Call this once when the app starts
 */
export async function initializeAds(): Promise<void> {
  // Don't initialize if ads are disabled
  if (!shouldShowAds()) {
    console.log('Ads disabled via EXPO_PUBLIC_SHOWADS=false');
    return;
  }

  try {
    await mobileAds().initialize();
    
    // Configure ad settings
    await mobileAds().setRequestConfiguration({
      // Maximum ad content rating
      maxAdContentRating: MaxAdContentRating.PG,
      // Tag for child-directed treatment (set to false for general audience)
      tagForChildDirectedTreatment: false,
      // Tag for under age of consent
      tagForUnderAgeOfConsent: false,
    });
    
    console.log('AdMob initialized successfully');
  } catch (error) {
    console.error('Error initializing AdMob:', error);
  }
}

/**
 * AdMob Test Ad Unit IDs
 * These are Google's official test IDs - replace with your real IDs in production
 */
export const AD_UNIT_IDS = {
  // Native ad unit IDs - used for content ad placements
  native: {
    ios: 'ca-app-pub-3940256099942544/3986624511',
    android: 'ca-app-pub-3940256099942544/2247696110',
  },
  // Rewarded ad unit IDs - used for earning rewards (e.g., extra study sessions)
  rewarded: {
    ios: 'ca-app-pub-3940256099942544/1712485313',
    android: 'ca-app-pub-3940256099942544/5224354917',
  },
};

/**
 * Get the appropriate ad unit ID for the current platform
 */
export function getAdUnitId(adType: keyof typeof AD_UNIT_IDS): string {
  const Platform = require('react-native').Platform;
  return Platform.OS === 'ios' 
    ? AD_UNIT_IDS[adType].ios 
    : AD_UNIT_IDS[adType].android;
}

