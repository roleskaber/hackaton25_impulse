import { useState, useEffect, useMemo, useRef } from 'react';
import './Home.scss';
import FAQ from '../../Components/FAQ/FAQ';
import EventCard from '../../Components/EventCard/EventCard';
import CategoryFilter from '../../Components/CategoryFilter/CategoryFilter';
import { useEvents } from '../../hooks/useEvents';
import { useCity } from '../../contexts/CityContext';

const afishaCategories = [
  'Кино',
  'Концерты',
  'Вечеринки',
  'Детская афиша',
  'Спектакли',
  'События',
  'Бесплатные мероприятия',
  'Спорт'
];

function Home({ onNavigate }) {
  const { upcomingEvents, afishaEvents, loading } = useEvents();
  const { selectedCity } = useCity();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedAfishaCategories, setSelectedAfishaCategories] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [displayedAfishaCount, setDisplayedAfishaCount] = useState(4);
  const activeEventsRef = useRef(null);
  const afishaEventsRef = useRef(null);

  useEffect(() => {
    if (upcomingEvents.length > 0) {
      const interval = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % Math.min(upcomingEvents.length, 4));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [upcomingEvents.length]);

  const carouselEvents = useMemo(() => {
    return upcomingEvents.slice(0, 4).map(event => ({
      ...event,
      image_url: event.long_url || `https://via.placeholder.com/1440x600?text=${encodeURIComponent(event.name)}`
    }));
  }, [upcomingEvents]);

  const filteredActiveEvents = useMemo(() => {
    let filtered = upcomingEvents;
    
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(event => {
        return selectedCategories.some(cat => 
          event.description?.toLowerCase().includes(cat.toLowerCase()) ||
          event.name?.toLowerCase().includes(cat.toLowerCase())
        );
      });
    }
    
    return filtered.sort((a, b) => {
      const aMatches = a.city === selectedCity;
      const bMatches = b.city === selectedCity;
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }, [upcomingEvents, selectedCategories, selectedCity]);

  const filteredAfishaEvents = useMemo(() => {
    let filtered = afishaEvents;
    if (selectedAfishaCategories.length > 0) {
      filtered = filtered.filter(event => {
        return selectedAfishaCategories.some(cat => 
          event.description?.toLowerCase().includes(cat.toLowerCase()) ||
          event.name?.toLowerCase().includes(cat.toLowerCase())
        );
      });
    }
    
    return filtered.sort((a, b) => {
      const aMatches = a.city === selectedCity;
      const bMatches = b.city === selectedCity;
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }, [afishaEvents, selectedAfishaCategories, selectedCity]);

  useEffect(() => {
    setDisplayedAfishaCount(4);
  }, [selectedAfishaCategories]);

  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleAfishaCategoryToggle = (category) => {
    setSelectedAfishaCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleEventClick = (event) => {
    if (onNavigate) {
      onNavigate('event-detail', null, { eventId: event.event_id });
    }
  };

  const scrollActiveEvents = (direction) => {
    if (activeEventsRef.current) {
      const scrollAmount = 400;
      activeEventsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleSeeMore = () => {
    setDisplayedAfishaCount(prev => prev + 4);
  };

  const nextCarousel = () => {
    setCarouselIndex((prev) => (prev + 1) % carouselEvents.length);
  };

  const prevCarousel = () => {
    setCarouselIndex((prev) => (prev - 1 + carouselEvents.length) % carouselEvents.length);
  };

  return (
    <div className="home-page">
      {carouselEvents.length === 0 && (
        <div className="hero-carousel-placeholder">
          <h2>Добро пожаловать на платформу афиши и билетов</h2>
          <p>Найдите интересующие вас события и приобретите билеты онлайн</p>
        </div>
      )}

      <CategoryFilter 
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
      />

      <section className="hero-carousel-section">
        {carouselEvents.length > 0 && (
          <div className="hero-carousel">
            <div className="carousel-slide">
              <img 
                src={carouselEvents[carouselIndex]?.long_url && (carouselEvents[carouselIndex].long_url.startsWith('http://') || carouselEvents[carouselIndex].long_url.startsWith('https://'))
                  ? carouselEvents[carouselIndex].long_url
                  : `https://via.placeholder.com/1440x600/FF6B35/FFFFFF?text=${encodeURIComponent(carouselEvents[carouselIndex]?.name || 'Event')}`} 
                alt={carouselEvents[carouselIndex]?.name || 'Event'} 
                className="carousel-image"
                onError={(e) => {
                  e.target.src = `https://via.placeholder.com/1440x600/FF6B35/FFFFFF?text=${encodeURIComponent(carouselEvents[carouselIndex]?.name || 'Event')}`;
                }}
              />
              <div className="carousel-overlay">
                <div className="carousel-content">
                  <h2 className="carousel-title">
                    {carouselEvents[carouselIndex]?.name || 'Событие'}
                  </h2>
                  <p className="carousel-description">
                    {carouselEvents[carouselIndex]?.description || 'Описание события'}
                  </p>
                </div>
              </div>
            </div>
            
            <button className="carousel-nav carousel-prev" onClick={prevCarousel}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <button className="carousel-nav carousel-next" onClick={nextCarousel}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div className="carousel-dots">
              {carouselEvents.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-dot ${index === carouselIndex ? 'active' : ''}`}
                  onClick={() => setCarouselIndex(index)}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="active-events-section">
        <div className="section-header">
          <h2 className="section-title">Ближайшие события</h2>
        </div>
        
        {loading ? (
          <div className="loading-message">Загрузка событий...</div>
        ) : filteredActiveEvents.length > 0 ? (
          <div className="events-scroll-container">
            <button 
              className="scroll-arrow scroll-left" 
              onClick={() => scrollActiveEvents('left')}
              aria-label="Прокрутить влево"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="events-scroll" ref={activeEventsRef}>
              {filteredActiveEvents.map(event => (
                <EventCard
                  key={event.event_id}
                  event={event}
                  onClick={() => handleEventClick(event)}
                />
              ))}
            </div>
            <button 
              className="scroll-arrow scroll-right" 
              onClick={() => scrollActiveEvents('right')}
              aria-label="Прокрутить вправо"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        ) : (
          <div className="no-events-message">Нет активных событий</div>
        )}
      </section>

      <section className="afisha-section">
        <div className="section-header">
          <h2 className="section-title">Афиша</h2>
        </div>

        {loading ? (
          <div className="loading-message">Загрузка событий...</div>
        ) : filteredAfishaEvents.length > 0 ? (
          <>
            <div className="events-scroll-container">
              <div className="events-scroll events-scroll-no-scroll" ref={afishaEventsRef}>
                {filteredAfishaEvents.slice(0, displayedAfishaCount).map(event => (
                  <EventCard
                    key={event.event_id}
                    event={event}
                    onClick={() => handleEventClick(event)}
                  />
                ))}
              </div>
            </div>

            {displayedAfishaCount < filteredAfishaEvents.length && (
              <div className="see-more-container">
                <button className="see-more-btn" onClick={handleSeeMore}>
                  Посмотреть еще
                  <svg width="24" height="24" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.7407 19.8516L21.377 12.2231M21.377 12.2231L13.7485 4.58683M21.377 12.2231L3.05927 12.2138" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-events-message">Нет событий по выбранным категориям</div>
        )}
      </section>

      <FAQ />
    </div>
  );
}

export default Home;
