const getBaseUrl = () => {
  const url = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';
  return url.replace(/\/+$/, '');
};

const API_BASE_URL = getBaseUrl();

export const getApiUrl = (path) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

export default API_BASE_URL;

