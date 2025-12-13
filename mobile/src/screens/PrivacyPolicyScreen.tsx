import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

export default function PrivacyPolicyScreen({ route }: Props) {
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
        <Text className="text-lg font-semibold text-text-primary flex-1">Privacy Policy</Text>
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
              <Text className="text-sm text-text-secondary leading-6">
                At Easy Song, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">1. Information We Collect</Text>
              <Text className="text-sm text-text-secondary leading-6 mb-3">
                We collect information that you provide directly to us, including:
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-2">
                • Account information (name, email address, password)
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-2">
                • Profile information and preferences
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-3">
                • Learning progress and activity data
              </Text>
              <Text className="text-sm text-text-secondary leading-6">
                We also automatically collect certain information about your device, including device identifiers, operating system, and usage patterns.
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">2. How We Use Your Information</Text>
              <Text className="text-sm text-text-secondary leading-6 mb-3">
                We use the information we collect to:
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-2">
                • Provide, maintain, and improve our services
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-2">
                • Personalize your learning experience
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-2">
                • Track your progress and sync across devices
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-2">
                • Send you technical notices and support messages
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4">
                • Respond to your comments and questions
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">3. Information Sharing and Disclosure</Text>
              <Text className="text-sm text-text-secondary leading-6 mb-3">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-2">
                • With your consent
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-2">
                • To comply with legal obligations
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-2">
                • To protect our rights and safety
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4">
                • With service providers who assist in operating our app
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">4. Data Security</Text>
              <Text className="text-sm text-text-secondary leading-6">
                We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">5. Third-Party Services</Text>
              <Text className="text-sm text-text-secondary leading-6">
                Our app may contain links to third-party websites or services, such as YouTube for video content. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">6. Children's Privacy</Text>
              <Text className="text-sm text-text-secondary leading-6">
                Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">7. Your Rights</Text>
              <Text className="text-sm text-text-secondary leading-6 mb-3">
                You have the right to:
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-2">
                • Access and receive a copy of your personal data
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-2">
                • Rectify inaccurate or incomplete data
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4 mb-2">
                • Request deletion of your personal data
              </Text>
              <Text className="text-sm text-text-secondary leading-6 ml-4">
                • Object to or restrict processing of your data
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">8. Data Retention</Text>
              <Text className="text-sm text-text-secondary leading-6">
                We retain your personal information for as long as necessary to provide our services and fulfill the purposes described in this policy. When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal purposes.
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-bold text-text-primary mb-3">9. Changes to This Policy</Text>
              <Text className="text-sm text-text-secondary leading-6">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </Text>
            </View>

            <View>
              <Text className="text-lg font-bold text-text-primary mb-3">10. Contact Us</Text>
              <Text className="text-sm text-text-secondary leading-6">
                If you have any questions about this Privacy Policy, please contact us at privacy@easysong.com.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


