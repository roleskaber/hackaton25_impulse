// web/src/Components/Admin/EventEditModal/EventEditModal.jsx
import { useState } from 'react';
import './EventEditModal.scss';

function EventEditModal({ event, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: event.name || '',
    place: event.place || '',
    city: event.city || '',
    event_time: new Date(event.event_time).toISOString().slice(0, 16),
    event_end_time: event.event_end_time ? new Date(event.event_end_time).toISOString().slice(0, 16) : '',
    price: event.price || 0,
    description: event.description || '',
    event_type: event.event_type || '',
    message_link: event.message_link || '',
    seats_total: event.seats_total || 0,
    long_url: event.long_url || '',
    purchased_count: event.purchased_count || 0,
    account_id: event.account_id || 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'seats_total' || name === 'purchased_count' || name === 'account_id'
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (new Date(formData.event_time) >= new Date(formData.event_end_time)) {
      alert('Дата окончания должна быть позже даты начала');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content event-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Редактирование события</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Название события *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Место</label>
              <input
                type="text"
                name="place"
                value={formData.place}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Город</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Полное описание *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Дата начала *</label>
              <input
                type="datetime-local"
                name="event_time"
                value={formData.event_time}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Дата окончания *</label>
              <input
                type="datetime-local"
                name="event_end_time"
                value={formData.event_end_time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Цена (₽)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Максимум участников</label>
              <input
                type="number"
                name="seats_total"
                value={formData.seats_total}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Тип события</label>
            <input
              type="text"
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Информация об оплате</label>
            <textarea
              name="message_link"
              value={formData.message_link}
              onChange={handleChange}
              rows="3"
              placeholder="Информация о способах оплаты..."
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-primary">Сохранить</button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventEditModal;