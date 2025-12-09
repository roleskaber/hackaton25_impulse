const API_BASE_URL = 'http://localhost:8000';

let currentUser = null;
let authListeners = [];

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
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка входа');
    }
    
    const data = await response.json();
    currentUser = {
      uid: data.localId || data.uid,
      email: data.email,
      idToken: data.idToken,
    };
    
    notifyListeners(currentUser);
    return { success: true, user: currentUser };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const registerUser = async (email, password, userData = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка регистрации');
    }
    
    const data = await response.json();
    currentUser = {
      uid: data.localId || data.uid,
      email: data.email,
      idToken: data.idToken,
      ...userData,
    };
    
    notifyListeners(currentUser);
    return { success: true, user: currentUser };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  currentUser = null;
  notifyListeners(null);
  return { success: true };
};

export const updateUserProfile = async (profileData) => {
  if (!currentUser) {
    throw new Error('Пользователь не авторизован');
  }
  
  currentUser = {
    ...currentUser,
    ...profileData,
  };
  
  notifyListeners(currentUser);
  return currentUser;
};

