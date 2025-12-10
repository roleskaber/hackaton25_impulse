// web/src/Components/Admin/EventsManagement/EventsManagement.jsx
import { useState, useEffect, useMemo } from 'react';
import './EventsManagement.scss';
import {
  getAllEvents,
  createEvent,
  updateEvent,
} from '../../../services/adminService';
import EventEditModal from '../EventEditModal/EventEditModal';
import EventCreateModal from '../EventCreateModal/EventCreateModal';

function EventsManagement({ onNavigate }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('active');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getAllEvents();
      setEvents(data);
    } catch (error) {
      showToast('Ошибка загрузки событий', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const eventEndTime = new Date(event.event_end_time || event.event_time);

    if (eventEndTime < now) {
      return 'past';
    }
    return 'active';
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const status = getEventStatus(event);
      if (statusFilter === 'active') {
        return status === 'active';
      } else if (statusFilter === 'past') {
        return status === 'past';
      }
      return true;
    });
  }, [events, statusFilter]);

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleSaveEvent = async (eventData) => {
    try {
      await updateEvent(selectedEvent.event_id, eventData);
      showToast('Событие успешно обновлено', 'success');
      setShowEditModal(false);
      setSelectedEvent(null);
      loadEvents();
    } catch (error) {
      showToast('Ошибка обновления события', 'error');
      console.error(error);
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      await createEvent(eventData);
      showToast('Событие успешно создано', 'success');
      setShowCreateModal(false);
      loadEvents();
    } catch (error) {
      showToast('Ошибка создания события', 'error');
      console.error(error);
    }
  };

  if (loading) {
    return <div className="events-loading">Загрузка...</div>;
  }

  return (
    <div className="events-management">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
      
      <div className="events-header">
        <div className="events-filters">
          <button
            className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Активные события
          </button>
          <button
            className={`filter-btn ${statusFilter === 'past' ? 'active' : ''}`}
            onClick={() => setStatusFilter('past')}
          >
            Прошедшие события
          </button>
        </div>

        <button className="btn-create-event" onClick={() => setShowCreateModal(true)}>
          + Создать новое событие
        </button>
      </div>

      <div className="events-table-wrapper">
        <table className="events-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Место</th>
              <th>Город</th>
              <th>Дата начала</th>
              <th>Дата окончания</th>
              <th>Цена</th>
              <th>Участников</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map(event => (
              <tr key={event.event_id} className="event-row">
                <td className="event-name">{event.name}</td>
                <td>{event.place}</td>
                <td>{event.city}</td>
                <td>{new Date(event.event_time).toLocaleDateString('ru-RU')}</td>
                <td>{new Date(event.event_end_time || event.event_time).toLocaleDateString('ru-RU')}</td>
                <td>{event.price}₽</td>
                <td>{event.purchased_count}/{event.seats_total}</td>
                <td className="actions-cell">
                  <button className="action-btn edit" onClick={() => handleEdit(event)}>
                    Редактировать
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredEvents.length === 0 && (
          <div className="empty-state">
            <p>События не найдены</p>
          </div>
        )}
      </div>

      {showEditModal && (
        <EventEditModal
          event={selectedEvent}
          onSave={handleSaveEvent}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
          }}
        />
      )}

      {showCreateModal && (
        <EventCreateModal
          onSave={handleCreateEvent}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

export default EventsManagement;