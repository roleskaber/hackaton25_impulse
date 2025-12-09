import { getApiUrl } from '../config/api';

export const getEventsBetweenDates = async (startDate, endDate, limit = 100) => {
  try {
    const url = getApiUrl(`/events/between?limit=${limit}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

export const getUpcomingEvents = async (days = 7) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  
  return await getEventsBetweenDates(start, end);
};

export const getAfishaEvents = async (limit = 10) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  
  return await getEventsBetweenDates(start, end, limit);
};

