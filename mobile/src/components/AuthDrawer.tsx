import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeClasses, cn } from '../utils/themeClasses';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../hooks/useUser';
import { registerUser, loginUser, requestMagicCode, verifyMagicCode } from '../utils/api';

type AuthMode = 'signup' | 'login' | 'magicCode';

interface AuthDrawerProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onSuccess?: () => void;
}

export default function AuthDrawer({ visible, onClose, initialMode = 'signup', onSuccess }: AuthDrawerProps) {
  const { t } = useTranslation();
  const theme = useThemeClasses();
  const { isDark } = useTheme();
  const { signIn } = useUser();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [magicCodeSource, setMagicCodeSource] = useState<'signup' | 'login'>(initialMode === 'login' ? 'login' : 'signup');
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicCode, setMagicCode] = useState(['', '', '', '', '', '']);
  const [codeSent, setCodeSent] = useState(false);
  const [showCodeSentModal, setShowCodeSentModal] = useState(false);
  const codeInputRefs = useRef<(TextInput | null)[]>([]);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ['90%'], []);

  // Handle sheet changes
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  // Show/hide bottom sheet based on visible prop
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
      // Reset form when opening
      setMode(initialMode);
      setMagicCodeSource(initialMode === 'login' ? 'login' : 'signup');
      setName('');
      setEmail('');
      setPassword('');
      setMagicCode(['', '', '', '', '', '']);
      setCodeSent(false);
      setErrors({});
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible, initialMode]);

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        onPress={onClose}
      />
    ),
    [onClose]
  );

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email || !validateEmail(email)) {
      newErrors.email = t('auth.errors.invalidEmail');
    }

    if (mode === 'signup') {
      if (!name || name.trim().length === 0) {
        newErrors.name = t('auth.errors.nameRequired');
      }
      if (!password || password.length < 8) {
        newErrors.password = t('auth.errors.passwordTooShort');
      }
    } else if (mode === 'login') {
      if (!password) {
        newErrors.password = t('auth.errors.passwordRequired');
      }
    } else if (mode === 'magicCode') {
      if (codeSent && magicCode.some(digit => !digit)) {
        newErrors.code = t('auth.errors.invalidCode');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await registerUser(email.trim(), password, name.trim());
      await signIn(email.trim(), password);
      onClose();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      setErrors({ submit: error.message || t('auth.errors.signupFailed') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await signIn(email.trim(), password);
      onClose();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      setErrors({ submit: error.message || t('auth.errors.loginFailed') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestMagicCode = async () => {
    if (!email || !validateEmail(email)) {
      setErrors({ email: t('auth.errors.invalidEmail') });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await requestMagicCode(email.trim(), magicCodeSource === 'signup');
      setCodeSent(true);
      setShowCodeSentModal(true);
      // Focus first input when code is sent
      setTimeout(() => {
        codeInputRefs.current[0]?.focus();
      }, 100);
    } catch (error: any) {
      setErrors({ submit: error.message || t('auth.errors.sendCodeFailed') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMagicCode = async () => {
    const codeString = magicCode.join('');
    if (!codeString || codeString.length !== 6) {
      setErrors({ code: t('auth.errors.invalidCode') });
      return;
    }
    await handleVerifyMagicCodeWithCode(codeString);
  };

  const handleVerifyMagicCodeWithCode = async (codeString: string) => {
    if (!codeString || codeString.length !== 6) {
      setErrors({ code: t('auth.errors.invalidCode') });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await verifyMagicCode(email.trim(), codeString, magicCodeSource === 'signup');
      // Magic code login creates a session, so we just need to check current user
      await signIn(email.trim(), 'magic-code-login'); // Special marker for magic code
      onClose();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      // If it's a signup flow and user already exists, show appropriate error
      if (magicCodeSource === 'signup' && error.message?.toLowerCase().includes('already exists')) {
        setErrors({ submit: t('auth.errors.userAlreadyExists') });
      } else {
        setErrors({ submit: error.message || t('auth.errors.invalidCode') });
      }
      // Clear code on error
      setMagicCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    // Only allow single digit
    const digit = value.replace(/[^0-9]/g, '').slice(0, 1);
    const newCode = [...magicCode];
    newCode[index] = digit;
    setMagicCode(newCode);

    // Clear error when typing
    if (errors.code) {
      setErrors({ ...errors, code: '' });
    }

    // Auto-advance to next input
    if (digit && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (digit && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        // Small delay to let the state update and last digit render
        setTimeout(() => {
          // Use the newCode directly instead of relying on state
          handleVerifyMagicCodeWithCode(fullCode);
        }, 100);
      }
    }
  };

  const handleCodeKeyPress = (index: number, key: string) => {
    // Handle backspace
    if (key === 'Backspace' && !magicCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const switchToPassword = () => {
    // Return to the mode we came from (signup or login)
    setMode(magicCodeSource);
    setCodeSent(false);
    setMagicCode(['', '', '', '', '', '']);
    setErrors({});
  };

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: isDark ? '#111827' : '#ffffff',
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#6B7280' : '#D1D5DB',
        }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            {/* Handle bar and close button container */}
            <View className="flex-row items-center justify-between px-4 pt-2 pb-4">
              <View className="flex-1" />
              <View className="absolute left-0 right-0 items-center">
                <View className={cn('w-12 h-1 rounded-full', theme.bg('bg-gray-300', 'bg-gray-600'))} />
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 items-center justify-center rounded-full"
                style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={isDark ? '#ffffff' : '#111827'}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View className="px-8 pt-4 pb-6">
                <View className="w-16 h-16 rounded-full items-center justify-center mb-6 self-center"
                  style={{ backgroundColor: '#667eea20' }}
                >
                  <Ionicons name="musical-notes" size={32} color="#667eea" />
                </View>

                <Text className={cn('text-3xl font-bold mb-2 text-center', theme.text('text-gray-900', 'text-white'))}>
                  {mode === 'signup' 
                    ? t('auth.signup.title') 
                    : mode === 'login' 
                    ? t('auth.login.title') 
                    : magicCodeSource === 'signup'
                    ? t('auth.magicCode.signupTitle')
                    : t('auth.magicCode.loginTitle')}
                </Text>
                <Text className={cn('text-base text-center', theme.text('text-gray-600', 'text-gray-400'))}>
                  {mode === 'signup' 
                    ? t('auth.signup.subtitle') 
                    : mode === 'login' 
                    ? t('auth.login.subtitle') 
                    : magicCodeSource === 'signup'
                    ? t('auth.magicCode.signupSubtitle')
                    : t('auth.magicCode.loginSubtitle')}
                </Text>
              </View>

              {/* Form */}
              <View className="px-8 flex-1">
                {mode === 'signup' && (
                  <View className="mb-4">
                    <Text className={cn('text-sm font-medium mb-2', theme.text('text-gray-700', 'text-gray-300'))}>
                      {t('auth.name')}
                    </Text>
                    <TextInput
                      className={cn(
                        'border rounded-xl px-4 py-3 text-base',
                        theme.bg('bg-white', 'bg-gray-800'),
                        theme.border('border-gray-300', 'border-gray-600'),
                        theme.text('text-gray-900', 'text-white'),
                        errors.name ? 'border-red-500' : ''
                      )}
                      placeholder={t('auth.namePlaceholder')}
                      placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                      value={name}
                      onChangeText={(text) => {
                        setName(text);
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                    {errors.name && (
                      <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>
                    )}
                  </View>
                )}

                <View className="mb-4">
                  <Text className={cn('text-sm font-medium mb-2', theme.text('text-gray-700', 'text-gray-300'))}>
                    {t('auth.email')}
                  </Text>
                  <TextInput
                    className={cn(
                      'border rounded-xl px-4 py-3 text-base',
                      theme.bg('bg-white', 'bg-gray-800'),
                      theme.border('border-gray-300', 'border-gray-600'),
                      theme.text('text-gray-900', 'text-white'),
                      errors.email ? 'border-red-500' : ''
                    )}
                    placeholder={t('auth.emailPlaceholder')}
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {errors.email && (
                    <Text className="text-red-500 text-sm mt-1">{errors.email}</Text>
                  )}
                  
                  {/* Magic code link - show on signup and login modes */}
                  {mode !== 'magicCode' && (
                    <TouchableOpacity
                      onPress={() => {
                        if (!email || !validateEmail(email)) {
                          setErrors({ email: t('auth.errors.invalidEmail') });
                          return;
                        }
                        setMagicCodeSource(mode); // Track where we came from
                        setMode('magicCode');
                        setCodeSent(false);
                        setMagicCode(['', '', '', '', '', '']);
                        setErrors({});
                      }}
                      className="mt-2"
                    >
                      <Text className={cn('text-sm', theme.text('text-indigo-600', 'text-indigo-400'))}>
                        {mode === 'signup' ? t('auth.signupWithMagicCode') : t('auth.loginWithMagicCode')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {mode === 'magicCode' ? (
                  <>
                    {!codeSent ? (
                      <TouchableOpacity
                        className="bg-indigo-600 py-4 rounded-xl items-center mb-4"
                        onPress={handleRequestMagicCode}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text className="text-white text-base font-semibold">
                            {t('auth.magicCode.sendCode')}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <>
                        <View className="mb-6">
                          <Text className={cn('text-sm font-medium mb-4 text-center', theme.text('text-gray-700', 'text-gray-300'))}>
                            {t('auth.magicCode.code')}
                          </Text>
                          <View className="flex-row justify-center gap-3">
                            {magicCode.map((digit, index) => (
                              <TextInput
                                key={index}
                                ref={(ref) => {
                                  codeInputRefs.current[index] = ref;
                                }}
                                className={cn(
                                  'w-12 h-14 border rounded-xl text-center text-2xl font-bold',
                                  theme.bg('bg-white', 'bg-gray-800'),
                                  theme.border('border-gray-300', 'border-gray-600'),
                                  theme.text('text-gray-900', 'text-white'),
                                  errors.code ? 'border-red-500' : '',
                                  digit ? theme.border('border-indigo-500', 'border-indigo-400') : ''
                                )}
                                value={digit}
                                onChangeText={(text) => handleCodeChange(index, text)}
                                onKeyPress={({ nativeEvent }) => handleCodeKeyPress(index, nativeEvent.key)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                              />
                            ))}
                          </View>
                          {errors.code && (
                            <Text className="text-red-500 text-sm mt-2 text-center">{errors.code}</Text>
                          )}
                        </View>

                        <TouchableOpacity
                          onPress={handleRequestMagicCode}
                          disabled={isLoading}
                          className="mb-4"
                        >
                          <Text className={cn('text-center text-sm', theme.text('text-indigo-600', 'text-indigo-400'))}>
                            {t('auth.magicCode.resend')}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <View className="mb-6">
                      <Text className={cn('text-sm font-medium mb-2', theme.text('text-gray-700', 'text-gray-300'))}>
                        {t('auth.password')}
                      </Text>
                      <TextInput
                        className={cn(
                          'border rounded-xl px-4 py-3 text-base',
                          theme.bg('bg-white', 'bg-gray-800'),
                          theme.border('border-gray-300', 'border-gray-600'),
                          theme.text('text-gray-900', 'text-white'),
                          errors.password ? 'border-red-500' : ''
                        )}
                        placeholder={t('auth.passwordPlaceholder')}
                        placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (errors.password) setErrors({ ...errors, password: '' });
                        }}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {errors.password && (
                        <Text className="text-red-500 text-sm mt-1">{errors.password}</Text>
                      )}
                      {mode === 'signup' && (
                        <Text className={cn('text-xs mt-1', theme.text('text-gray-500', 'text-gray-500'))}>
                          {t('auth.passwordHint')}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      className="bg-indigo-600 py-4 rounded-xl items-center mb-4"
                      onPress={mode === 'signup' ? handleSignup : handleLogin}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="text-white text-base font-semibold">
                          {mode === 'signup' ? t('auth.signup.button') : t('auth.login.button')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {errors.submit && (
                  <View className={cn('border rounded-xl p-4 mb-4', theme.bg('bg-red-50', 'bg-red-900/20'), theme.border('border-red-200', 'border-red-800'))}>
                    <Text className={cn('text-sm text-center', theme.text('text-red-600', 'text-red-400'))}>
                      {errors.submit}
                    </Text>
                  </View>
                )}

                {/* Switch between modes */}
                <View className="mt-6 pb-4">
                  {mode === 'magicCode' ? (
                    <TouchableOpacity onPress={switchToPassword}>
                      <Text className={cn('text-center text-base', theme.text('text-indigo-600', 'text-indigo-400'))}>
                        {t('auth.magicCode.usePassword')}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => {
                      setMode(mode === 'signup' ? 'login' : 'signup');
                      setErrors({});
                    }}>
                      <Text className={cn('text-center text-base', theme.text('text-gray-600', 'text-gray-400'))}>
                        {mode === 'signup'
                          ? t('auth.alreadyHaveAccount')
                          : t('auth.dontHaveAccount')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </BottomSheetView>
      </BottomSheet>

      {/* Code Sent Modal */}
      <Modal
        visible={showCodeSentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCodeSentModal(false)}
      >
        <Pressable
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onPress={() => setShowCodeSentModal(false)}
        >
          <Pressable
            className={cn('rounded-2xl p-6 mx-8', theme.bg('bg-white', 'bg-gray-800'))}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: '#10b98120' }}
              >
                <Ionicons name="mail" size={32} color="#10b981" />
              </View>
              <Text className={cn('text-xl font-bold mb-2', theme.text('text-gray-900', 'text-white'))}>
                {t('auth.magicCode.sent')}
              </Text>
              <Text className={cn('text-base text-center', theme.text('text-gray-600', 'text-gray-300'))}>
                {t('auth.magicCode.checkEmail')}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-indigo-600 py-3 rounded-xl items-center mt-4"
              onPress={() => setShowCodeSentModal(false)}
            >
              <Text className="text-white text-base font-semibold">
                {t('common.done')}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
