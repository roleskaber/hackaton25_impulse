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

export const getEventById = async (eventId) => {
  const response = await fetch(getApiUrl(`/events/get/${eventId}`), {
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  });

  if (!response.ok) {
    throw new Error('Не удалось загрузить событие');
  }

  return await response.json();
};

export const createEventOrder = async ({ eventId, email, peopleCount = 1, paymentMethod = 'online' }) => {
  try {
    const response = await fetch(getApiUrl('/order'), {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        event_id: eventId,
        payment_method: paymentMethod,
        people_count: peopleCount,
        email,
      }),
    });

    if (!response.ok) {
      let detail = 'Не удалось подтвердить участие';
      try {
        const err = await response.json();
        if (err?.detail) {
          detail = Array.isArray(err.detail) ? err.detail.map((d) => d.msg || d).join(', ') : err.detail;
        }
      } catch (e) {
        /* ignore parse error */
      }
      throw new Error(detail);
    }

    return await response.json();
  } catch (error) {
    if (error?.message?.includes('Failed to fetch')) {
      throw new Error('Не удалось связаться с сервером. Проверьте REACT_APP_BASE_URL и доступность API.');
    }
    throw error;
  }
};

