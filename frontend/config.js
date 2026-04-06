import { Platform } from 'react-native';

const getApiUrl = () => {
    if (Platform.OS === 'web') {
        return 'http://localhost:5000/api';
    }
    // Use the physical machine IP for both iOS and Android
    return 'http://192.168.1.6:5000/api';
};

const API_BASE_URL = getApiUrl();

export const CONFIG = {
    API_BASE_URL,
    TIMEOUT: 15000,
};

export default API_BASE_URL;
