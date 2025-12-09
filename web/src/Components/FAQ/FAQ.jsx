import { useState } from 'react';
import './FAQ.scss';

function FAQ() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleQuestion = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const faqData = [
    {
      question: 'Что такое платформа афиши и билетов?',
      answer: 'Это платформа для поиска и покупки билетов на различные события: концерты, театральные постановки, спортивные мероприятия, выставки и многое другое. Вы можете найти интересующие вас события, узнать подробную информацию и приобрести билеты онлайн.'
    },
    {
      question: 'Как мне получить помощь, в случае возникновения каких-либо проблем?',
      answer: 'Если у вас возникнут проблемы с использованием платформы, вы можете обратиться в службу поддержки через онлайн-чат на сайте или написать на адрес электронной почты поддержки. Также доступен раздел помощи с подробными ответами на частые вопросы.'
    },
    {
      question: 'Как купить билеты на событие?',
      answer: 'Для покупки билетов выберите интересующее вас событие, нажмите на карточку события, укажите количество билетов и следуйте инструкциям на странице оформления заказа. После оплаты билеты будут отправлены на вашу электронную почту.'
    },
    {
      question: 'Можно ли вернуть билеты?',
      answer: 'Возврат билетов возможен в соответствии с правилами организатора события. Обычно возврат возможен не позднее чем за 24 часа до начала события. Подробную информацию о возврате можно найти на странице события или связавшись со службой поддержки.'
    }
  ];

  return (
    <section className="faq-section" id="faq-selection">
      <h2 className="faq-title">Часто задаваемые вопросы:</h2>
      
      <div className="faq-container">
        {faqData.map((item, index) => (
          <div key={index} className="faq-item">
            <div className="faq-card" onClick={() => toggleQuestion(index)}>
              <div className="faq-question">{item.question}</div>
              <svg
                className={`faq-icon ${expandedIndex === index ? 'expanded' : ''}`}
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path fillRule="evenodd" clipRule="evenodd" d="M20.8839 27.1339C20.3957 27.622 19.6043 27.622 19.1161 27.1339L6.61612 14.6339C6.12796 14.1457 6.12796 13.3543 6.61612 12.8661C7.10427 12.378 7.89573 12.378 8.38389 12.8661L20 24.4822L31.6161 12.8661C32.1043 12.378 32.8957 12.378 33.3839 12.8661C33.872 13.3543 33.872 14.1457 33.3839 14.6339L20.8839 27.1339Z" fill="#228EE5"/>
              </svg>
            </div>
            <div className={`faq-answer ${expandedIndex === index ? 'expanded' : ''}`}>
              <div className="faq-answer-content">
                {item.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FAQ;
