import { getApiUrl } from '../config/api';

const AUTH_STORAGE_KEY = 'auth_user';
const TOKEN_STORAGE_KEY = 'auth_token';

let currentUser = null;
let authListeners = [];

const loadUserFromStorage = () => {
  try {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedUser && storedToken) {
      currentUser = JSON.parse(storedUser);
      currentUser.idToken = storedToken;
      return currentUser;
    }
  } catch (error) {
    console.error('Error loading user from storage:', error);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
  return null;
};

const saveUserToStorage = (user) => {
  try {
    if (user) {
      const userToStore = { ...user };
      const token = userToStore.idToken;
      delete userToStore.idToken;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userToStore));
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      }
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error saving user to storage:', error);
  }
};

currentUser = loadUserFromStorage();

export const getCurrentUser = () => {
  return currentUser;
};

export const onAuthStateChange = (callback) => {
  authListeners.push(callback);
  if (currentUser) {
    callback(currentUser);
  }
  
  return () => {
    authListeners = authListeners.filter(listener => listener !== callback);
  };
};

const notifyListeners = (user) => {
  authListeners.forEach(listener => listener(user));
};

export const loginUser = async (email, password) => {
  try {
    const response = await fetch(getApiUrl('/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Ошибка входа' }));
      throw new Error(errorData.detail || 'Ошибка входа');
    }
    
    const data = await response.json();
    currentUser = {
      uid: data.localId || data.uid,
      email: data.email,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
    };
    
    saveUserToStorage(currentUser);
    notifyListeners(currentUser);
    return { success: true, user: currentUser };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const registerUser = async (email, password, userData = {}) => {
  try {
    const response = await fetch(getApiUrl('/auth/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Ошибка регистрации' }));
      throw new Error(errorData.detail || 'Ошибка регистрации');
    }
    
    const data = await response.json();
    currentUser = {
      uid: data.localId || data.uid,
      email: data.email,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      ...userData,
    };
    
    saveUserToStorage(currentUser);
    notifyListeners(currentUser);
    
    if (userData.name || userData.username || userData.profileImage) {
      await updateUserProfileAfterRegistration(userData);
    }
    
    return { success: true, user: currentUser };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const updateUserProfileAfterRegistration = async (userData) => {
  try {
    const updateData = {};
    if (userData.name) {
      updateData.display_name = userData.name;
    }
    if (userData.username) {
      updateData.username = userData.username;
    }
    if (userData.profileImage) {
      updateData.profile_image = userData.profileImage;
    }
    
    if (Object.keys(updateData).length > 0) {
      const response = await fetch(getApiUrl('/users/me'), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.idToken}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(updateData),
      });
      
      if (response.ok) {
        const updatedData = await response.json();
        currentUser = { ...currentUser, ...updatedData };
        saveUserToStorage(currentUser);
        notifyListeners(currentUser);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Ошибка обновления профиля' }));
        console.error('Error updating profile:', errorData);
      }
    }
  } catch (error) {
    console.error('Error updating user profile after registration:', error);
  }
};

export const logoutUser = async () => {
  currentUser = null;
  saveUserToStorage(null);
  notifyListeners(null);
  return { success: true };
};

export const updateUserProfile = async (profileData) => {
  if (!currentUser || !currentUser.idToken) {
    throw new Error('Пользователь не авторизован');
  }
  
  try {
    const response = await fetch(getApiUrl('/users/me'), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.idToken}`,
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Ошибка обновления профиля' }));
      throw new Error(errorData.detail || 'Ошибка обновления профиля');
    }
    
    const updatedData = await response.json();
    currentUser = {
      ...currentUser,
      ...updatedData,
    };
    
    saveUserToStorage(currentUser);
    notifyListeners(currentUser);
    return currentUser;
  } catch (error) {
    throw error;
  }
};

export const getAuthToken = () => {
  return currentUser?.idToken || localStorage.getItem(TOKEN_STORAGE_KEY);
};

