/**
 * Compact native ad banner for settings pages
 * Similar to banner ads but uses native ad format for better customization
 */

import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { 
  NativeAd, 
  NativeAdView, 
  NativeAsset, 
  NativeAssetType,
  NativeMediaView,
} from 'react-native-google-mobile-ads';
import { useTheme } from '../contexts/ThemeContext';
import { getAdUnitId } from '../utils/ads';

export default function NativeAdBanner() {
  const { isDark } = useTheme();
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    // Load the native ad
    NativeAd.createForAdRequest(getAdUnitId('native'), {
      requestNonPersonalizedAdsOnly: false,
    })
      .then(setNativeAd)
      .catch((error) => {
        console.error('Failed to load native ad banner:', error);
      });

    // Cleanup: destroy the ad when component unmounts
    return () => {
      if (nativeAd) {
        nativeAd.destroy();
      }
    };
  }, []);

  // Don't render anything if ad hasn't loaded yet
  if (!nativeAd) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      {/* Subtle "Ad" label */}
      <Text style={[styles.adLabel, { color: isDark ? '#64748B' : '#9CA3AF' }]}>
        Ad
      </Text>
      
      <NativeAdView 
        nativeAd={nativeAd}
        style={[
          styles.container,
          { 
            backgroundColor: isDark ? '#1E293B' : '#F9FAFB',
            borderColor: isDark ? '#334155' : '#E5E7EB',
          }
        ]}
      >
        <View style={styles.content}>
          {/* Media View or Icon - prefer media if available */}
          {nativeAd.mediaContent ? (
            <View style={styles.mediaWrapper}>
              <NativeMediaView style={styles.media} resizeMode="cover" />
            </View>
          ) : nativeAd.icon ? (
            <NativeAsset assetType={NativeAssetType.ICON}>
              <View style={styles.iconWrapper}>
                <Image 
                  source={{ uri: nativeAd.icon.url }} 
                  style={styles.icon}
                />
              </View>
            </NativeAsset>
          ) : null}

          {/* Text Content */}
          <View style={styles.textContent}>
            {/* Headline */}
            {nativeAd.headline && (
              <NativeAsset assetType={NativeAssetType.HEADLINE}>
                <Text 
                  style={[styles.headline, { color: isDark ? '#F1F5F9' : '#111827' }]} 
                  numberOfLines={2}
                >
                  {nativeAd.headline}
                </Text>
              </NativeAsset>
            )}

            {/* Body or Advertiser */}
            {(nativeAd.body || nativeAd.advertiser) && (
              <NativeAsset assetType={nativeAd.body ? NativeAssetType.BODY : NativeAssetType.ADVERTISER}>
                <Text 
                  style={[styles.body, { color: isDark ? '#94A3B8' : '#6B7280' }]} 
                  numberOfLines={2}
                >
                  {nativeAd.body || nativeAd.advertiser}
                </Text>
              </NativeAsset>
            )}
          </View>

          {/* Call to Action Button */}
          {nativeAd.callToAction && (
            <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
              <View style={styles.ctaButton}>
                <Text style={styles.ctaText} numberOfLines={1}>
                  {nativeAd.callToAction}
                </Text>
              </View>
            </NativeAsset>
          )}
        </View>
      </NativeAdView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 12,
  },
  adLabel: {
    fontSize: 10,
    marginBottom: 6,
    opacity: 0.5,
  },
  container: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    maxWidth: 400,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  mediaWrapper: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
  },
  media: {
    width: 120,
    height: 120,
    minWidth: 120,
    minHeight: 120,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
  },
  icon: {
    width: 48,
    height: 48,
  },
  textContent: {
    flex: 1,
    gap: 4,
  },
  headline: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  body: {
    fontSize: 12,
    lineHeight: 16,
  },
  ctaButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

