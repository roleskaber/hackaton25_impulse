// web/src/services/adminService.js
import { getApiUrl } from '../config/api';
import { getAuthToken } from './authService';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`,
  'ngrok-skip-browser-warning': 'true',
});

// Users management
export const getAllUsers = async () => {
  try {
    const response = await fetch(getApiUrl('/users'), {
      method: 'GET',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const updateUserByAdmin = async (userId, userData) => {
  try {
    const response = await fetch(getApiUrl(`/users/${userId}`), {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUserByAdmin = async (userId) => {
  try {
    const response = await fetch(getApiUrl(`/users/${userId}`), {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Events management
export const getAllEvents = async () => {
  try {
    const response = await fetch(getApiUrl('/events/all'), {
      method: 'GET',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await fetch(getApiUrl('/add_event'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create event');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await fetch(getApiUrl(`/events/${eventId}`), {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update event');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const getEventById = async (eventId) => {
  try {
    const response = await fetch(getApiUrl(`/events/get/${eventId}`), {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch event');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
};