import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useThemeClasses } from '../utils/themeClasses';
import { useTranslation } from '../hooks/useTranslation';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

interface VersionItemProps {
  version: string;
  date: string;
  changes: string[];
}

function VersionItem({ version, date, changes }: VersionItemProps) {
  const theme = useThemeClasses();
  
  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-bold'}>{t('common.version')} {version}</Text>
        <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-sm'}>{date}</Text>
      </View>
      <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border p-4'}>
        {changes.map((change, index) => (
          <View key={index} className="flex-row items-start mb-2">
            <Text className="text-primary mr-2 mt-1">•</Text>
            <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm flex-1 leading-6'}>{change}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AboutScreen({ route }: Props) {
  const navigation = useNavigation();
  const theme = useThemeClasses();
  const { t } = useTranslation();

  const versions = [
    {
      version: t('about.version1_0_0'),
      date: t('about.version1_0_0Date'),
      changes: t('about.version1_0_0Changes', { returnObjects: true }) as string[],
    },
    {
      version: t('about.version0_9_0'),
      date: t('about.version0_9_0Date'),
      changes: t('about.version0_9_0Changes', { returnObjects: true }) as string[],
    },
    {
      version: t('about.version0_8_0'),
      date: t('about.version0_8_0Date'),
      changes: t('about.version0_8_0Changes', { returnObjects: true }) as string[],
    },
  ];

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
        <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold flex-1'}>{t('about.title')}</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-6">
          {/* App Info */}
          <View className="mb-6">
            <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border p-6 items-center'}>
              <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-4">
                <Ionicons name="musical-notes" size={40} color="#6366F1" />
              </View>
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-2xl font-bold mb-2'}>{t('about.appName')}</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-base mb-4'}>{t('about.version')}</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm text-center leading-6'}>
                {t('about.description')}
              </Text>
            </View>
          </View>

          {/* Developer Studio Info */}
          <View className="mb-6">
            <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-xl font-bold mb-4'}>{t('about.developmentStudio')}</Text>
            <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border p-5'}>
              <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold mb-3'}>{t('about.studioName')}</Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 mb-4'}>
                {t('about.studioDescription')}
              </Text>
              <View>
                <View className="flex-row items-center mb-3">
                  <Ionicons name="mail" size={20} color="#6366F1" />
                  <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-sm ml-3'}>{t('about.contactEmail')}</Text>
                </View>
                <View className="flex-row items-center mb-3">
                  <Ionicons name="globe" size={20} color="#6366F1" />
                  <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-sm ml-3'}>{t('about.website')}</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="logo-twitter" size={20} color="#6366F1" />
                  <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-sm ml-3'}>{t('about.twitter')}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Version History */}
          <View className="mb-6">
            <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-xl font-bold mb-4'}>{t('about.versionHistory')}</Text>
            {versions.map((version, index) => (
              <VersionItem
                key={index}
                version={version.version}
                date={version.date}
                changes={version.changes}
              />
            ))}
          </View>

          {/* Credits */}
          <View className="mb-6">
            <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-xl font-bold mb-4'}>{t('about.credits')}</Text>
            <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border p-5'}>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6 mb-3'}>
                {t('about.creditsDescription')}
              </Text>
              <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm leading-6'}>
                {t('about.creditsDescription2')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

