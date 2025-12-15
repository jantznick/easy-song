import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../hooks/useUser';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeClasses } from '../utils/themeClasses';
import { useTranslation } from '../hooks/useTranslation';
import { verifyEmail, resendVerificationCode } from '../utils/api';

export default function EmailVerificationBanner() {
  const { user, isAuthenticated, refreshUser } = useUser();
  const { isDark } = useTheme();
  const theme = useThemeClasses();
  const { t } = useTranslation();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const codeInputRefs = useRef<(TextInput | null)[]>([]);

  // Don't show banner if user is not authenticated or email is already verified
  if (!isAuthenticated || user.emailVerified) {
    return null;
  }

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(0, 1);
    const newCode = [...verificationCode];
    newCode[index] = digit;
    setVerificationCode(newCode);

    // Auto-advance to next input
    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (digit && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerifyCode(fullCode);
      }
    }
  };

  const handleCodeKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (code?: string) => {
    const codeString = code || verificationCode.join('');
    if (!codeString || codeString.length !== 6) {
      Alert.alert(t('common.error'), t('auth.errors.invalidCode'));
      return;
    }

    setIsVerifying(true);
    try {
      await verifyEmail(codeString);
      await refreshUser(); // Refresh to update emailVerified status
      setShowVerificationModal(false);
      setVerificationCode(['', '', '', '', '', '']);
      Alert.alert(t('common.success'), t('auth.emailVerified'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || t('auth.errors.verificationFailed'));
      setVerificationCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      await resendVerificationCode();
      Alert.alert(t('common.success'), t('auth.verificationCodeResent'));
      setVerificationCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message || t('auth.errors.resendFailed'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <View
        className={theme.bg('bg-yellow-50', 'bg-yellow-900/20') + ' ' + theme.border('border-yellow-200', 'border-yellow-800') + ' border-b px-4 py-3'}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-3">
            <Ionicons name="mail-outline" size={20} color={isDark ? '#FCD34D' : '#D97706'} style={{ marginRight: 8 }} />
            <Text className={theme.text('text-yellow-800', 'text-yellow-200') + ' text-sm flex-1'}>
              {t('auth.emailVerification.pleaseVerify')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowVerificationModal(true)}
            className="bg-yellow-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white text-sm font-semibold">
              {t('auth.emailVerification.verify')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Verification Modal */}
      <Modal
        visible={showVerificationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVerificationModal(false)}
      >
        <Pressable
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onPress={() => setShowVerificationModal(false)}
        >
          <Pressable
            className={theme.bg('bg-white', 'bg-gray-800') + ' rounded-2xl p-6 mx-8 max-w-sm w-full'}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className={theme.text('text-gray-900', 'text-white') + ' text-xl font-bold'}>
                {t('auth.emailVerification.title')}
              </Text>
              <TouchableOpacity onPress={() => setShowVerificationModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={isDark ? '#ffffff' : '#111827'}
                />
              </TouchableOpacity>
            </View>

            <Text className={theme.text('text-gray-600', 'text-gray-300') + ' text-sm mb-6'}>
              {t('auth.emailVerification.description').replace('{email}', user.email)}
            </Text>

            <View className="mb-6">
              <Text className={theme.text('text-gray-700', 'text-gray-300') + ' text-sm font-medium mb-4 text-center'}>
                {t('auth.magicCode.code')}
              </Text>
              <View className="flex-row justify-center gap-3">
                {verificationCode.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      codeInputRefs.current[index] = ref;
                    }}
                    className={theme.bg('bg-white', 'bg-gray-800') + ' ' + theme.border('border-gray-300', 'border-gray-600') + ' ' + theme.text('text-gray-900', 'text-white') + ' w-12 h-14 border rounded-xl text-center text-2xl font-bold'}
                    style={digit ? { borderColor: isDark ? '#818CF8' : '#6366F1' } : {}}
                    value={digit}
                    onChangeText={(text) => handleCodeChange(index, text)}
                    onKeyPress={({ nativeEvent }) => handleCodeKeyPress(index, nativeEvent.key)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!isVerifying}
                  />
                ))}
              </View>
            </View>

            <TouchableOpacity
              className="bg-indigo-600 py-3 rounded-xl items-center mb-3"
              onPress={() => handleVerifyCode()}
              disabled={isVerifying || verificationCode.some(d => !d)}
            >
              {isVerifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  {t('auth.emailVerification.verify')}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResendCode}
              disabled={isResending}
              className="py-2"
            >
              {isResending ? (
                <ActivityIndicator color={isDark ? '#818CF8' : '#6366F1'} />
              ) : (
                <Text className={theme.text('text-indigo-600', 'text-indigo-400') + ' text-center text-sm'}>
                  {t('auth.emailVerification.resend')}
                </Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
