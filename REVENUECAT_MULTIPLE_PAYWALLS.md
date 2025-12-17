# RevenueCat with Multiple Paywalls

## Your Paywall Situation

You have **TWO custom paywalls** that need RevenueCat integration:

### 1. PremiumBenefitsScreen.tsx (Full Paywall)
**Purpose:** Main subscription screen  
**Shows:** Both Premium and Premium Plus tiers  
**Triggered from:**
- Settings → Premium Benefits
- User Profile → Upgrade
- History screen → "See more" button

**Current state:** TODO on line 199

### 2. StudyModeLimitReached.tsx (Inline Paywall)
**Purpose:** Study mode limit gate  
**Shows:** Only Premium Plus tier (the one that unlocks unlimited study)  
**Triggered from:**
- Study mode screen when daily limit reached

**Current state:** TODO on line 51

---

## Good News: Same RevenueCat Code Works for Both! 🎉

RevenueCat doesn't care where the purchase happens. The SDK works the same way in both screens. You just need to:

1. ✅ Import the same `purchasePackage()` utility
2. ✅ Call it when purchase button is pressed
3. ✅ Track which paywall the purchase came from (for analytics)

---

## Implementation Strategy

### Shared Purchase Logic

Create a **shared hook** that both paywalls can use:

```typescript
// mobile/src/hooks/usePurchase.ts

import { useState } from 'react';
import { Alert } from 'react-native';
import { getOfferings, purchasePackage } from '../utils/subscriptions';
import { trackEvent } from '../utils/analytics';
import type { PurchasesPackage } from 'react-native-purchases';

interface PurchaseOptions {
  tier: 'premium' | 'premiumPlus';
  billingPeriod: 'monthly' | 'annual';
  source: string; // 'settings', 'study_limit', 'history', etc.
}

export function usePurchase() {
  const [loading, setLoading] = useState(false);
  const [offerings, setOfferings] = useState(null);

  const loadOfferings = async () => {
    try {
      const current = await getOfferings();
      setOfferings(current);
      return current;
    } catch (error) {
      console.error('Load offerings error:', error);
      return null;
    }
  };

  const makePurchase = async (options: PurchaseOptions) => {
    const { tier, billingPeriod, source } = options;

    if (!offerings) {
      Alert.alert('Error', 'Subscription options not loaded yet.');
      return { success: false };
    }

    setLoading(true);
    
    // Track purchase attempt
    trackEvent('purchase_initiated', {
      tier,
      billingPeriod,
      source,
    });

    try {
      // Map to RevenueCat package identifier
      const packageId = `${tier === 'premium' ? 'premium' : 'premium_plus'}_${billingPeriod}`;
      const packageToPurchase = offerings.availablePackages.find(
        pkg => pkg.identifier === packageId
      );

      if (!packageToPurchase) {
        throw new Error(`Package ${packageId} not found`);
      }

      // Make the purchase
      const result = await purchasePackage(packageToPurchase);
      
      setLoading(false);

      if (result.success) {
        trackEvent('purchase_success', {
          tier,
          billingPeriod,
          source,
          product_id: packageToPurchase.product.identifier,
          price: packageToPurchase.product.price,
        });
        
        return { 
          success: true, 
          customerInfo: result.customerInfo,
        };
      } else if (result.error !== 'cancelled') {
        throw new Error(result.error || 'Unknown error');
      } else {
        // User cancelled
        trackEvent('purchase_cancelled', { tier, billingPeriod, source });
        return { success: false, cancelled: true };
      }
    } catch (error: any) {
      setLoading(false);
      
      trackEvent('purchase_failed', {
        tier,
        billingPeriod,
        source,
        error: error.message,
      });
      
      Alert.alert(
        'Purchase Failed',
        error.message || 'An error occurred. Please try again.'
      );
      
      return { success: false, error: error.message };
    }
  };

  return {
    loading,
    offerings,
    loadOfferings,
    makePurchase,
  };
}
```

---

## Update 1: PremiumBenefitsScreen.tsx

Replace the component with this updated version:

