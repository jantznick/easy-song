/**
 * Hook for managing Google AdMob Rewarded Ads
 * Used for features like earning extra study sessions
 */

import { useState, useEffect, useRef } from 'react';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { getAdUnitId, shouldShowAds } from '../utils/ads';

export interface UseRewardedAdReturn {
  isLoading: boolean;
  isReady: boolean;
  show: () => Promise<boolean>;
  error: string | null;
}

export function useRewardedAd(): UseRewardedAdReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const rewardedAdRef = useRef<RewardedAd | null>(null);
  const isShowingRef = useRef(false);

  useEffect(() => {
    // Don't load ads if disabled
    if (!shouldShowAds()) {
      setIsLoading(false);
      setIsReady(false);
      return;
    }

    // Create and load rewarded ad
    const adUnitId = getAdUnitId('rewarded');
    const rewarded = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    // Set up event listeners
    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('Rewarded ad loaded');
      setIsLoading(false);
      setIsReady(true);
      setError(null);
    });

    const unsubscribeEarnedReward = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        // Reward will be handled in the show() promise resolution
      }
    );

    const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('Rewarded ad error:', error);
      setIsLoading(false);
      setIsReady(false);
      setError('Failed to load ad. Please try again.');
    });

    rewardedAdRef.current = rewarded;

    // Load the ad
    rewarded.load();

    // Cleanup
    return () => {
      unsubscribeLoaded();
      unsubscribeEarnedReward();
      unsubscribeError();
    };
  }, []);

  const show = async (): Promise<boolean> => {
    // Don't show ads if disabled
    if (!shouldShowAds()) {
      // Return true to simulate successful ad view when ads are disabled
      return true;
    }

    if (!rewardedAdRef.current || !isReady || isShowingRef.current) {
      console.warn('Rewarded ad not ready or already showing');
      return false;
    }

    return new Promise((resolve) => {
      isShowingRef.current = true;
      let didEarnReward = false;

      // Listen for reward event
      const unsubscribeEarnedReward = rewardedAdRef.current!.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          didEarnReward = true;
        }
      );

      // Listen for when ad is dismissed/closed
      const unsubscribeDismissed = rewardedAdRef.current!.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          console.log('Rewarded ad closed, earned reward:', didEarnReward);
          unsubscribeEarnedReward();
          unsubscribeDismissed();
          isShowingRef.current = false;
          setIsReady(false);
          resolve(didEarnReward);
        }
      );

      try {
        rewardedAdRef.current!.show();
      } catch (error) {
        console.error('Error showing rewarded ad:', error);
        unsubscribeEarnedReward();
        unsubscribeDismissed();
        isShowingRef.current = false;
        setError('Failed to show ad');
        resolve(false);
      }
    });
  };

  return {
    isLoading,
    isReady,
    show,
    error,
  };
}

