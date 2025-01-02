import axios from 'axios';

export const startScan = async (scanner, targetURL, apiKey) => {
  try {
    const response = await axios.post('/api/scan/start', {
      scanner,
      target_url: targetURL,
      api_key: apiKey,
    });
    return response.data;
  } catch (error) {
    console.error('Error starting scan:', error);
    throw error;
  }
};
