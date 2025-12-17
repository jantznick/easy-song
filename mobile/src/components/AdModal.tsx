/**
 * Custom branded modal with native ad
 */

import { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
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

interface AdModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AdModal({ visible, onClose }: AdModalProps) {
  const theme = useThemeClasses();
  const { isDark } = useTheme();
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    if (visible) {
      // Load native ad when modal becomes visible
      NativeAd.createForAdRequest(getAdUnitId('native'), {
        requestNonPersonalizedAdsOnly: false,
      })
        .then(setNativeAd)
        .catch((error) => {
          console.error('Failed to load modal native ad:', error);
        });
    }

    // Cleanup: destroy the ad when modal closes
    return () => {
      if (nativeAd) {
        nativeAd.destroy();
        setNativeAd(null);
      }
    };
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity 
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Modal Content */}
        <View 
          className={theme.bg('bg-white', 'bg-slate-800') + ' rounded-2xl mx-6 p-5 shadow-2xl'}
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="bg-purple-100 dark:bg-purple-900 rounded-full p-2 mr-3">
                <Ionicons name="musical-notes" size={20} color="#9333ea" />
              </View>
              <View>
                <Text className={theme.text('text-gray-900', 'text-white') + ' text-lg font-bold'}>
                  Support Easy Song
                </Text>
                <Text className={theme.text('text-gray-600', 'text-gray-400') + ' text-sm'}>
                  Help us keep the music playing
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={onClose}
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name="close-circle" 
                size={28} 
                color={theme.isDark ? '#94a3b8' : '#64748b'} 
              />
            </TouchableOpacity>
          </View>

          {/* Native Ad Card */}
          {nativeAd ? (
            <View style={[
              styles.adWrapper,
              { 
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderColor: isDark ? '#334155' : '#e2e8f0',
              }
            ]}>
              <NativeAdView 
                nativeAd={nativeAd}
                style={styles.adContainer}
              >
                {/* Media or Icon */}
                {nativeAd.mediaContent ? (
                  <View style={styles.mediaWrapper}>
                    <NativeMediaView style={styles.media} resizeMode="cover" />
                    {/* Gradient overlay for better text contrast */}
                    <View style={styles.mediaOverlay} />
                  </View>
                ) : nativeAd.icon ? (
                  <View style={styles.iconContainer}>
                    <NativeAsset assetType={NativeAssetType.ICON}>
                      <Image 
                        source={{ uri: nativeAd.icon.url }} 
                        style={styles.icon}
                      />
                    </NativeAsset>
                  </View>
                ) : null}

                {/* Ad Content Card */}
                <View style={[
                  styles.contentCard,
                  { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }
                ]}>
                  {/* Headline */}
                  {nativeAd.headline && (
                    <NativeAsset assetType={NativeAssetType.HEADLINE}>
                      <Text 
                        style={[styles.headline, { color: isDark ? '#f1f5f9' : '#0f172a' }]}
                        numberOfLines={2}
                      >
                        {nativeAd.headline}
                      </Text>
                    </NativeAsset>
                  )}

                  {/* Body with CTA Button inline */}
                  <View style={styles.bodyRow}>
                    {nativeAd.body && (
                      <NativeAsset assetType={NativeAssetType.BODY}>
                        <Text 
                          style={[styles.body, { color: isDark ? '#cbd5e1' : '#475569' }]}
                          numberOfLines={2}
                        >
                          {nativeAd.body}
                        </Text>
                      </NativeAsset>
                    )}
                    
                    {/* Small CTA Button */}
                    {nativeAd.callToAction && (
                      <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                        <View style={styles.ctaButton}>
                          <Text style={styles.ctaText} numberOfLines={1}>
                            {nativeAd.callToAction}
                          </Text>
                          <Ionicons name="arrow-forward" size={14} color="#ffffff" />
                        </View>
                      </NativeAsset>
                    )}
                  </View>
                </View>
              </NativeAdView>
            </View>
          ) : (
            <View style={[styles.adContainer, styles.loadingContainer]}>
              <Text style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>Loading ad...</Text>
            </View>
          )}

          {/* Footer Message */}
          <Text className={theme.text('text-gray-600', 'text-gray-400') + ' text-center text-xs'}>
            Ads help us maintain and improve Easy Song for free 💜
          </Text>

          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            className="bg-purple-600 dark:bg-purple-700 rounded-xl py-3 px-6 mt-4"
          >
            <Text className="text-white text-center font-semibold text-base">
              Continue to Songs
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    maxWidth: 360,
    width: '75%',
  },
  adWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  adContainer: {
    minHeight: 150,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150,
    padding: 20,
  },
  mediaWrapper: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  media: {
    width: '100%',
    height: 200,
    minWidth: 120,
    minHeight: 120,
  },
  mediaOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: 40,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  contentCard: {
    padding: 16,
    gap: 10,
  },
  headline: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  body: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});

