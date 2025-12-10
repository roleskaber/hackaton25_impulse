import { useEffect, useMemo, useState } from 'react';
import './EventDetail.scss';
import { createEventOrder, getEventById } from '../../services/eventService';
import { getCurrentUser } from '../../services/authService';
import { showError, showInfo, showSuccess, showWarning } from '../../Components/Toast/Toast';

const PARTICIPATION_KEY = 'event_participation';

const loadParticipation = () => {
  try {
    const raw = localStorage.getItem(PARTICIPATION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const saveParticipation = (data) => {
  try {
    localStorage.setItem(PARTICIPATION_KEY, JSON.stringify(data));
  } catch (e) {
  }
};

const emitParticipationChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('participation-updated'));
  }
};

function EventDetail({ eventId, onNavigate }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [isParticipating, setIsParticipating] = useState(false);
  const [email, setEmail] = useState(() => getCurrentUser()?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.email) {
      setEmail(user.email);
    }
  }, []);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      setError('Событие не найдено');
      return;
    }

    let isActive = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getEventById(eventId);
        if (!isActive) return;
        const stored = loadParticipation();
        setEvent(data);
        setParticipantCount(data.purchased_count || 0);
        setIsParticipating(Boolean(stored?.[eventId]));
        if (!email && stored?.[eventId]?.email) {
          setEmail(stored[eventId].email);
        }
      } catch (e) {
        if (!isActive) return;
        setError(e.message || 'Ошибка загрузки события');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isActive = false;
    };
  }, [eventId]);

  const statusInfo = useMemo(() => {
    if (!event) {
      return { label: '', state: 'idle' };
    }
    const now = new Date();
    const start = event.event_time ? new Date(event.event_time) : null;
    const end = event.event_end_time ? new Date(event.event_end_time) : null;

    const finishedByStatus = event.status === 'finished';
    const finishedByDate = end ? end < now : start ? start < now : false;

    if (finishedByStatus || finishedByDate) {
      return { label: 'Проведено', state: 'past' };
    }
    return { label: 'Активно', state: 'active' };
  }, [event]);

  const isFull = useMemo(() => {
    if (!event || !event.seats_total) return false;
    return participantCount >= event.seats_total;
  }, [event, participantCount]);

  const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleConfirm = async () => {
    if (!event) return;
    if (statusInfo.state === 'past') {
      showWarning('Событие уже завершено');
      return;
    }
    if (isFull) {
      showWarning('Достигнут максимальный лимит участников');
      return;
    }
    if (!email.trim()) {
      showError('Укажите email для подтверждения участия');
      return;
    }

    setIsSubmitting(true);
    try {
      await createEventOrder({
        eventId: event.event_id,
        email: email.trim(),
        peopleCount: 1,
        paymentMethod: 'online',
      });
      setParticipantCount((prev) => prev + 1);
      setIsParticipating(true);
      const stored = loadParticipation();
      saveParticipation({
        ...stored,
        [eventId]: { email: email.trim(), ts: Date.now() },
      });
      emitParticipationChanged();
      showSuccess('Участие подтверждено');
    } catch (e) {
      showError(e.message || 'Не удалось подтвердить участие');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => setIsCancelModalOpen(true);

  const confirmCancel = () => {
    setIsParticipating(false);
    setParticipantCount((prev) => Math.max(0, prev - 1));
    const stored = loadParticipation();
    delete stored[eventId];
    saveParticipation(stored);
    emitParticipationChanged();
    setIsCancelModalOpen(false);
    showInfo('Участие отменено');
  };

  const cancelModal = () => setIsCancelModalOpen(false);

  const heroImage = useMemo(() => {
    if (!event) return '';
    if (event.message_link && (event.message_link.startsWith('http://') || event.message_link.startsWith('https://'))) {
      return event.message_link;
    }
    if (event.long_url && (event.long_url.startsWith('http://') || event.long_url.startsWith('https://'))) {
      return event.long_url;
    }
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='500'><rect width='100%' height='100%' fill='%23FF6B35'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23FFFFFF' font-size='32' font-family='Arial, sans-serif'>${event.name || 'Event'}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, [event]);

  if (loading) {
    return (
      <div className="event-detail-page">
        <div className="event-detail-card loading">Загрузка карточки события...</div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="event-detail-page">
        <div className="event-detail-card error">
          <p>{error || 'Событие недоступно'}</p>
          <button type="button" onClick={() => onNavigate?.('home')}>На главную</button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-detail-page">
      <div className="event-detail-hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="event-detail-hero-overlay">
          <button type="button" className="back-btn" onClick={() => onNavigate?.('home')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Назад к событиям
          </button>
          <div className="event-detail-hero-content">
            <div className="event-status">
              <span className={`status-badge ${statusInfo.state}`}>{statusInfo.label}</span>
              {isFull && <span className="status-badge warning">Лимит мест</span>}
            </div>
            <h1>{event.name}</h1>
            <p className="event-subtitle">{event.place}, {event.city}</p>
            <div className="event-dates">
              <span>{formatDateTime(event.event_time)}</span>
              {event.event_end_time && <span className="separator">—</span>}
              {event.event_end_time && <span>{formatDateTime(event.event_end_time)}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="event-detail-content">
        <section className="event-main-info">
          <div className="event-image">
            <img src={heroImage} alt={event.name} onError={(e) => { e.target.src = `https://via.placeholder.com/600x400/0B152B/FFFFFF?text=${encodeURIComponent(event.name || 'Event')}`; }} />
          </div>

          <div className="event-info-panel">
            <div className="info-row">
              <div className="info-block">
                <p className="info-label">Дата начала</p>
                <p className="info-value">{formatDateTime(event.event_time)}</p>
              </div>
              <div className="info-block">
                <p className="info-label">Дата окончания</p>
                <p className="info-value">{formatDateTime(event.event_end_time)}</p>
              </div>
            </div>

            <div className="info-row">
              <div className="info-block">
                <p className="info-label">Место</p>
                <p className="info-value">{event.place}</p>
              </div>
              <div className="info-block">
                <p className="info-label">Город</p>
                <p className="info-value">{event.city}</p>
              </div>
            </div>

            <div className="info-row">
              <div className="info-block">
                <p className="info-label">Участники</p>
                <p className="info-value">
                  {participantCount}
                  {event.seats_total ? ` / ${event.seats_total}` : ''}
                </p>
              </div>
              <div className="info-block">
                <p className="info-label">Статус участия</p>
                <p className={`info-value ${isParticipating ? 'success' : 'muted'}`}>
                  {isParticipating ? 'Вы участвуете' : 'Вы не участвуете'}
                </p>
              </div>
            </div>

            <div className="info-row">
              <div className="info-block">
                <p className="info-label">Стоимость</p>
                <p className="info-value price">{event.price} ₽</p>
              </div>
              <div className="info-block">
                <p className="info-label">Оплата</p>
                <p className="info-value">Онлайн</p>
              </div>
            </div>

            {event.message_link && (
              <div className="info-row">
                <div className="info-block full">
                  <p className="info-label">Ссылка</p>
                  <a href={event.message_link} target="_blank" rel="noreferrer" className="info-value link">
                    {event.message_link}
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="event-description">
          <h2>Описание</h2>
          <p>{event.description || 'Без описания'}</p>
        </section>

        <section className="event-actions">
          <div className="action-card">
            <div className="action-header">
              <h3>Участие</h3>
              {isFull && !isParticipating && <span className="limit-text">Достигнут лимит участников</span>}
            </div>

            <div className="action-body">
              <div className="field">
                <label htmlFor="email">Email для билета</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                />
              </div>

              <div className="action-buttons">
                <button
                  type="button"
                  className="confirm-btn"
                  onClick={handleConfirm}
                  disabled={isSubmitting || isParticipating || isFull || statusInfo.state === 'past'}
                >
                  {isFull ? 'Лимит достигнут' : isParticipating ? 'Участие подтверждено' : 'Подтвердить участие'}
                </button>
                {isParticipating && (
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Отменить участие
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {isCancelModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Отменить участие?</h3>
            <p>После подтверждения ваше участие будет отменено.</p>
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={cancelModal}>Оставить</button>
              <button type="button" className="danger" onClick={confirmCancel}>Отменить участие</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDetail;

