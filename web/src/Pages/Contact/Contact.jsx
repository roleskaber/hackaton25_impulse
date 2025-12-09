import { useState } from 'react';
import './Contact.scss';

function Contact({ onNavigate }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: null, message: '' });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setSubmitStatus({ type: null, message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.name.trim()) {
      setSubmitStatus({ type: 'error', message: 'Пожалуйста, укажите ваше имя' });
      return;
    }
    
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setSubmitStatus({ type: 'error', message: 'Пожалуйста, укажите корректный email' });
      return;
    }
    
    if (!formData.message.trim()) {
      setSubmitStatus({ type: 'error', message: 'Пожалуйста, введите сообщение' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // Имитация отправки формы
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubmitStatus({ 
        type: 'success', 
        message: 'Спасибо! Ваше сообщение отправлено. Мы свяжемся с вами в ближайшее время.' 
      });
      
      // Очистка формы
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      setSubmitStatus({ 
        type: 'error', 
        message: 'Произошла ошибка при отправке. Попробуйте позже или свяжитесь с нами по телефону.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <div className="contact-background-gradient"></div>
        
        <div className="contact-container">
          <div className="contact-header">
            <h1 className="contact-title">Связаться с нами</h1>
            <p className="contact-subtitle">
              Есть вопросы или предложения? Мы всегда готовы помочь вам с любыми вопросами
            </p>
          </div>

          <div className="contact-content">
            <div className="contact-form-wrapper">
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Ваше имя</label>
                  <input
                    type="text"
                    id="name"
                    className="form-input"
                    placeholder="Введите ваше имя"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject" className="form-label">Тема</label>
                  <input
                    type="text"
                    id="subject"
                    className="form-input"
                    placeholder="Тема вашего сообщения"
                    value={formData.subject}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">Сообщение</label>
                  <textarea
                    id="message"
                    className="form-textarea"
                    rows="6"
                    placeholder="Ваше сообщение..."
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>

                {submitStatus.message && (
                  <div className={`form-status ${submitStatus.type}`}>
                    {submitStatus.message}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  <svg 
                    className="send-icon"
                    width="20" 
                    height="20" 
                    viewBox="0 0 20 20" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M18.75 1.25L9.375 10.625M18.75 1.25L12.5 18.75L9.375 10.625M18.75 1.25L1.25 7.5L9.375 10.625" 
                      stroke="var(--color-text-primary)" 
                      strokeWidth="1.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                  {isSubmitting ? 'Отправка...' : 'Отправить сообщение'}
                </button>
              </form>
            </div>

            <div className="contact-info">
              <div className="info-card">
                <div className="info-icon">
                  <svg 
                    width="32" 
                    height="32" 
                    viewBox="0 0 32 32" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M4 6C4 4.89543 4.89543 4 6 4H10.5C11.1531 4 11.7087 4.45531 11.8385 5.09177L13.0385 11.0918C13.1434 11.6177 12.9269 12.1538 12.4932 12.4409L9.72939 14.3342C11.1872 17.3734 13.6266 19.8128 16.6658 21.2706L18.5591 18.5068C18.8462 18.0731 19.3823 17.8566 19.9082 17.9615L25.9082 19.1615C26.5447 19.2913 27 19.8469 27 20.5V25C27 26.1046 26.1046 27 25 27H23C12.5066 27 4 18.4934 4 8V6Z" 
                      fill="#228EE5"
                    />
                  </svg>
                </div>
                <h3 className="info-title">Телефон</h3>
                <p className="info-text">+375 (29) 673-16-26</p>
                <p className="info-text">+375 (44) 464-48-02</p>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <svg 
                    width="32" 
                    height="32" 
                    viewBox="0 0 32 32" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      fillRule="evenodd" 
                      clipRule="evenodd" 
                      d="M3 8C3 6.34315 4.34315 5 6 5H26C27.6569 5 29 6.34315 29 8V24C29 25.6569 27.6569 27 26 27H6C4.34315 27 3 25.6569 3 24V8ZM6 7C5.44772 7 5 7.44772 5 8V8.38197L16 14.882L27 8.38197V8C27 7.44772 26.5523 7 26 7H6ZM27 10.618L17.1056 16.3944C16.428 16.7889 15.572 16.7889 14.8944 16.3944L5 10.618V24C5 24.5523 5.44772 25 6 25H26C26.5523 25 27 24.5523 27 24V10.618Z" 
                      fill="#228EE5"
                    />
                  </svg>
                </div>
                <h3 className="info-title">Email</h3>
                <p className="info-text">support@kinodora.com</p>
                <p className="info-text">info@kinodora.com</p>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <svg 
                    width="32" 
                    height="32" 
                    viewBox="0 0 32 32" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      fillRule="evenodd" 
                      clipRule="evenodd" 
                      d="M16 4C11.5817 4 8 7.58172 8 12C8 16.4183 11.5817 20 16 20C20.4183 20 24 16.4183 24 12C24 7.58172 20.4183 4 16 4ZM16 14C17.1046 14 18 13.1046 18 12C18 10.8954 17.1046 10 16 10C14.8954 10 14 10.8954 14 12C14 13.1046 14.8954 14 16 14Z" 
                      fill="#228EE5"
                    />
                    <path 
                      d="M16 22C11.8588 22 8.28364 24.2071 6.40525 27.5C7.37158 28.438 8.47913 29.2284 9.6925 29.839C11.8792 24.5584 19.1208 24.5584 21.3075 29.839C22.5209 29.2284 23.6284 28.438 24.5948 27.5C22.7164 24.2071 19.1412 22 16 22Z" 
                      fill="#228EE5"
                    />
                  </svg>
                </div>
                <h3 className="info-title">Адрес</h3>
                <p className="info-text">Минск, пр. Независимости,</p>
                <p className="info-text">дом 123, офис 456</p>
              </div>

              <div className="info-card social-card">
                <div className="info-icon">
                  <svg 
                    width="32" 
                    height="32" 
                    viewBox="0 0 32 32" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      fillRule="evenodd" 
                      clipRule="evenodd" 
                      d="M16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4ZM18 11C18 9.89543 18.8954 9 20 9H21C21.5523 9 22 8.55228 22 8C22 7.44772 21.5523 7 21 7H20C17.7909 7 16 8.79086 16 11V13H14C13.4477 13 13 13.4477 13 14C13 14.5523 13.4477 15 14 15H16V23C16 23.5523 16.4477 24 17 24C17.5523 24 18 23.5523 18 23V15H20C20.5523 15 21 14.5523 21 14C21 13.4477 20.5523 13 20 13H18V11Z" 
                      fill="#228EE5"
                    />
                  </svg>
                </div>
                <h3 className="info-title">Социальные сети</h3>
                <div className="social-links">
                  <a href="https://ya.ru/" className="social-link">Facebook</a>
                  <a href="https://ya.ru/" className="social-link">Twitter</a>
                  <a href="https://ya.ru/" className="social-link">Instagram</a>
                  <a href="https://ya.ru/" className="social-link">YouTube</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