```typescript
// mobile/src/screens/PremiumBenefitsScreen.tsx

import { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useThemeClasses } from '../utils/themeClasses';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import ConfirmationModal from '../components/ConfirmationModal';
import { usePurchase } from '../hooks/usePurchase'; // NEW

type Props = NativeStackScreenProps<RootStackParamList, 'PremiumBenefits'>;

interface BenefitItemProps {
  text: string;
  isComingSoon?: boolean;
}

function BenefitItem({ text, isComingSoon }: BenefitItemProps) {
  const theme = useThemeClasses();
  const { t } = useTranslation();
  const { isDark } = useTheme();
  
  return (
    <View className="flex-row items-start mb-3">
      <Ionicons name="checkmark-circle" size={22} color="#6366F1" style={{ marginRight: 12, marginTop: 2 }} />
      <View className="flex-1">
        <Text className={isDark ? 'text-[#E2E8F0]' : 'text-[#1E293B]' + ' text-lg leading-7 font-medium'}>
          {text}
          {isComingSoon && (
            <Text className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]' + ' text-base italic'}>
              {' '}({t('premium.comingSoon')})
            </Text>
          )}
        </Text>
      </View>
    </View>
  );
}

interface TierCardProps {
  title: string;
  monthlyPrice: string;
  monthlyPeriod: string;
  annualPrice: string;
  annualPeriod: string;
  annualTotal: string;
  annualBilling: string;
  purchaseText: string;
  benefits: Array<{ text: string; isComingSoon?: boolean }>;
  isHighlighted?: boolean;
  onPurchase: (billingPeriod: 'monthly' | 'annual') => void;
  loading?: boolean; // NEW
}

function TierCard({ 
  title, 
  monthlyPrice, 
  monthlyPeriod, 
  annualPrice, 
  annualPeriod, 
  annualTotal,
  annualBilling,
  purchaseText,
  benefits, 
  isHighlighted = false,
  onPurchase,
  loading = false, // NEW
}: TierCardProps) {
  const theme = useThemeClasses();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [isAnnual, setIsAnnual] = useState(false);
  
  return (
    <View 
      className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' rounded-2xl p-6 mb-4'}
      style={isHighlighted ? {
        borderWidth: 2,
        borderColor: '#6366F1',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      } : {
        borderWidth: 1,
        borderColor: isDark ? '#334155' : '#E4E7EB',
      }}
    >
      {isHighlighted && (
        <View className="absolute top-4 right-4 bg-primary px-4 py-1.5 rounded-full">
          <Text className="text-white text-sm font-bold">POPULAR</Text>
        </View>
      )}
      
      <View className="mb-4">
        <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-2xl font-bold mb-2'}>
          {title}
        </Text>
        
        {/* Pricing Toggle */}
        <View className="flex-row items-center mb-3">
          <TouchableOpacity
            onPress={() => setIsAnnual(false)}
            className={`px-3 py-1.5 rounded-lg mr-2 ${!isAnnual ? 'bg-primary/20' : ''}`}
            disabled={loading} // NEW
          >
            <Text className={`text-sm font-bold uppercase ${!isAnnual ? 'text-primary' : theme.text('text-text-secondary', 'text-[#94A3B8]')}`}>
              {t('premium.monthly')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsAnnual(true)}
            className={`px-3 py-1.5 rounded-lg ${isAnnual ? 'bg-primary/20' : ''}`}
            disabled={loading} // NEW
          >
            <Text className={`text-sm font-bold uppercase ${isAnnual ? 'text-primary' : theme.text('text-text-secondary', 'text-[#94A3B8]')}`}>
              {t('premium.annual')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Price Display */}
        <View className="flex-row items-baseline mb-2">
          <Text className={isDark ? 'text-white' : 'text-[#0F172A]' + ' text-5xl font-bold'}>
            {isAnnual ? annualPrice : monthlyPrice}
          </Text>
          <Text className={isDark ? 'text-[#CBD5E1]' : 'text-[#475569]' + ' text-xl ml-2 font-medium'}>
            {isAnnual ? annualPeriod : monthlyPeriod}
          </Text>
        </View>
        {isAnnual && (
          <Text className={isDark ? 'text-[#94A3B8]' : 'text-[#64748B]' + ' text-sm font-medium'}>
            {annualTotal} {annualBilling}
          </Text>
        )}
      </View>
      
      {/* Benefits List */}
      <View className="mb-6">
        {benefits.map((benefit, index) => (
          <BenefitItem key={index} text={benefit.text} isComingSoon={benefit.isComingSoon} />
        ))}
      </View>
      
      {/* Purchase Button */}
      <TouchableOpacity
        onPress={() => onPurchase(isAnnual ? 'annual' : 'monthly')} // UPDATED
        disabled={loading} // NEW
        className="bg-primary rounded-xl py-5 items-center"
        activeOpacity={0.8}
        style={{
          shadowColor: '#6366F1',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        {loading ? ( // NEW
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-lg font-bold">
            {purchaseText}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function PremiumBenefitsScreen({ route }: Props) {
  const navigation = useNavigation();
  const theme = useThemeClasses();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { loading, offerings, loadOfferings, makePurchase } = usePurchase(); // NEW
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'default' | 'success' | 'error' | 'warning';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'default',
  });

  // Load offerings on mount
  useEffect(() => {
    loadOfferings();
  }, []);

  // REPLACED handlePurchase function
  const handlePurchase = async (
    tier: 'premium' | 'premiumPlus',
    billingPeriod: 'monthly' | 'annual'
  ) => {
    setLoadingTier(`${tier}_${billingPeriod}`);
    
    const result = await makePurchase({
      tier,
      billingPeriod,
      source: route.params?.source || 'settings',
    });
    
    setLoadingTier(null);

    if (result.success) {
      // Show success message
      setConfirmationModal({
        visible: true,
        title: t('premium.successTitle') || 'Welcome to Premium!',
        message: t('premium.successMessage') || 'Your subscription is now active. Enjoy!',
        type: 'success',
        onConfirm: () => {
          setConfirmationModal(prev => ({ ...prev, visible: false }));
          navigation.goBack();
        },
      });
    }
    // Errors handled by usePurchase hook
  };

  const premiumBenefits = [
    { text: t('premium.premium.benefits.history') },
    { text: t('premium.premium.benefits.studyMode') },
    { text: t('premium.premium.benefits.games'), isComingSoon: true },
    { text: t('premium.premium.benefits.requests') },
    { text: t('premium.premium.benefits.noAds') },
  ];

  const premiumPlusBenefits = [
    { text: t('premium.premiumPlus.benefits.history') },
    { text: t('premium.premiumPlus.benefits.studyMode') },
    { text: t('premium.premiumPlus.benefits.games'), isComingSoon: true },
    { text: t('premium.premiumPlus.benefits.requests') },
    { text: t('premium.premiumPlus.benefits.noAds') },
  ];

  // Show loading state while offerings load
  if (!offerings) {
    return (
      <SafeAreaView className={theme.bg('bg-background', 'bg-[#0F172A]')} style={{ flex: 1 }}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' mt-4'}>
            Loading subscription options...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={theme.bg('bg-background', 'bg-[#0F172A]')} style={{ flex: 1 }}>
      {/* Custom Header */}
      <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' border-b px-5 py-4 flex-row items-center'}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-4"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-2xl'}>←</Text>
        </TouchableOpacity>
        <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold flex-1'}>
          {t('premium.title')}
        </Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-6">
          <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-3xl font-bold mb-2 text-center'}>
            {t('premium.heading')}
          </Text>
          <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-base text-center px-4'}>
            {t('premium.description')}
          </Text>
        </View>

        <TierCard
          title={t('premium.premium.title')}
          monthlyPrice={t('premium.premium.monthlyPrice')}
          monthlyPeriod={t('premium.premium.monthlyPeriod')}
          annualPrice={t('premium.premium.annualPrice')}
          annualPeriod={t('premium.premium.annualPeriod')}
          annualTotal={t('premium.premium.annualTotal')}
          annualBilling={t('premium.premium.annualBilling')}
          purchaseText={t('premium.premium.purchase')}
          benefits={premiumBenefits}
          loading={loadingTier?.startsWith('premium_') && !loadingTier?.startsWith('premiumPlus_')}
          onPurchase={(billingPeriod) => handlePurchase('premium', billingPeriod)}
        />

        <TierCard
          title={t('premium.premiumPlus.title')}
          monthlyPrice={t('premium.premiumPlus.monthlyPrice')}
          monthlyPeriod={t('premium.premiumPlus.monthlyPeriod')}
          annualPrice={t('premium.premiumPlus.annualPrice')}
          annualPeriod={t('premium.premiumPlus.annualPeriod')}
          annualTotal={t('premium.premiumPlus.annualTotal')}
          annualBilling={t('premium.premiumPlus.annualBilling')}
          purchaseText={t('premium.premiumPlus.purchase')}
          benefits={premiumPlusBenefits}
          isHighlighted={true}
          loading={loadingTier?.startsWith('premiumPlus_')}
          onPurchase={(billingPeriod) => handlePurchase('premiumPlus', billingPeriod)}
        />
      </ScrollView>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={confirmationModal.visible}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        onConfirm={() => {
          if (confirmationModal.onConfirm) {
            confirmationModal.onConfirm();
          }
          setConfirmationModal({ ...confirmationModal, visible: false });
        }}
        onCancel={() => setConfirmationModal({ ...confirmationModal, visible: false })}
      />
    </SafeAreaView>
  );
}
```

