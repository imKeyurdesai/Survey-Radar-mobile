import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const getItemAsync = async (key) => {
  if (isWeb) {
    try {
      return localStorage.getItem(key);
    } catch (_e) {
      return null;
    }
  }
  return await SecureStore.getItemAsync(key);
};

export const setItemAsync = async (key, value) => {
  if (isWeb) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.log('Local storage error', e);
    }
    return;
  }
  return await SecureStore.setItemAsync(key, value);
};

export const deleteItemAsync = async (key) => {
  if (isWeb) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.log('Local storage error', e);
    }
    return;
  }
  return await SecureStore.deleteItemAsync(key);
};
