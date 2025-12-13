import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './global.css';
import SongListScreen from './src/screens/SongListScreen';
import SongDetailScreen from './src/screens/SongDetailScreen';
import UserProfileSettingsScreen from './src/screens/UserProfileSettingsScreen';
import HelpScreen from './src/screens/HelpScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import AboutScreen from './src/screens/AboutScreen';
import type { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="SongList"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="SongList"
            component={SongListScreen}
          />
                  <Stack.Screen
                    name="SongDetail"
                    component={SongDetailScreen}
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
                </Stack.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