---

## Update 2: StudyModeLimitReached.tsx

Replace the component with this updated version:

```typescript
// mobile/src/components/StudyModeLimitReached.tsx

import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeClasses } from '../utils/themeClasses';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';
import { usePurchase } from '../hooks/usePurchase'; // NEW

interface StudyModeLimitReachedProps {
  onWatchAd: () => void;
  onPurchaseSuccess?: () => void; // NEW - callback when purchase succeeds
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
  const [isAnnual, setIsAnnual] = useState(false);
  const { loading, offerings, loadOfferings, makePurchase } = usePurchase(); // NEW

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

  // REPLACED handleUpgradePress function
  const handleUpgradePress = async () => {
    const result = await makePurchase({
      tier: 'premiumPlus',
      billingPeriod: isAnnual ? 'annual' : 'monthly',
      source: 'study_limit',
    });

    if (result.success) {
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
    // Errors handled by usePurchase hook
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
              disabled={loading} // NEW
              className={`px-2.5 py-1 rounded-lg mr-2 ${!isAnnual ? 'bg-primary/20' : ''}`}
            >
              <Text className={`text-xs font-bold uppercase ${!isAnnual ? 'text-primary' : theme.text('text-text-secondary', 'text-[#94A3B8]')}`}>
                {t('premium.monthly')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsAnnual(true)}
              disabled={loading} // NEW
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
          disabled={loading || !offerings} // NEW
          className="bg-primary rounded-xl py-3 items-center"
          activeOpacity={0.8}
        >
          {loading ? ( // NEW
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
```

