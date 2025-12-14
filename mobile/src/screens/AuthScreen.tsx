import React, { useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import AuthDrawer from '../components/AuthDrawer';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export default function AuthScreen({ navigation }: Props) {
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
    navigation.goBack();
  };

  const handleSuccess = () => {
    navigation.replace('SongList');
  };

  return (
    <View style={{ flex: 1 }}>
      <AuthDrawer
        visible={visible}
        onClose={handleClose}
        initialMode="signup"
        onSuccess={handleSuccess}
      />
    </View>
  );
}
