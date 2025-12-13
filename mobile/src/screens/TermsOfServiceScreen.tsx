import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'TermsOfService'>;

export default function TermsOfServiceScreen({ route }: Props) {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Custom Header */}
      <View className="bg-surface border-b border-border px-5 py-4 flex-row items-center">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-4"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className="text-2xl text-text-primary">←</Text>
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-text-primary flex-1">Terms of Service</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-6">
          <View className="bg-surface rounded-xl border border-border p-5">
            <Text className="text-xs text-text-muted mb-6">Last updated: {new Date().toLocaleDateString()}</Text>

            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">1. Acceptance of Terms</Text>
              <Text className="text-sm text-text-secondary leading-6">
                By accessing and using Easy Song, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">2. Use License</Text>
              <Text className="text-sm text-text-secondary leading-6 mb-3">
                Permission is granted to temporarily use Easy Song for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-2">
                • modify or copy the materials
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-2">
                • use the materials for any commercial purpose
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-2">
                • attempt to decompile or reverse engineer any software
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4">
                • remove any copyright or other proprietary notations
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">3. User Accounts</Text>
              <Text className="text-sm text-text-secondary leading-6 mb-3">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
              </Text>
              <Text className="text-sm text-text-secondary leading-6">
                You agree not to disclose your password to any third party and to take sole responsibility for any activities or actions under your account.
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">4. Content</Text>
              <Text className="text-sm text-text-secondary leading-6">
                Our service allows you to access educational content, including song lyrics, translations, and video content. All content provided through Easy Song is for educational purposes only. We do not claim ownership of any third-party content, including songs and videos, which are the property of their respective owners.
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">5. Prohibited Uses</Text>
              <Text className="text-sm text-text-secondary leading-6 mb-3">
                You may not use our service:
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-2">
                • In any way that violates any applicable law or regulation
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-2">
                • To transmit any malicious code or viruses
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-2">
                • To collect or track personal information of others
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4">
                • In any manner that could damage or impair the service
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">6. Termination</Text>
              <Text className="text-sm text-text-secondary leading-6">
                We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">7. Disclaimer</Text>
              <Text className="text-sm text-text-secondary leading-6">
                The information on this service is provided on an "as is" basis. To the fullest extent permitted by law, we exclude all representations, warranties, and conditions relating to our service and the use of this service.
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">8. Limitation of Liability</Text>
              <Text className="text-sm text-text-secondary leading-6">
                In no event shall Easy Song, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">9. Changes to Terms</Text>
              <Text className="text-sm text-text-secondary leading-6">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </Text>
            </View>

            <View>
              <Text className="text-lg font-bold text-text-primary mb-3">10. Contact Information</Text>
              <Text className="text-sm text-text-secondary leading-6">
                If you have any questions about these Terms of Service, please contact us at legal@easysong.com.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


