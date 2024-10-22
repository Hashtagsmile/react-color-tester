import { useState } from 'react';
import './FaqItem.css';

const FaqItem = ({ title, content }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`faq-item ${isExpanded ? 'expanded' : ''}`}>
      <div className="faq-title" onClick={toggleExpansion}>
        <h3>{title}</h3>
        <span className="toggle-icon">{isExpanded ? '-' : '+'}</span>
      </div>
      <div className="faq-content">
        {content}
      </div>
    </div>
  );
};

export default FaqItem;
