import "./FeatureCard.css";

export const FeatureCard = ({ icon: Icon, title, description }) => {
  return (
    <div className="feature-card">
      <div className="circle-icon">
        <Icon size={20} /> {/* Render the passed Icon component */}
      </div>
      <div className="feature-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
};
