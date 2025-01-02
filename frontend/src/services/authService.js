import axios from 'axios';

export const login = async (email, password) => {
  try {
    const response = await axios.post('/api/login', { email, password });
    localStorage.setItem('token', response.data.token); // Token'ı sakla
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    await axios.post('/api/logout');
    localStorage.removeItem('token'); // Token'ı kaldır
  } catch (error) {
    throw error;
  }
};
