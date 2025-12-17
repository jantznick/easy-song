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
        console.error('Failed to load native ad:', error);
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
          borderTopWidth: 1,
          borderTopColor: isDark ? '#334155' : '#E5E7EB',
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#334155' : '#E5E7EB',
        }
      ]}
    >
      {/* Mimics history item structure exactly */}
      <View style={styles.row}>
        {/* Ad Icon - 40x40 circle to match history items */}
        {nativeAd.icon ? (
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
            <Image 
              source={{ uri: nativeAd.icon.url }} 
              style={styles.icon}
            />
          </View>
        ) : (
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
            <Ionicons name="megaphone-outline" size={18} color="#a855f7" />
          </View>
        )}

        {/* Ad Content */}
        <View style={styles.content}>
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

          {/* Bottom row with CTA and Ad label - matches mode badge + date layout */}
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
            
            {/* Ad label to indicate sponsored content */}
            <Text style={[styles.adLabel, { color: isDark ? '#64748B' : '#6B7280' }]}>
              Ad
            </Text>
          </View>
        </View>

        {/* Chevron to match history items */}
        <Ionicons name="chevron-forward" size={20} color={isDark ? '#94A3B8' : '#4B5563'} style={styles.chevron} />
      </View>
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 17.5,
    paddingRight: 17.5,
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
  adLabel: {
    fontSize: 12,
  },
  chevron: {
    marginLeft: 8,
  },
});