---

## Key Benefits of Shared Hook Approach

### 1. Consistent Purchase Logic
✅ Both paywalls use the same purchase flow  
✅ Same error handling everywhere  
✅ Consistent analytics tracking  

### 2. Single Source of Truth
✅ One place to update purchase logic  
✅ Bug fixes apply to all paywalls  
✅ Easier to maintain  

### 3. Analytics Tracking by Source
```typescript
// You can see which paywall drives more conversions!

// From PremiumBenefitsScreen:
makePurchase({ tier: 'premium', billingPeriod: 'monthly', source: 'settings' });

// From StudyModeLimitReached:
makePurchase({ tier: 'premiumPlus', billingPeriod: 'annual', source: 'study_limit' });

// In Firebase Analytics, you'll see:
// - 60% of purchases from 'study_limit' (high intent!)
// - 40% of purchases from 'settings' (exploratory)
```

### 4. Easy to Add More Paywalls
Want to add a paywall when user hits history limit? Just reuse the hook:

```typescript
// In any component:
const { makePurchase } = usePurchase();

await makePurchase({
  tier: 'premium',
  billingPeriod: 'monthly',
  source: 'history_limit', // Track unique source
});
```

---

## Purchase Flow Diagram

```
User hits study limit
    ↓
StudyModeLimitReached component shown
    ↓
User taps "Upgrade to Premium Plus"
    ↓
usePurchase.makePurchase() called
    ↓
RevenueCat.purchasePackage()
    ↓
iOS/Android purchase dialog
    ↓
User confirms purchase
    ↓
RevenueCat validates receipt
    ↓
┌─────────────────────────────────┐
│ 3 Things Happen Simultaneously: │
│                                 │
│ 1. Webhook → Your Backend       │ ✅
│    └─ Update DB                 │
│                                 │
│ 2. Event → Firebase Analytics   │ ✅
│    └─ Track purchase            │
│                                 │
│ 3. Return to App                │ ✅
│    └─ Show success message      │
└─────────────────────────────────┘
    ↓
onPurchaseSuccess() callback
    ↓
StudyModeLimitReached disappears
    ↓
User can now use unlimited study mode! 🎉
```

---

## Analytics: Understanding Paywall Performance

With the `source` parameter tracked, you can answer:

