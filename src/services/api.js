import axios from 'axios';
import { getItemAsync } from './../utils/storage';
import { Platform } from 'react-native';

// Use EXPO_PUBLIC_API_URL for production deployments (set in Expo dashboard or EAS)
// Fallback to local Wi-Fi IP address for local physical device testing
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.151.207.249:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.log('Error fetching token for request', error);
  }
  return config;
});

export default api;
