import "./HomePage.css";
import { HeroSectionArt } from "../components/HeroSectionArt/HeroSectionArt";
import { FeatureCard } from "../components/Features/FeatureCard";
import { FaRegChartBar, FaCog, FaPenFancy } from "react-icons/fa";

const HomePage = () => {
  return (
    <section className="main-section">
      <div className="hero-section">
        <div className="hero-text">
          <h1>
            Visualize Your <span className="highlight">Colors</span> &{" "}
            <span className="highlight">Fonts</span> On a Real Site
          </h1>
          <p>
            Choosing colors or typography for your website? Use the toolbar
            below to realize your choices.
          </p>
          <div className="hero-buttons">
            <button className="btn how-btn">How does it work?</button>
            <button className="btn start-btn">Get Started</button>
          </div>
        </div>
        <div className="hero-visual">
          <HeroSectionArt />
        </div>
      </div>
      <div className="features-section">
        <div className="intro">
          <div className="intro title">EVERYTHING YOU NEED</div>
          <div>Features</div>
        </div>
        <div className="features-container">
        <FeatureCard
            icon={FaRegChartBar} // Pass the icon component directly
            title="Analytics"
            description="Visualize and track your metrics."
          />
          <FeatureCard
            icon={FaCog} // Another icon
            title="Customization"
            description="Easily customize your website."
          />
          <FeatureCard
            icon={FaPenFancy} // Another icon
            title="Design"
            description="Beautiful designs and typography."
          />
        </div>
      </div>
    </section>
  );
};

export default HomePage;
