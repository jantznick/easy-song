import { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Pressable } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useUser } from '../hooks/useUser';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeClasses } from '../utils/themeClasses';
import { useTranslation } from '../hooks/useTranslation';
import AuthDrawer from '../components/AuthDrawer';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfileSettings'>;

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
}

function SettingItem({ icon, title, subtitle, onPress, showArrow = false }: SettingItemProps) {
  const theme = useThemeClasses();
  const { isDark } = useTheme();
  
  const content = (
    <View className={theme.border('border-border', 'border-[#334155]') + ' flex-row items-center py-3 px-5 border-b'}>
      <View className="w-8 items-center mr-3">
        <Ionicons name={icon} size={22} color="#6366F1" />
      </View>
      <View className="flex-1">
        <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base font-medium'}>{title}</Text>
        {subtitle && (
          <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm mt-0.5'}>{subtitle}</Text>
        )}
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={isDark ? '#94A3B8' : '#4B5563'} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useThemeClasses();
  
  return (
    <View className="mb-6">
      <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-xs font-semibold uppercase tracking-wide px-5 py-2'}>
        {title}
      </Text>
      <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border overflow-hidden'}>
        {children}
      </View>
    </View>
  );
}

export default function UserProfileSettingsScreen({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, updateProfile, isAuthenticated, signIn, signOut, songHistory, displayedHistory, totalHistoryCount } = useUser();
  
  // Check if user should see upgrade message
  const isFreeUser = isAuthenticated && user.subscriptionTier === 'FREE';
  const hasMoreThanLimit = totalHistoryCount !== null && totalHistoryCount > 10;
  const isGuest = !isAuthenticated;
  const { colors, isDark } = useTheme();
  const theme = useThemeClasses();
  const { t } = useTranslation();
  const [showNameModal, setShowNameModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [nameValue, setNameValue] = useState(user.name);
  const [emailValue, setEmailValue] = useState(user.email);
  const [isSaving, setIsSaving] = useState(false);

  // Sync modal values when user changes
  useEffect(() => {
    setNameValue(user.name);
    setEmailValue(user.email);
  }, [user.name, user.email]);

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
        <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold flex-1'}>{t('settings.title')}</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-6 pb-4">
          {/* User Profile Section */}
          <View className="mb-6">
            <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border overflow-hidden'}>
              <View className="flex-row items-center p-5">
                <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center mr-4">
                  <Ionicons name="person" size={32} color="#6366F1" />
                </View>
                <View className="flex-1">
                  <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold mb-1'}>
                    {user.name}
                  </Text>
                  <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm'}>
                    {isAuthenticated ? user.email : t('settings.profile.notSignedIn')}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Account Settings */}
          <SettingsSection title={t('settings.profile.account')}>
            <SettingItem
              icon="person"
              title={t('settings.profile.name')}
              subtitle={user.name}
              showArrow
              onPress={() => {
                setNameValue(user.name);
                setShowNameModal(true);
              }}
            />
            <SettingItem
              icon="mail"
              title={t('settings.profile.email')}
              subtitle={user.email}
              showArrow
              onPress={() => {
                setEmailValue(user.email);
                setShowEmailModal(true);
              }}
            />
            {isAuthenticated && (
              <SettingItem
                icon="lock-closed"
                title={t('settings.profile.changePassword')}
                showArrow
                onPress={() => {}}
              />
            )}
            {!isAuthenticated ? (
              <SettingItem
                icon="log-in"
                title={t('settings.profile.signIn')}
                subtitle={t('settings.profile.signInToSync')}
                showArrow
                onPress={() => {
                  setShowSignInModal(true);
                }}
              />
            ) : (
              <SettingItem
                icon="log-out"
                title={t('settings.profile.signOut')}
                subtitle={t('settings.profile.signOutOfAccount')}
                showArrow
                onPress={async () => {
                  try {
                    await signOut();
                  } catch (error) {
                    Alert.alert(t('common.error'), t('profile.failedToSignOut'));
                  }
                }}
              />
            )}
          </SettingsSection>

          {/* Song History */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-5 py-2">
              <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-xs font-semibold uppercase tracking-wide'}>
                {t('history.title')}
              </Text>
            </View>
            <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' rounded-xl border overflow-hidden'}>
              {displayedHistory.length === 0 ? (
                <View className="py-8 px-5 items-center">
                  <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-sm'}>
                    {t('history.noHistory')}
                  </Text>
                </View>
              ) : (
                displayedHistory.slice(0, 3).map((item, index, array) => (
                <TouchableOpacity
                  key={`${item.videoId}-${item.date}-${item.time}-${index}`}
                  activeOpacity={0.7}
                  onPress={() => {
                    const initialTab = item.mode === 'Play Mode' ? 'PlayMode' : 'StudyMode';
                    navigation.dispatch(
                      CommonActions.reset({
                        index: 1,
                        routes: [
                          { name: 'SongList' },
                          { name: 'SongDetail', params: { videoId: item.videoId, initialTab } },
                        ],
                      })
                    );
                  }}
                  className={`flex-row items-center py-4 px-5 ${
                    index < array.length - 1 ? theme.border('border-border', 'border-[#334155]') + ' border-b' : ''
                  }`}
                >
                  <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                    <Ionicons
                      name={item.mode === 'Play Mode' ? 'play-circle' : 'school'}
                      size={20}
                      color="#6366F1"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base font-medium mb-1'}>
                      {item.song}
                    </Text>
                    <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm mb-1'}>
                      {item.artist}
                    </Text>
                    <View className="flex-row items-center">
                      <View className="bg-primary/10 px-2 py-0.5 rounded mr-2">
                        <Text className="text-xs font-medium text-primary">
                          {item.mode === 'Play Mode' ? t('history.playMode') : t('history.studyMode')}
                        </Text>
                      </View>
                      <Text className={theme.text('text-text-muted', 'text-[#64748B]') + ' text-xs'}>
                        {item.date} • {item.time}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={isDark ? '#94A3B8' : '#4B5563'} />
                </TouchableOpacity>
                ))
              )}
              
              {/* Upgrade Message for Free Users and Guests */}
              {((isFreeUser && hasMoreThanLimit) || isGuest) && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('PremiumBenefits')}
                  activeOpacity={0.8}
                >
                  <View 
                    className={theme.bg('bg-primary/10', 'bg-primary/20') + ' border-t px-4 py-4'}
                    style={{
                      borderTopWidth: 2,
                      borderTopColor: '#6366F1',
                      borderLeftWidth: 0,
                      borderRightWidth: 0,
                      borderBottomWidth: 0,
                    }}
                  >
                    <View className="flex-row items-start">
                      <View className="mr-3 mt-0.5">
                        <Ionicons name="star" size={20} color="#6366F1" />
                      </View>
                      <View className="flex-1">
                        <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-base font-bold mb-1'}>
                          {t('history.upgradeTitle')}
                        </Text>
                        <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-sm mb-2'}>
                          {isGuest
                            ? t('history.guestUpgradeMessage')
                            : isFreeUser && hasMoreThanLimit 
                              ? `${t('history.upgradeMessage')} You're viewing 10 of ${totalHistoryCount} songs.`
                              : t('history.upgradeMessage')
                          }
                        </Text>
                        <Text className="text-primary text-sm font-semibold">
                          {t('history.clickToUpgrade')} →
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              
              {displayedHistory.length > 0 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('SongHistory')}
                  activeOpacity={0.7}
                  className={theme.border('border-border', 'border-[#334155]') + ' flex-row items-center justify-center py-4 px-5 border-t'}
                >
                  <Text className="text-base font-medium mr-2 text-primary">{t('history.viewAll')}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#6366F1" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal
        visible={showNameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <Pressable 
            style={{ flex: 1 }}
            onPress={() => setShowNameModal(false)}
          />
          <View style={{ 
            backgroundColor: colors.surface, 
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: 40,
          }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors['text-primary'] }}>{t('profile.editName')}</Text>
              <TouchableOpacity onPress={() => setShowNameModal(false)}>
                <Ionicons name="close" size={24} color={colors['text-primary']} />
              </TouchableOpacity>
            </View>
            <TextInput
              value={nameValue}
              onChangeText={setNameValue}
              placeholder={t('profile.enterName')}
              placeholderTextColor={colors['text-muted']}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: colors['text-primary'],
                backgroundColor: colors.background,
                marginBottom: 20,
              }}
              autoFocus
            />
            <TouchableOpacity
              onPress={async () => {
                if (!nameValue.trim()) {
                  Alert.alert(t('common.error'), t('profile.nameCannotBeEmpty'));
                  return;
                }
                setIsSaving(true);
                try {
                  await updateProfile({ name: nameValue.trim() });
                  setShowNameModal(false);
                } catch (error) {
                  Alert.alert(t('common.error'), t('profile.failedToUpdateName'));
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              style={{
                backgroundColor: colors.primary,
                padding: 14,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Email Modal */}
      <Modal
        visible={showEmailModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <Pressable 
            style={{ flex: 1 }}
            onPress={() => setShowEmailModal(false)}
          />
          <View style={{ 
            backgroundColor: colors.surface, 
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: 40,
          }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors['text-primary'] }}>{t('profile.editEmail')}</Text>
              <TouchableOpacity onPress={() => setShowEmailModal(false)}>
                <Ionicons name="close" size={24} color={colors['text-primary']} />
              </TouchableOpacity>
            </View>
            <TextInput
              value={emailValue}
              onChangeText={setEmailValue}
              placeholder={t('profile.enterEmail')}
              placeholderTextColor={colors['text-muted']}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                color: colors['text-primary'],
                backgroundColor: colors.background,
                marginBottom: 20,
              }}
              autoFocus
            />
            <TouchableOpacity
              onPress={async () => {
                if (!emailValue.trim()) {
                  Alert.alert(t('common.error'), t('profile.emailCannotBeEmpty'));
                  return;
                }
                // Basic email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailValue.trim())) {
                  Alert.alert(t('common.error'), t('profile.invalidEmail'));
                  return;
                }
                setIsSaving(true);
                try {
                  await updateProfile({ email: emailValue.trim() });
                  setShowEmailModal(false);
                } catch (error) {
                  Alert.alert(t('common.error'), t('profile.failedToUpdateEmail'));
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              style={{
                backgroundColor: colors.primary,
                padding: 14,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sign In Drawer */}
      <AuthDrawer
        visible={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        initialMode="login"
        onSuccess={() => {
          setShowSignInModal(false);
        }}
      />
    </SafeAreaView>
  );
}


