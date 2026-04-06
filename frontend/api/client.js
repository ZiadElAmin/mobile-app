import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import API_BASE_URL, { CONFIG } from '../config';

let memoryStore = {};

const getSecureItemAsync = async (key) => {
    if (Platform.OS === 'web') {
        return localStorage.getItem(key);
    }
    try {
        const val = await Promise.race([
            SecureStore.getItemAsync(key),
            new Promise((_, reject) => setTimeout(() => reject('SecureStore timeout'), 2000))
        ]);
        return val !== null ? val : memoryStore[key];
    } catch (error) {
        console.warn('SecureStore GET error/timeout, using memory fallback:', error);
        return memoryStore[key];
    }
};

const setSecureItemAsync = async (key, value) => {
    if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
    } else {
        memoryStore[key] = value;
        try {
            await Promise.race([
                SecureStore.setItemAsync(key, value),
                new Promise((_, reject) => setTimeout(() => reject('SecureStore timeout'), 2000))
            ]);
        } catch (error) {
            console.warn('SecureStore SET error/timeout:', error);
        }
    }
};

const deleteSecureItemAsync = async (key) => {
    if (Platform.OS === 'web') {
        localStorage.removeItem(key);
    } else {
        delete memoryStore[key];
        try {
            await Promise.race([
                SecureStore.deleteItemAsync(key),
                new Promise((_, reject) => setTimeout(() => reject('SecureStore timeout'), 2000))
            ]);
        } catch (error) {
            console.warn('SecureStore DELETE error/timeout:', error);
        }
    }
};
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        try {
            const token = await getSecureItemAsync('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            await deleteSecureItemAsync('userToken');
        }

        return Promise.reject(error);
    }
);

export const setAuthToken = async (token) => {
    await setSecureItemAsync('userToken', token);
};

export const clearAuthToken = async () => {
    await deleteSecureItemAsync('userToken');
};

export default api;
