import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../hooks/useUser';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeClasses } from '../utils/themeClasses';
import { useTranslation } from '../hooks/useTranslation';
import { verifyEmail, resendVerificationCode } from '../utils/api';
import ConfirmationModal from './ConfirmationModal';

export default function EmailVerificationBanner() {
  const { user, isAuthenticated, refreshUser } = useUser();
  const { isDark } = useTheme();
  const theme = useThemeClasses();
  const { t } = useTranslation();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'default' | 'success' | 'error' | 'warning';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'default',
  });
  const codeInputRefs = useRef<(TextInput | null)[]>([]);

  // Auto-dismiss resend message after 10 seconds
  useEffect(() => {
    if (resendMessage) {
      const timer = setTimeout(() => {
        setResendMessage(null);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [resendMessage]);

  // Don't show banner if user is not authenticated, email is already verified, or banner is dismissed
  if (!isAuthenticated || user.emailVerified || isBannerDismissed) {
    return null;
  }

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(0, 1);
    const newCode = [...verificationCode];
    newCode[index] = digit;
    setVerificationCode(newCode);
    
    // Clear resend message when user starts typing
    if (resendMessage) {
      setResendMessage(null);
    }

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
      setConfirmationModal({
        visible: true,
        title: t('common.error'),
        message: t('auth.errors.invalidCode'),
        type: 'error',
      });
      return;
    }

    setIsVerifying(true);
    try {
      await verifyEmail(codeString);
      await refreshUser(); // Refresh to update emailVerified status
      setShowVerificationModal(false);
      setVerificationCode(['', '', '', '', '', '']);
      setConfirmationModal({
        visible: true,
        title: t('common.success'),
        message: t('auth.emailVerification.emailVerified'),
        type: 'success',
      });
    } catch (error: any) {
      setConfirmationModal({
        visible: true,
        title: t('common.error'),
        message: error?.message || t('auth.errors.verificationFailed'),
        type: 'error',
      });
      setVerificationCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setResendMessage(null); // Clear any previous message
    try {
      await resendVerificationCode();
      setResendMessage({
        type: 'success',
        text: t('auth.emailVerification.verificationCodeResent'),
      });
      setVerificationCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } catch (error: any) {
      setResendMessage({
        type: 'error',
        text: error?.message || t('auth.errors.resendFailed'),
      });
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
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setShowVerificationModal(true)}
              className="bg-yellow-600 px-4 py-2 rounded-lg"
            >
              <Text className="text-white text-sm font-semibold">
                {t('auth.emailVerification.verify')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsBannerDismissed(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="p-1"
            >
              <Ionicons
                name="close"
                size={20}
                color={isDark ? '#FCD34D' : '#D97706'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Verification Modal */}
      <Modal
        visible={showVerificationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowVerificationModal(false);
          setResendMessage(null); // Clear message when modal closes
        }}
      >
        <Pressable
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onPress={() => {
            setShowVerificationModal(false);
            setResendMessage(null); // Clear message when modal closes
          }}
        >
          <Pressable
            className={theme.bg('bg-white', 'bg-gray-800') + ' rounded-2xl p-6 mx-8 max-w-sm w-full'}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className={theme.text('text-gray-900', 'text-white') + ' text-xl font-bold'}>
                {t('auth.emailVerification.title')}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowVerificationModal(false);
                setResendMessage(null); // Clear message when modal closes
              }}>
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

            {/* Inline resend message */}
            {resendMessage && (
              <View className={`mb-3 p-3 rounded-lg flex-row items-center ${
                resendMessage.type === 'success' 
                  ? (isDark ? 'bg-green-900/30' : 'bg-green-50') 
                  : (isDark ? 'bg-red-900/30' : 'bg-red-50')
              }`}>
                <Ionicons
                  name={resendMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                  size={20}
                  color={resendMessage.type === 'success' ? '#10B981' : '#EF4444'}
                  style={{ marginRight: 8 }}
                />
                <Text className={`text-sm flex-1 ${
                  resendMessage.type === 'success'
                    ? (isDark ? 'text-green-300' : 'text-green-800')
                    : (isDark ? 'text-red-300' : 'text-red-800')
                }`}>
                  {resendMessage.text}
                </Text>
              </View>
            )}

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

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={confirmationModal.visible}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        confirmText={t('common.ok')}
        onConfirm={() => setConfirmationModal({ ...confirmationModal, visible: false })}
      />
    </>
  );
}
