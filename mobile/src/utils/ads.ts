/**
 * Google AdMob utilities and configuration
 */

import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

/**
 * Initialize AdMob
 * Call this once when the app starts
 */
export async function initializeAds(): Promise<void> {
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
  // Interstitial ad unit IDs
  interstitial: {
    ios: 'ca-app-pub-3940256099942544/4411468910',
    android: 'ca-app-pub-3940256099942544/1033173712',
  },
  // Banner ad unit IDs
  banner: {
    ios: 'ca-app-pub-3940256099942544/2934735716',
    android: 'ca-app-pub-3940256099942544/6300978111',
  },
  // Rewarded ad unit IDs
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

