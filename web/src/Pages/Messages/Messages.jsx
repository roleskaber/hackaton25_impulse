import { useEffect, useMemo, useState } from 'react';
import './Messages.scss';
import { getEventById } from '../../services/eventService';
import { showError } from '../../Components/Toast/Toast';

const PARTICIPATION_KEY = 'event_participation';

const loadParticipation = () => {
  try {
    const raw = localStorage.getItem(PARTICIPATION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const formatDate = (value) =>
  new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

function Messages({ onNavigate }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [participation, setParticipation] = useState(() => loadParticipation());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const handleParticipationUpdate = () => {
      setParticipation(loadParticipation());
    };
    window.addEventListener('participation-updated', handleParticipationUpdate);
    window.addEventListener('storage', handleParticipationUpdate);
    return () => {
      window.removeEventListener('participation-updated', handleParticipationUpdate);
      window.removeEventListener('storage', handleParticipationUpdate);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const ids = Object.keys(participation)
      .map((id) => Number(id))
      .filter(Boolean);
    if (ids.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled(ids.map((id) => getEventById(id)));
        if (cancelled) return;
        const okEvents = results
          .map((res) => (res.status === 'fulfilled' ? res.value : null))
          .filter(Boolean);
        setEvents(okEvents);
      } catch (e) {
        if (!cancelled) {
          showError('Не удалось загрузить список событий');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [participation]);

  const soonEvents = useMemo(() => {
    const dayMs = 24 * 60 * 60 * 1000;
    return events
      .map((event) => ({
        ...event,
        diffMs: new Date(event.event_time).getTime() - now,
      }))
      .filter((event) => event.diffMs > 0 && event.diffMs <= dayMs)
      .sort((a, b) => a.diffMs - b.diffMs);
  }, [events, now]);

  if (loading) {
    return (
      <div className="messages-page">
        <div className="messages-card">Ищем события рядом по времени...</div>
      </div>
    );
  }

  if (!soonEvents.length) {
    return (
      <div className="messages-page">
        <div className="messages-card empty">
          <p>Пока нет уведомлений. Мы покажем события, которые начнутся в течение 24 часов.</p>
          <button type="button" onClick={() => onNavigate?.('home')}>Вернуться к афише</button>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="messages-header">
        <h1>Уведомления ({soonEvents.length})</h1>
        <p>События, которые стартуют в ближайшие 24 часа.</p>
      </div>

      <div className="messages-list">
        {soonEvents.map((event) => (
          <div key={event.event_id} className="messages-item">
            <div className="messages-item__time">
              <span className="label">Начало</span>
              <strong>{formatDate(event.event_time)}</strong>
            </div>
            <div className="messages-item__body">
              <h3>{event.name}</h3>
              <p className="place">
                {event.place}, {event.city}
              </p>
              <p className="note">
                Менее суток до начала — не забудьте прийти вовремя.
              </p>
              <div className="actions">
                <button
                  type="button"
                  onClick={() => onNavigate?.('event-detail', null, { eventId: event.event_id })}
                >
                  Открыть событие
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Messages;


