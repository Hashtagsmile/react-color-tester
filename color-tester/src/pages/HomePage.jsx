import './HomePage.css';
import { HeroSectionArt } from '../components/HeroSectionArt/HeroSectionArt';

const HomePage = () => {
  return (
    <section className="hero-section">
      <div className="hero-text">
        <h1>Visualize Your <span className="highlight">Colors</span> & <span className="highlight">Fonts</span> On a Real Site</h1>
        <p>Choosing colors or typography for your website? Use the toolbar below to realize your choices.</p>
        <div className="hero-buttons">
          <button className="btn how-btn">How does it work?</button>
          <button className="btn start-btn">Get Started</button>
        </div>
      </div>
      <div className="hero-visual">
        <HeroSectionArt />
      </div>
    </section>
  );
};

export default HomePage;