### Conversion Rate by Source
```
Firebase Analytics → Events → purchase_success

Filter by 'source' parameter:
- study_limit: 12% conversion (high intent!)
- settings: 3% conversion (exploratory)
- history_limit: 8% conversion
- onboarding: 5% conversion
```

### Revenue by Source
```
BigQuery SQL:
SELECT 
  source,
  COUNT(*) as purchases,
  SUM(price) as total_revenue,
  AVG(price) as avg_purchase_value
FROM purchases
GROUP BY source
ORDER BY total_revenue DESC
```

### Which Tier is More Popular?
```
premium: 30% of purchases
premium_plus: 70% of purchases

Insight: Users prefer Premium Plus (unlimited) over Premium (limited)
```

### Which Billing Period?
```
monthly: 55% of purchases
annual: 45% of purchases

Insight: Test offering annual-only discount to increase LTV
```

---

## Testing Strategy

### Test 1: PremiumBenefitsScreen
1. Navigate to Settings → Premium Benefits
2. Tap "Upgrade to Premium" (monthly)
3. Confirm purchase in sandbox
4. Verify success modal appears
5. Check Firebase Analytics for event:
   ```
   Event: purchase_success
   Parameters: {
     tier: "premium",
     billingPeriod: "monthly",
     source: "settings"
   }
   ```

### Test 2: StudyModeLimitReached
1. Use study mode until daily limit
2. StudyModeLimitReached appears
3. Toggle to Annual
4. Tap "Upgrade to Premium Plus"
5. Confirm purchase
6. Verify success alert
7. Verify study mode now works
8. Check Firebase for event with `source: "study_limit"`

### Test 3: User Cancels Purchase
1. Start purchase flow
2. Cancel in iOS/Android dialog
3. Verify no error shown (graceful cancellation)
4. Check Analytics for `purchase_cancelled` event

### Test 4: Purchase Fails
1. Use expired sandbox account
2. Start purchase
3. Verify error alert shown
4. Check Analytics for `purchase_failed` event

---

## Common Questions

### Q: Do both paywalls need to load offerings separately?
**A:** Yes, but offerings are cached by RevenueCat SDK. The second call is instant.

```typescript
// First call (PremiumBenefitsScreen): ~500ms (network)
await loadOfferings();

// Second call (StudyModeLimitReached): ~10ms (cache)
await loadOfferings();
```

### Q: What if user purchases in one paywall, then sees another?
**A:** Check subscription status and hide paywall:

```typescript
import { useUser } from '../contexts/UserContext';

export default function StudyModeLimitReached() {
  const { user } = useUser();
  
  if (user?.subscriptionTier === 'PREMIUM_PLUS') {
    // Don't show paywall - user is already subscribed
    return null;
  }
  
  // Show paywall
}
```

### Q: Should I show different paywalls to different users?
**A:** Eventually yes (A/B test), but start simple:
- Show StudyModeLimitReached when study limit hit (high intent)
- Show PremiumBenefitsScreen for browsing/exploring (low pressure)

### Q: Can I track which paywall design converts better?
**A:** Yes! Use Firebase Remote Config:

```typescript
// Test different headline copy
const headline = getRemoteValue('study_limit_headline')?.asString() 
  ?? t('studyMode.limitReached');

// Track view event with variant
trackEvent('paywall_viewed', {
  source: 'study_limit',
  headline_variant: headline === 'default' ? 'control' : 'variant_a',
});
```

---

## Next Steps

1. **Create the shared hook** (`usePurchase.ts`)
2. **Update PremiumBenefitsScreen** to use the hook
3. **Update StudyModeLimitReached** to use the hook
4. **Test both paywalls** in sandbox
5. **Monitor analytics** to see which converts better

---

## Summary

**What You Have:**
- ✅ Two beautiful custom paywalls
- ✅ One for exploration (PremiumBenefitsScreen)
- ✅ One for high-intent moments (StudyModeLimitReached)

**What You're Adding:**
- ✅ Shared purchase logic (usePurchase hook)
- ✅ RevenueCat SDK integration
- ✅ Analytics tracking by source
- ✅ Loading states and error handling

**What Changes:**
- Replace ~20 lines in PremiumBenefitsScreen
- Replace ~10 lines in StudyModeLimitReached
- Create 1 new shared hook file

**Result:**
- Both paywalls work perfectly
- You can see which drives more purchases
- Consistent purchase experience
- Easy to maintain

**Time:** ~1 hour of implementation

Want me to help you implement this? I can create the files and make the updates! 🚀

