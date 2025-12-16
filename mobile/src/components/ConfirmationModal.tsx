import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeClasses } from '../utils/themeClasses';
import { useTranslation } from '../hooks/useTranslation';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  type?: 'default' | 'success' | 'error' | 'warning';
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  type = 'default',
  icon,
}: ConfirmationModalProps) {
  const { isDark } = useTheme();
  const theme = useThemeClasses();
  const { t } = useTranslation();

  // Determine icon and colors based on type
  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return {
          name: icon || 'checkmark-circle',
          color: '#10B981',
          bgColor: '#10b98120',
        };
      case 'error':
        return {
          name: icon || 'alert-circle',
          color: '#EF4444',
          bgColor: '#ef444420',
        };
      case 'warning':
        return {
          name: icon || 'warning',
          color: '#F59E0B',
          bgColor: '#f59e0b20',
        };
      default:
        return {
          name: icon || 'information-circle',
          color: isDark ? '#818CF8' : '#6366F1',
          bgColor: isDark ? '#818CF820' : '#6366F120',
        };
    }
  };

  const iconConfig = getIconConfig();
  const confirmButtonColor = type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : '#6366F1';

  const handleCancel = onCancel || onConfirm; // If no cancel handler, use confirm to close

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <Pressable
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onPress={handleCancel}
      >
        <Pressable
          className={theme.bg('bg-white', 'bg-gray-800') + ' rounded-2xl p-6 mx-8 max-w-sm w-full'}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="items-center mb-4">
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: iconConfig.bgColor }}
            >
              <Ionicons name={iconConfig.name as any} size={32} color={iconConfig.color} />
            </View>
            <Text className={theme.text('text-gray-900', 'text-white') + ' text-xl font-bold mb-2 text-center'}>
              {title}
            </Text>
            <Text className={theme.text('text-gray-600', 'text-gray-300') + ' text-base text-center'}>
              {message}
            </Text>
          </View>

          <View className={cancelText ? "flex-row gap-3" : ""}>
            {cancelText && (
              <TouchableOpacity
                className="flex-1 py-3 rounded-xl items-center border"
                style={{
                  borderColor: isDark ? '#4B5563' : '#D1D5DB',
                }}
                onPress={handleCancel}
              >
                <Text className={theme.text('text-gray-700', 'text-gray-300') + ' text-base font-semibold'}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className={cancelText ? "flex-1 py-3 rounded-xl items-center" : "w-full py-3 rounded-xl items-center"}
              style={{ backgroundColor: confirmButtonColor }}
              onPress={onConfirm}
            >
              <Text className="text-white text-base font-semibold">
                {confirmText || t('common.confirm')}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

