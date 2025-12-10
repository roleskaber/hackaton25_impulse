import { useEffect, useMemo, useState } from 'react';
import './MyEvents.scss';
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

function MyEvents({ onNavigate }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [participation, setParticipation] = useState(() => loadParticipation());

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
    const ids = Object.keys(participation).map((id) => Number(id)).filter(Boolean);
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
          showError('Не удалось загрузить список моих событий');
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

  if (loading) {
    return (
      <div className="my-events-page">
        <div className="my-events-card">Загружаем ваши события...</div>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="my-events-page">
        <div className="my-events-card empty">
          <p>У вас пока нет подтвержденных событий.</p>
          <button type="button" onClick={() => onNavigate?.('home')}>Вернуться к афише</button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-events-page">
      <div className="my-events-header">
        <h1>Мои события ({events.length})</h1>
        <p>Все события, где ваше участие подтверждено.</p>
      </div>
      <div className="my-events-grid">
        {events.map((event) => (
          <div key={event.event_id} className="my-event-card">
            <div className="my-event-image">
              <img
                src={
                  event.message_link && (event.message_link.startsWith('http://') || event.message_link.startsWith('https://'))
                    ? event.message_link
                    : event.long_url && (event.long_url.startsWith('http://') || event.long_url.startsWith('https://'))
                    ? event.long_url
                    : `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='520' height='320'><rect width='100%' height='100%' fill='%23FF6B35'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23FFFFFF' font-size='26' font-family='Arial, sans-serif'>${event.name || 'Event'}</text></svg>`)}`
                }
                alt={event.name}
                onError={(e) => {
                  e.target.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='520' height='320'><rect width='100%' height='100%' fill='%23FF6B35'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23FFFFFF' font-size='26' font-family='Arial, sans-serif'>${event.name || 'Event'}</text></svg>`)}`;
                }}
              />
              <span className="status-badge small">Подтверждено</span>
            </div>
            <div className="my-event-body">
              <h3>{event.name}</h3>
              <p className="place">{event.place}, {event.city}</p>
              <p className="date">
                {new Date(event.event_time).toLocaleString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <div className="card-actions">
                <button type="button" onClick={() => onNavigate?.('event-detail', null, { eventId: event.event_id })}>
                  Открыть карточку
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyEvents;

