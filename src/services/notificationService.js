import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (error) {
  console.log('Failed to set notification handler (expected in Expo Go SDK 53+ Android)', error);
}

export async function registerForPushNotificationsAsync() {
  let token;

  // SDK 53: Push notifications are entirely removed from Expo Go on Android
  if (Constants.appOwnership === 'expo' && Platform.OS === 'android') {
    console.log('Push notifications are not supported in Expo Go on Android (SDK 53+). Please create a development build to test notifications.');
    return null;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      // Send token to backend
      await api.post('/device/register', {
        token: token,
        platform: Platform.OS
      });
      console.log('Registered Push Token with Backend:', token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }
  } catch (e) {
    console.log("Failed to register token with backend or setup notifications", e);
  }

  return token;
}
