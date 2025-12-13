import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useThemeClasses } from '../utils/themeClasses';
import { useTranslation } from '../hooks/useTranslation';

type Props = NativeStackScreenProps<RootStackParamList, 'Help'>;

export default function HelpScreen({ route }: Props) {
  const navigation = useNavigation();
  const theme = useThemeClasses();
  const { t } = useTranslation();

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
        <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold flex-1'}>{t('help.title')}</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-6">
          {/* Getting Started */}
          <View className="mb-6">
            <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-xl font-bold mb-4'}>{t('help.gettingStarted')}</Text>
            <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border p-5'}>
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base font-semibold mb-3'}>{t('help.howToUse')}</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 mb-4'}>
                {t('help.howToUseDescription')}
              </Text>
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base font-semibold mb-3'}>{t('help.playMode')}</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 mb-4'}>
                {t('help.playModeDescription')}
              </Text>
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base font-semibold mb-3'}>{t('help.studyMode')}</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6'}>
                {t('help.studyModeDescription')}
              </Text>
            </View>
          </View>

          {/* Frequently Asked Questions */}
          <View className="mb-6">
            <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-xl font-bold mb-4'}>{t('help.faq')}</Text>
            <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border overflow-hidden'}>
              <View className={theme.border('border-border', 'border-[#334155]') + ' p-5 border-b'}>
                <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base font-semibold mb-2'}>{t('help.changeLanguage')}</Text>
                <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6'}>
                  {t('help.changeLanguageAnswer')}
                </Text>
              </View>
              <View className={theme.border('border-border', 'border-[#334155]') + ' p-5 border-b'}>
                <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base font-semibold mb-2'}>{t('help.downloadSongs')}</Text>
                <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6'}>
                  {t('help.downloadSongsAnswer')}
                </Text>
              </View>
              <View className={theme.border('border-border', 'border-[#334155]') + ' p-5 border-b'}>
                <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base font-semibold mb-2'}>{t('help.saveProgress')}</Text>
                <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6'}>
                  {t('help.saveProgressAnswer')}
                </Text>
              </View>
              <View className="p-5">
                <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base font-semibold mb-2'}>{t('help.videoNotPlaying')}</Text>
                <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6'}>
                  {t('help.videoNotPlayingAnswer')}
                </Text>
              </View>
            </View>
          </View>

          {/* Contact Support */}
          <View className="mb-6">
            <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-xl font-bold mb-4'}>{t('help.contactSupport')}</Text>
            <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border p-5'}>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 mb-4'}>
                {t('help.contactSupportDescription')}
              </Text>
              <View className="flex-row items-center mb-3">
                <Ionicons name="mail" size={20} color="#6366F1" />
                <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-sm ml-3'}>{t('help.supportEmail')}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


