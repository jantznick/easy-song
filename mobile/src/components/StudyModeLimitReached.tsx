import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeClasses } from '../utils/themeClasses';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { usePurchase } from '../hooks/usePurchase';
import { useUser } from '../contexts/UserContext';

interface StudyModeLimitReachedProps {
  onWatchAd: () => void;
  onPurchaseSuccess?: () => void;
}

// Benefit Item Component (Compact)
function BenefitItem({ text, isComingSoon }: { text: string; isComingSoon?: boolean }) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  
  return (
    <View className="flex-row items-start mb-2">
      <Ionicons name="checkmark-circle" size={18} color="#6366F1" style={{ marginRight: 8, marginTop: 1 }} />
      <View className="flex-1">
        <Text className={isDark ? 'text-[#E2E8F0]' : 'text-[#1E293B]' + ' text-sm leading-5'}>
          {text}
          {isComingSoon && (
            <Text className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]' + ' text-xs italic'}>
              {' '}({t('premium.comingSoon')})
            </Text>
          )}
        </Text>
      </View>
    </View>
  );
}

export default function StudyModeLimitReached({ onWatchAd, onPurchaseSuccess }: StudyModeLimitReachedProps) {
  const theme = useThemeClasses();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { refreshUser } = useUser();
  const [isAnnual, setIsAnnual] = useState(false);
  const { loading, offerings, loadOfferings, makePurchase } = usePurchase();

  // Load offerings on mount
  useEffect(() => {
    loadOfferings();
  }, []);

  const premiumPlusBenefits = [
    { text: t('premium.premiumPlus.benefits.history') },
    { text: t('premium.premiumPlus.benefits.studyMode') },
    { text: t('premium.premiumPlus.benefits.games'), isComingSoon: true },
    { text: t('premium.premiumPlus.benefits.requests') },
    { text: t('premium.premiumPlus.benefits.noAds') },
  ];

  const handleUpgradePress = async () => {
    const result = await makePurchase({
      tier: 'premiumPlus',
      billingPeriod: isAnnual ? 'annual' : 'monthly',
      source: 'study_limit',
    });

    if (result.success) {
      // Wait a moment for webhook to update database, then refresh from backend
      // Webhook typically processes within 1-2 seconds
      setTimeout(async () => {
        await refreshUser();
      }, 2000);

      // Show success message
      Alert.alert(
        t('premium.successTitle') || 'Welcome to Premium Plus!',
        t('premium.successMessage') || 'You now have unlimited study mode access!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Callback to parent (e.g., close modal, refresh UI)
              onPurchaseSuccess?.();
            },
          },
        ]
      );
    }
    // Errors are handled by usePurchase hook
  };

  const handleBackPress = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('SongList' as never);
    }
  };

  return (
    <ScrollView 
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 16, paddingHorizontal: 16, paddingTop: 12 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="items-center mb-3">
        {/* Icon */}
        <View 
          className="rounded-full p-3 mb-2"
          style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}
        >
          <Ionicons name="lock-closed" size={36} color="#f59e0b" />
        </View>

        {/* Title */}
        <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-xl font-bold mb-1 text-center'}>
          {t('studyMode.limitReached')}
        </Text>

        {/* Message */}
        <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm text-center mb-2 leading-5'}>
          {t('studyMode.limitReachedMessage')}
        </Text>
      </View>

      {/* Premium Plus Tier Card (Compact) */}
      <View 
        className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' rounded-xl p-4 mb-3'}
        style={{
          borderWidth: 2,
          borderColor: '#6366F1',
        }}
      >
        <View className="mb-3">
          <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-bold mb-2'}>
            {t('premium.premiumPlus.title')}
          </Text>
          
          {/* Pricing Toggle */}
          <View className="flex-row items-center mb-2">
            <TouchableOpacity
              onPress={() => setIsAnnual(false)}
              disabled={loading || !offerings}
              className={`px-2.5 py-1 rounded-lg mr-2 ${!isAnnual ? 'bg-primary/20' : ''}`}
            >
              <Text className={`text-xs font-bold uppercase ${!isAnnual ? 'text-primary' : theme.text('text-text-secondary', 'text-[#94A3B8]')}`}>
                {t('premium.monthly')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsAnnual(true)}
              disabled={loading || !offerings}
              className={`px-2.5 py-1 rounded-lg ${isAnnual ? 'bg-primary/20' : ''}`}
            >
              <Text className={`text-xs font-bold uppercase ${isAnnual ? 'text-primary' : theme.text('text-text-secondary', 'text-[#94A3B8]')}`}>
                {t('premium.annual')}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Price Display */}
          <View className="flex-row items-baseline mb-1">
            <Text className={isDark ? 'text-white' : 'text-[#0F172A]' + ' text-4xl font-bold'}>
              {isAnnual ? t('premium.premiumPlus.annualPrice') : t('premium.premiumPlus.monthlyPrice')}
            </Text>
            <Text className={isDark ? 'text-[#CBD5E1]' : 'text-[#475569]' + ' text-lg ml-1.5 font-medium'}>
              {isAnnual ? t('premium.premiumPlus.annualPeriod') : t('premium.premiumPlus.monthlyPeriod')}
            </Text>
          </View>
          {isAnnual && (
            <Text className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]' + ' text-xs font-medium'}>
              {t('premium.premiumPlus.annualTotal')} {t('premium.premiumPlus.annualBilling')}
            </Text>
          )}
        </View>
        
        {/* Benefits List */}
        <View className="mb-4">
          {premiumPlusBenefits.map((benefit, index) => (
            <BenefitItem key={index} text={benefit.text} isComingSoon={benefit.isComingSoon} />
          ))}
        </View>
        
        {/* Purchase Button */}
        <TouchableOpacity
          onPress={handleUpgradePress}
          disabled={loading || !offerings}
          className="bg-primary rounded-xl py-3 items-center"
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-base font-bold">
              {t('premium.premiumPlus.purchase')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View className="items-center my-2">
        <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-xs'}>
          {t('studyMode.limitReachedAd')}
        </Text>
      </View>

      {/* Watch Ad Section */}
      <TouchableOpacity
        onPress={onWatchAd}
        className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' border rounded-xl py-3 px-4 mb-3'}
      >
        <View className="flex-row items-center justify-center">
          <Ionicons name="play-circle-outline" size={20} color="#6366F1" style={{ marginRight: 6 }} />
          <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-center font-semibold text-sm'}>
            {t('studyMode.watchAdButton')}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Info text & Back button in row */}
      <View className="flex-row items-center justify-between">
        <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-xs flex-1 mr-2'}>
          {t('studyMode.comeBackTomorrow')}
        </Text>
        <TouchableOpacity
          onPress={handleBackPress}
          className={theme.border('border-border', 'border-[#334155]') + ' border rounded-lg py-2 px-4'}
        >
          <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-center font-semibold text-sm'}>
            {t('common.back')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

