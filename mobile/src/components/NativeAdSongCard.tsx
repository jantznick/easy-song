/**
 * Native ad styled to look like a song card
 * Blends seamlessly into the song grid
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { 
  NativeAd, 
  NativeAdView, 
  NativeAsset, 
  NativeAssetType,
  NativeMediaView,
} from 'react-native-google-mobile-ads';
import { useThemeClasses } from '../utils/themeClasses';
import { useTheme } from '../contexts/ThemeContext';
import { getAdUnitId, shouldShowAds } from '../utils/ads';

export default function NativeAdSongCard() {
  const theme = useThemeClasses();
  const { isDark } = useTheme();
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    // Don't load ads if disabled
    if (!shouldShowAds()) {
      return;
    }

    let adInstance: NativeAd | null = null;
    let isMounted = true;

    // Load the native ad
    NativeAd.createForAdRequest(getAdUnitId('native'), {
      requestNonPersonalizedAdsOnly: false,
    })
      .then((ad) => {
        if (isMounted) {
          adInstance = ad;
          setNativeAd(ad);
        } else {
          // Component unmounted before ad loaded, destroy immediately
          ad.destroy();
        }
      })
      .catch((error) => {
        console.error('Failed to load native ad song card:', error);
      });

    // Cleanup: destroy the ad when component unmounts
    return () => {
      isMounted = false;
      if (adInstance) {
        adInstance.destroy();
      }
    };
  }, []);

  // Don't render anything if ad hasn't loaded yet
  if (!nativeAd) {
    return null;
  }

  return (
    <NativeAdView 
      nativeAd={nativeAd}
      style={[
        styles.container,
        { 
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderColor: isDark ? '#334155' : '#E5E7EB',
        }
      ]}
    >
      {/* Media View - matches song thumbnail (160px to match song cards, meets 120px minimum) */}
      <View style={styles.mediaContainer}>
        <NativeMediaView 
          style={styles.media}
          resizeMode="cover"
        />
        {/* Overlay gradient */}
        <View style={styles.overlay} />
        
        {/* "Ad" badge */}
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>Ad</Text>
        </View>

        {/* Call to Action Button - centered like play button */}
        {nativeAd.callToAction && (
          <View style={styles.ctaContainer}>
            <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
              <View style={styles.ctaButton}>
                <Text style={styles.ctaButtonText}>
                  {nativeAd.callToAction}
                </Text>
              </View>
            </NativeAsset>
          </View>
        )}
      </View>

      {/* Content - matches song card text area */}
      <View style={styles.content}>
        {/* Headline - acts like song title */}
        {nativeAd.headline && (
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text 
              numberOfLines={2}
              style={[
                styles.headline, 
                { color: isDark ? '#F1F5F9' : '#111827' }
              ]}
            >
              {nativeAd.headline}
            </Text>
          </NativeAsset>
        )}

        {/* Advertiser or Body - acts like artist name */}
        {(nativeAd.advertiser || nativeAd.body) && (
          <NativeAsset assetType={nativeAd.advertiser ? NativeAssetType.ADVERTISER : NativeAssetType.BODY}>
            <Text 
              numberOfLines={1}
              style={[
                styles.body, 
                { color: isDark ? '#94A3B8' : '#6B7280' }
              ]}
            >
              {nativeAd.advertiser || nativeAd.body}
            </Text>
          </NativeAsset>
        )}
      </View>
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mediaContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: 160,
    minWidth: 120,
    minHeight: 120,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  adBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  ctaContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -20,
  },
  ctaButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    height: 100, // Fixed height to match song cards
  },
  headline: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    lineHeight: 18,
  },
});

