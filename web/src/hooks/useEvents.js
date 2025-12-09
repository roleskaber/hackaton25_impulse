import { useState, useEffect, useCallback } from 'react';
import { getUpcomingEvents, getAfishaEvents } from '../services/eventService';

export const useEvents = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [afishaEvents, setAfishaEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUpcomingEvents = useCallback(async () => {
    try {
      const events = await getUpcomingEvents(7);
      setUpcomingEvents(events);
    } catch (err) {
      console.error('Error loading upcoming events:', err);
      setError(err.message);
    }
  }, []);

  const loadAfishaEvents = useCallback(async () => {
    try {
      const events = await getAfishaEvents(10);
      setAfishaEvents(events);
    } catch (err) {
      console.error('Error loading afisha events:', err);
      setError(err.message);
    }
  }, []);

  const loadAllEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadUpcomingEvents(), loadAfishaEvents()]);
    } catch (err) {
      console.error('Error loading events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loadUpcomingEvents, loadAfishaEvents]);

  useEffect(() => {
    loadAllEvents();
  }, [loadAllEvents]);

  return {
    upcomingEvents,
    afishaEvents,
    loading,
    error,
    reload: loadAllEvents,
  };
};

