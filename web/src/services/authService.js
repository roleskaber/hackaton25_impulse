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
  // Уведомляем всех слушателей синхронно
  authListeners.forEach(listener => {
    try {
      listener(user);
    } catch (error) {
      console.error('Error in auth listener:', error);
    }
  });
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
    
    // Загружаем профиль пользователя после входа
    try {
      const profileData = await getUserProfile();
      currentUser = {
        ...currentUser,
        ...profileData
      };
      saveUserToStorage(currentUser);
      notifyListeners(currentUser);
    } catch (error) {
      console.error('Ошибка загрузки профиля после входа:', error);
      // Продолжаем работу даже если профиль не загрузился
    }
    
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
    
    if (userData.name || userData.profileImage) {
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
        // Маппинг полей бэкенда на фронтенд
        const mappedData = {
          name: updatedData.display_name || updatedData.name,
          email: updatedData.email,
          profileImage: updatedData.profile_image || updatedData.profileImage,
        };
        currentUser = { ...currentUser, ...mappedData };
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
  // Очищаем все данные пользователя
  currentUser = null;
  saveUserToStorage(null);
  
  // Уведомляем всех слушателей об изменении состояния
  notifyListeners(null);
  
  // Очищаем все ключи localStorage связанные с аутентификацией
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
  
  return { success: true };
};

export const getUserProfile = async () => {
  if (!currentUser || !currentUser.idToken) {
    throw new Error('Пользователь не авторизован');
  }
  
  try {
    const response = await fetch(getApiUrl('/users/me'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${currentUser.idToken}`,
        'ngrok-skip-browser-warning': 'true',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Ошибка загрузки профиля' }));
      throw new Error(errorData.detail || 'Ошибка загрузки профиля');
    }
    
    const profileData = await response.json();
    
    // Маппинг полей бэкенда на фронтенд
    const mappedData = {
      name: profileData.display_name || profileData.name,
      email: profileData.email,
      profileImage: profileData.profile_image || profileData.profileImage,
    };
    
    currentUser = {
      ...currentUser,
      ...mappedData,
    };
    
    saveUserToStorage(currentUser);
    notifyListeners(currentUser);
    return mappedData;
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (profileData) => {
  if (!currentUser || !currentUser.idToken) {
    throw new Error('Пользователь не авторизован');
  }
  
  try {
    // Маппинг полей фронтенда на бэкенд
    // Отправляем только те поля, которые были переданы и не пустые
    const finalData = {};
    
    // Валидация и обработка имени
    if (profileData.name !== undefined && profileData.name !== null) {
      const trimmedName = String(profileData.name).trim();
      if (trimmedName !== '') {
        // Убеждаемся, что это строка
        finalData.display_name = String(trimmedName);
      }
    }
    
    // Обработка profileImage
    if (profileData.profileImage !== undefined && profileData.profileImage !== null) {
      const imageValue = String(profileData.profileImage);
      if (imageValue !== '') {
        finalData.profile_image = String(imageValue);
      }
    }
    
    // Проверяем, что есть хотя бы одно поле для обновления
    if (Object.keys(finalData).length === 0) {
      throw new Error('Нет данных для обновления');
    }
    
    // Убеждаемся, что все значения - строки (не числа, не объекты)
    const sanitizedFinalData = {};
    for (const [key, value] of Object.entries(finalData)) {
      if (value !== undefined && value !== null && value !== '') {
        // Гарантируем, что значение - строка
        const strValue = String(value);
        if (strValue.trim() !== '') {
          sanitizedFinalData[key] = strValue.trim();
        }
      }
    }
    
    // Проверяем, что есть хотя бы одно поле после санитизации
    if (Object.keys(sanitizedFinalData).length === 0) {
      throw new Error('Нет данных для обновления после санитизации');
    }
    
    console.log('Sending profile update:', sanitizedFinalData);
    console.log('JSON stringified:', JSON.stringify(sanitizedFinalData));
    console.log('Profile data received:', profileData);
    console.log('Final data keys:', Object.keys(sanitizedFinalData));
    console.log('Final data values:', Object.values(sanitizedFinalData));
    
    const response = await fetch(getApiUrl('/users/me'), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.idToken}`,
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(sanitizedFinalData),
    });
    
    if (!response.ok) {
      let errorMessage = 'Ошибка обновления профиля';
      let errorDetails = null;
      try {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        console.error('Error detail array:', errorData.detail);
        console.error('Full error data:', JSON.stringify(errorData, null, 2));
        errorDetails = errorData;
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Выводим полную информацию об ошибках
            errorData.detail.forEach((e, index) => {
              console.error(`Error ${index}:`, JSON.stringify(e, null, 2));
              console.error(`Error ${index} loc:`, e.loc);
              console.error(`Error ${index} msg:`, e.msg);
              console.error(`Error ${index} type:`, e.type);
              console.error(`Error ${index} input:`, e.input);
            });
            errorMessage = errorData.detail.map(e => {
              if (typeof e === 'string') return e;
              const field = e.loc ? e.loc.join('.') : 'unknown';
              const msg = e.msg || e.type || 'Ошибка';
              const input = e.input !== undefined ? ` (received: ${JSON.stringify(e.input)})` : '';
              return `${field}: ${msg}${input}`;
            }).join(', ');
          } else {
            errorMessage = errorData.detail;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        console.error('Failed to parse error response:', e);
        // Если не удалось распарсить JSON, используем статус код
        errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
      }
      console.error('Final error message:', errorMessage);
      throw new Error(errorMessage);
    }
    
    const updatedData = await response.json();
    
    // Маппинг полей бэкенда на фронтенд
    const mappedData = {
      name: updatedData.display_name || updatedData.name,
      email: updatedData.email,
      profileImage: updatedData.profile_image || updatedData.profileImage,
    };
    
    currentUser = {
      ...currentUser,
      ...mappedData,
    };
    
    saveUserToStorage(currentUser);
    notifyListeners(currentUser);
    return mappedData;
  } catch (error) {
    throw error;
  }
};

export const getAuthToken = () => {
  return currentUser?.idToken || localStorage.getItem(TOKEN_STORAGE_KEY);
};

