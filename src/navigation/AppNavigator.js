import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ProjectsScreen } from '../screens/ProjectsScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useAuth } from '../context/AuthContext';
import { TouchableOpacity, Text } from 'react-native';
import { User } from 'lucide-react-native';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { user, logout } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0F172A',
        },
        headerTintColor: '#FFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
      }}
    >
      {user ? (
        <>
          <Stack.Screen 
            name="Projects" 
            component={ProjectsScreen} 
            options={({ navigation }) => ({ 
              title: 'Survey Radar',
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                  <User color="#FFF" size={24} />
                </TouchableOpacity>
              )
            })}
          />
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen} 
            options={{ title: 'Project Dashboard' }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ title: 'Profile Settings' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
