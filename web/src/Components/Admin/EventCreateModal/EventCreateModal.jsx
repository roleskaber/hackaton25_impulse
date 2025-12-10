// web/src/Components/Admin/EventCreateModal/EventCreateModal.jsx
import { useState } from 'react';
import './EventCreateModal.scss';

function EventCreateModal({ onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    place: '',
    city: '',
    event_time: '',
    event_end_time: '',
    price: 0,
    description: '',
    event_type: '',
    message_link: '',
    seats_total: 0,
    long_url: '',
    purchased_count: 0,
    account_id: 1,
    status: 'scheduled',
  });

  const [imageFile, setImageFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'seats_total' || name === 'account_id'
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (!imageFile) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    if (new Date(formData.event_time) >= new Date(formData.event_end_time)) {
      alert('Дата окончания должна быть позже даты начала');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result;
      const finalData = {
        ...formData,
        long_url: base64Image,
      };
      onSave(finalData);
    };
    reader.readAsDataURL(imageFile);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content event-modal large-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Создание нового события</h2>
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
              placeholder="Введите название события"
              required
            />
          </div>

          <div className="form-group">
            <label>Краткое описание (подсказка)</label>
            <input
              type="text"
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
              placeholder="Краткое описание для всплывающей подсказки"
            />
          </div>

          <div className="form-group">
            <label>Полное описание *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              placeholder="Подробное описание события"
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
                placeholder="Адрес события"
              />
            </div>

            <div className="form-group">
              <label>Город</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Город проведения"
              />
            </div>
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
            <label>Загрузка изображения *</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required
              className="file-input"
            />
            {imageFile && <p className="file-name">Выбран файл: {imageFile.name}</p>}
          </div>

          <div className="form-group">
            <label>Данные по оплате</label>
            <textarea
              name="message_link"
              value={formData.message_link}
              onChange={handleChange}
              rows="4"
              placeholder="Например: Сегодня день рождения Станислава, собираем на подарок. ВТБ 89185123076..."
            />
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-primary">Создать событие</button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventCreateModal;