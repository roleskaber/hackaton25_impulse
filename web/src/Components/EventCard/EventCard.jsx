import './EventCard.scss';

function EventCard({ event, onClick }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('ru-RU', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getStatus = (eventTime) => {
    const now = new Date();
    const eventDate = new Date(eventTime);
    if (eventDate < now) {
      return 'Прошедшее';
    }
    return 'Активное';
  };

  const getCategoryFromDescription = (description) => {
    const desc = description?.toLowerCase() || '';
    if (desc.includes('спектакль')) return 'Спектакль';
    if (desc.includes('вечеринка')) return 'Вечеринка';
    if (desc.includes('концерт')) return 'Концерт';
    if (desc.includes('фильм') || desc.includes('кино')) return 'Фильм';
    return 'Событие';
  };

  const status = getStatus(event.event_time);
  const availableSeats = event.seats_total - event.purchased_count;
  const category = getCategoryFromDescription(event.description);
  const hasTickets = availableSeats > 0;

  return (
    <div className="event-card" onClick={onClick}>
      <div className="event-image-wrapper">
        <img 
          src={event.image_url || 'https://via.placeholder.com/230x346?text=Event'} 
          alt={event.name} 
          className="event-image" 
        />
        {hasTickets && (
          <div className="event-ticket-badge">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_ticket)">
                <path d="M7.82301 0.0269775C7.61901 0.0269775 7.41501 0.100978 7.26201 0.257978L0.259009 7.25098C0.249009 7.25598 0.235009 7.26498 0.231009 7.27398C-0.0799908 7.58398 -0.0749908 8.08398 0.236009 8.39398L0.686009 8.84298C0.732009 8.88898 0.816009 8.88898 0.862009 8.84298C1.44201 8.32898 2.32301 8.34798 2.88001 8.90298C3.43701 9.45798 3.45501 10.338 2.94001 10.921C2.89401 10.967 2.89401 11.051 2.94001 11.097L3.39001 11.541C3.70101 11.851 4.20601 11.856 4.51701 11.546L11.543 4.53098C11.854 4.22098 11.854 3.72098 11.543 3.41098L11.098 2.96198C11.052 2.91598 10.968 2.91098 10.917 2.95698C10.337 3.47498 9.45601 3.45698 8.89501 2.89698C8.33801 2.34198 8.32001 1.46698 8.83901 0.888978C8.88501 0.836978 8.88001 0.753978 8.83401 0.706978L8.38901 0.258978C8.23601 0.100978 8.02701 0.0269775 7.82301 0.0269775ZM7.82301 0.286978C7.96201 0.286978 8.09701 0.337978 8.20301 0.443978L8.57401 0.813978C8.04601 1.48998 8.08701 2.46198 8.71301 3.08198C9.33501 3.70698 10.309 3.75298 10.99 3.22598L11.356 3.59198C11.569 3.80498 11.569 4.13798 11.356 4.35098L7.93401 7.76498L7.40101 7.22798C7.37301 7.19998 7.33101 7.18598 7.29401 7.18598C7.19201 7.19998 7.14101 7.34398 7.21501 7.41298L7.75301 7.94498L4.33001 11.365C4.12101 11.573 3.78701 11.569 3.57401 11.36L3.19801 10.981C3.71701 10.301 3.69001 9.33798 3.06801 8.71798C2.44201 8.09798 1.47301 8.06098 0.791009 8.58398L0.416009 8.20898C0.207009 7.99598 0.207009 7.66798 0.416009 7.45898L3.83901 4.03898L4.37201 4.57998C4.41801 4.62598 4.51101 4.63098 4.55701 4.57998C4.60801 4.53398 4.60801 4.44598 4.56201 4.39498L4.02001 3.85898L7.44301 0.443978C7.54901 0.337978 7.68901 0.286978 7.82301 0.286978ZM5.03601 4.92298C5.02701 4.92298 5.01801 4.92298 5.01301 4.92798C4.91501 4.94698 4.87301 5.08498 4.94701 5.14998L5.50801 5.70998C5.55401 5.76498 5.65201 5.77498 5.70301 5.71898C5.75501 5.66898 5.75001 5.57098 5.69401 5.52498L5.12801 4.96498C5.10501 4.93698 5.07301 4.92298 5.03601 4.92298ZM6.14401 6.05698C6.04701 6.07598 6.01001 6.21498 6.07901 6.28398L6.64501 6.83898C6.68701 6.89898 6.78401 6.90398 6.83501 6.85298C6.89101 6.80198 6.88601 6.70498 6.82601 6.65898L6.26501 6.09898C6.23701 6.07098 6.19501 6.05298 6.15901 6.05798C6.15301 6.05698 6.14901 6.05698 6.14401 6.05698Z" fill="#F15A24"/>
              </g>
              <defs>
                <clipPath id="clip0_ticket">
                  <rect width="12" height="11.776" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            <span>Билеты</span>
          </div>
        )}
      </div>

      <div className="event-info">
        <p className="event-category">{category}</p>
        <h3 className="event-title">{event.name}</h3>
        {event.description && (
          <p className="event-genre">{event.description.split('.')[0]}</p>
        )}
        <p className="event-details">
          {formatDate(event.event_time)}<br />
          {event.place}
        </p>
      </div>

      <div className="event-tooltip">
        <div className="tooltip-content">
          <h4>{event.name}</h4>
          <p>{event.description}</p>
          <div className="tooltip-details">
            <span>Место: {event.place}</span>
            <span>Город: {event.city}</span>
            <span>Цена: {event.price} ₽</span>
            <span>Свободно мест: {availableSeats}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventCard;
