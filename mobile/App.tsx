import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
// Initialize i18n before other imports that might use it
import './src/i18n/config';
import { UserProvider } from './src/contexts/UserContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SongListScreen from './src/screens/SongListScreen';
import SongDetailScreen from './src/screens/SongDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import UserProfileSettingsScreen from './src/screens/UserProfileSettingsScreen';
import HelpScreen from './src/screens/HelpScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import AboutScreen from './src/screens/AboutScreen';
import SongHistoryScreen from './src/screens/SongHistoryScreen';
import type { RootStackParamList } from './src/types/navigation';
import { hasCompletedOnboarding } from './src/utils/storage';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Simple wrapper - no need for dark class since we'll use conditional classes
function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

// Inner component that can use theme
function AppContent() {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Onboarding');

  useEffect(() => {
    const checkOnboarding = async () => {
      const completed = await hasCompletedOnboarding();
      setInitialRoute(completed ? 'SongList' : 'Onboarding');
      setIsLoading(false);
    };
    checkOnboarding();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#000' : '#fff' }}>
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
        />
        <Stack.Screen
          name="SongList"
          component={SongListScreen}
        />
        <Stack.Screen
          name="SongDetail"
          component={SongDetailScreen}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
        />
        <Stack.Screen
          name="UserProfileSettings"
          component={UserProfileSettingsScreen}
        />
        <Stack.Screen
          name="Help"
          component={HelpScreen}
        />
        <Stack.Screen
          name="TermsOfService"
          component={TermsOfServiceScreen}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
        />
        <Stack.Screen
          name="SongHistory"
          component={SongHistoryScreen}
        />
      </Stack.Navigator>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <ThemeProvider>
          <ThemeWrapper>
            <AppContent />
          </ThemeWrapper>
        </ThemeProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}

