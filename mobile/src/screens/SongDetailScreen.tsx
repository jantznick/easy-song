import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList, SongDetailTabParamList } from '../types/navigation';
import PlayModeScreen from './PlayModeScreen';
import StudyModeScreen from './StudyModeScreen';
import SettingsScreen from './SettingsScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'SongDetail'>;

const Tab = createBottomTabNavigator<SongDetailTabParamList>();

export default function SongDetailScreen({ route }: Props) {
  const { videoId } = route.params;
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1E293B',
          borderTopColor: '#334155',
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 12,
          height: 60 + Math.max(insets.bottom, 12),
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="PlayMode"
        component={PlayModeScreen}
        initialParams={{ videoId }}
        options={{
          tabBarLabel: 'Play',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-circle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="StudyMode"
        component={StudyModeScreen}
        initialParams={{ videoId }}
        options={{
          tabBarLabel: 'Study',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        initialParams={{ videoId }}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

