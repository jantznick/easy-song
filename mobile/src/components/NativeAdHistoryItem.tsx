/**
 * True native ad styled to look like a history item
 * Uses Google Mobile Ads Native Ad API for full customization
 */

import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  NativeAd, 
  NativeAdView, 
  NativeAsset, 
  NativeAssetType,
  NativeMediaView,
} from 'react-native-google-mobile-ads';
import { useThemeClasses } from '../utils/themeClasses';
import { useTheme } from '../contexts/ThemeContext';
import { getAdUnitId } from '../utils/ads';

interface NativeAdHistoryItemProps {
  isLastItem?: boolean;
}

export default function NativeAdHistoryItem({ isLastItem = false }: NativeAdHistoryItemProps) {
  const theme = useThemeClasses();
  const { isDark } = useTheme();
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    // Load the native ad
    NativeAd.createForAdRequest(getAdUnitId('native'), {
      requestNonPersonalizedAdsOnly: false,
    })
      .then(setNativeAd)
      .catch((error) => {
        console.error('Failed to load native ad:', error);
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
    <View style={[
      styles.borderContainer,
      { 
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#334155' : '#E5E7EB',
        borderTopWidth: 1,
        borderTopColor: isDark ? '#334155' : '#E5E7EB',
      }
    ]}>
      <NativeAdView 
        nativeAd={nativeAd}
        style={styles.container}
      >
      {/* Mimics history item structure - all assets must be direct children of NativeAsset */}
      <View style={styles.row}>
        {/* Ad Icon - 40x40 circle to match history items */}
        {nativeAd.icon ? (
          <NativeAsset assetType={NativeAssetType.ICON}>
            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.1)' }]}>
              <Image 
                source={{ uri: nativeAd.icon.url }} 
                style={styles.icon}
              />
            </View>
          </NativeAsset>
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.1)' }]}>
            <Ionicons name="megaphone-outline" size={18} color="#a855f7" />
          </View>
        )}

        {/* Ad Content */}
        <View style={styles.content}>
          {/* SPONSORED label */}
          <Text style={[styles.sponsoredLabel, { color: isDark ? '#94A3B8' : '#6B7280' }]}>
            SPONSORED
          </Text>

          {/* Headline - acts like song title */}
          {nativeAd.headline && (
            <NativeAsset assetType={NativeAssetType.HEADLINE}>
              <Text style={[styles.headline, { color: isDark ? '#F1F5F9' : '#111827' }]} numberOfLines={2}>
                {nativeAd.headline}
              </Text>
            </NativeAsset>
          )}

          {/* Advertiser/Body - acts like artist name */}
          {(nativeAd.advertiser || nativeAd.body) && (
            <NativeAsset assetType={nativeAd.advertiser ? NativeAssetType.ADVERTISER : NativeAssetType.BODY}>
              <Text style={[styles.body, { color: isDark ? '#94A3B8' : '#6B7280' }]} numberOfLines={1}>
                {nativeAd.advertiser || nativeAd.body}
              </Text>
            </NativeAsset>
          )}

          {/* Call to Action & Media Row */}
          <View style={styles.bottomRow}>
            {/* Call to Action - styled like mode badge */}
            {nativeAd.callToAction && (
              <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                <View style={styles.ctaButton}>
                  <Text style={styles.ctaText}>
                    {nativeAd.callToAction}
                  </Text>
                </View>
              </NativeAsset>
            )}
          </View>

          {/* Compact Media View - minimum 120x120 for AdMob compliance, only shows if media exists */}
          {nativeAd.mediaContent && (
            <View style={styles.mediaContainer}>
              <NativeMediaView 
                style={styles.media}
                resizeMode="cover"
              />
            </View>
          )}
        </View>

        {/* Chevron to match history items */}
        <Ionicons name="chevron-forward" size={20} color={isDark ? '#94A3B8' : '#6B7280'} style={styles.chevron} />
      </View>
    </NativeAdView>
    </View>
  );
}

const styles = StyleSheet.create({
  borderContainer: {
    // This wrapper handles the border
  },
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  content: {
    flex: 1,
  },
  sponsoredLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  headline: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ctaButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  ctaText: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '500',
  },
  mediaContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  media: {
    width: 120,
    height: 120,
    minWidth: 120,
    minHeight: 120,
  },
  chevron: {
    marginLeft: 8,
  },
});

