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
import { usePurchase } from '../hooks/usePurchase';
import { useUser } from '../contexts/UserContext';

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
  loading?: boolean;
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
  loading = false,
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
            disabled={loading}
            className={`px-3 py-1.5 rounded-lg mr-2 ${!isAnnual ? 'bg-primary/20' : ''}`}
          >
            <Text className={`text-sm font-bold uppercase ${!isAnnual ? 'text-primary' : theme.text('text-text-secondary', 'text-[#94A3B8]')}`}>
              {t('premium.monthly')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsAnnual(true)}
            disabled={loading}
            className={`px-3 py-1.5 rounded-lg ${isAnnual ? 'bg-primary/20' : ''}`}
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
        onPress={() => onPurchase(isAnnual ? 'annual' : 'monthly')}
        disabled={loading}
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
        {loading ? (
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
  const { refreshUser } = useUser();
  const { loading, offerings, loadOfferings, makePurchase } = usePurchase();
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
      // Wait a moment for webhook to update database, then refresh from backend
      // Webhook typically processes within 1-2 seconds
      setTimeout(async () => {
        await refreshUser();
      }, 2000);

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
    // Errors are handled by usePurchase hook
  };

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
