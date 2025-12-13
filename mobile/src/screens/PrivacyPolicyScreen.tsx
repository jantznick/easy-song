import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useThemeClasses } from '../utils/themeClasses';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

export default function PrivacyPolicyScreen({ route }: Props) {
  const navigation = useNavigation();
  const theme = useThemeClasses();

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
        <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold flex-1'}>Privacy Policy</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-6">
          <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border p-5'}>
            <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-xs mb-6'}>Last updated: {new Date().toLocaleDateString()}</Text>

            <View className="mb-6">
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6'}>
                At Easy Song, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
              </Text>
            </View>

            <View className="mb-6">
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-bold mb-3'}>1. Information We Collect</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 mb-3'}>
                We collect information that you provide directly to us, including:
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 ml-4 mb-2'}>
                • Account information (name, email address, password)
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 ml-4 mb-2'}>
                • Profile information and preferences
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 ml-4 mb-3'}>
                • Learning progress and activity data
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6'}>
                We also automatically collect certain information about your device, including device identifiers, operating system, and usage patterns.
              </Text>
            </View>

            <View className="mb-6">
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-bold mb-3'}>2. How We Use Your Information</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 mb-3'}>
                We use the information we collect to:
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 ml-4 mb-2'}>
                • Provide, maintain, and improve our services
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 ml-4 mb-2'}>
                • Personalize your learning experience
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 ml-4 mb-2'}>
                • Track your progress and sync across devices
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 ml-4 mb-2'}>
                • Send you technical notices and support messages
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 ml-4'}>
                • Respond to your comments and questions
              </Text>
            </View>

            <View className="mb-6">
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-bold mb-3'}>3. Information Sharing and Disclosure</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 mb-3'}>
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 ml-4 mb-2'}>
                • With your consent
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 ml-4 mb-2'}>
                • To comply with legal obligations
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 ml-4 mb-2'}>
                • To protect our rights and safety
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 ml-4'}>
                • With service providers who assist in operating our app
              </Text>
            </View>

            <View className="mb-6">
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-bold mb-3'}>4. Data Security</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6'}>
                We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </Text>
            </View>

            <View className="mb-6">
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-bold mb-3'}>5. Third-Party Services</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6'}>
                Our app may contain links to third-party websites or services, such as YouTube for video content. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.
              </Text>
            </View>

            <View className="mb-6">
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-bold mb-3'}>6. Children's Privacy</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6'}>
                Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </Text>
            </View>

            <View className="mb-6">
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-bold mb-3'}>7. Your Rights</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 mb-3'}>
                You have the right to:
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 ml-4 mb-2'}>
                • Access and receive a copy of your personal data
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 ml-4 mb-2'}>
                • Rectify inaccurate or incomplete data
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 ml-4 mb-2'}>
                • Request deletion of your personal data
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 ml-4'}>
                • Object to or restrict processing of your data
              </Text>
            </View>

            <View className="mb-6">
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-bold mb-3'}>8. Data Retention</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6'}>
                We retain your personal information for as long as necessary to provide our services and fulfill the purposes described in this policy. When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal purposes.
              </Text>
            </View>

            <View className="mb-6">
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-bold mb-3'}>9. Changes to This Policy</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6'}>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </Text>
            </View>

            <View>
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-bold mb-3'}>10. Contact Us</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6'}>
                If you have any questions about this Privacy Policy, please contact us at privacy@easysong.com.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


