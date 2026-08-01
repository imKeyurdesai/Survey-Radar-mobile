import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ProjectsScreen } from '../screens/ProjectsScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { useAuth } from '../context/AuthContext';
import { TouchableOpacity, Text } from 'react-native';

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
            options={{ 
              title: 'Survey Radar',
              headerRight: () => (
                <TouchableOpacity onPress={logout}>
                  <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Logout</Text>
                </TouchableOpacity>
              )
            }}
          />
          <Stack.Screen 
            name="Dashboard" 
            component={DashboardScreen} 
            options={{ title: 'Project Dashboard' }}
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
