/**
 * Hook for managing interstitial ads
 */

import { useEffect, useState } from 'react';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { getAdUnitId } from '../utils/ads';

export function useInterstitialAd() {
  const [loaded, setLoaded] = useState(false);
  const [ad, setAd] = useState<InterstitialAd | null>(null);

  useEffect(() => {
    // Create the interstitial ad
    const interstitial = InterstitialAd.createForAdRequest(getAdUnitId('interstitial'), {
      requestNonPersonalizedAdsOnly: false,
    });

    // Set up event listeners
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      console.log('Interstitial ad loaded');
      setLoaded(true);
    });

    const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('Interstitial ad error:', error);
      setLoaded(false);
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Interstitial ad closed');
      setLoaded(false);
      // Reload the ad for next time
      interstitial.load();
    });

    // Load the ad
    interstitial.load();
    setAd(interstitial);

    // Cleanup
    return () => {
      unsubscribeLoaded();
      unsubscribeError();
      unsubscribeClosed();
    };
  }, []);

  const showAd = () => {
    if (loaded && ad) {
      ad.show();
    } else {
      console.log('Interstitial ad not ready yet');
    }
  };

  return {
    loaded,
    showAd,
  };
}

