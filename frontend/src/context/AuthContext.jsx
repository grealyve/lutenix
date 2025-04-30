import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);

      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        setUser({
          id: payload.id,
          role: payload.role,
          exp: payload.exp
        });
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      
      const data = await authAPI.login({ email, password });
      const accessToken = data.token || data.accessToken;
      
      if (accessToken) {
        localStorage.setItem('auth_token', accessToken);
        setToken(accessToken);
        setIsAuthenticated(true);

        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          setUser({
            id: payload.id,
            role: payload.role,
            exp: payload.exp
          });
        } catch (error) {
          console.error('Error parsing token:', error);
        }
        
        return { success: true };
      } else {
        throw new Error('No token received from server');
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Login failed. Please try again.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    token,
    user,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 