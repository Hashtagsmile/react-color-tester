import "./HomePage.css";
import chroma from 'chroma-js';

import { useContext } from "react";
import { HeroSectionArt } from "../components/HeroSectionArt/HeroSectionArt";
import { FeatureCard } from "../components/Features/FeatureCard";
import { FaPaintBrush , FaFont } from "react-icons/fa";
import { CiExport } from "react-icons/ci";
import { LogoBanner } from "../components/LogoBanner/LogoBanner";
import FaqItem from "../components/FaqItem/FaqItem";
import { faqQuestions } from "../data/predefinedThemes";
import { IoCheckmarkSharp } from "react-icons/io5";
import { PiMouseScrollLight } from "react-icons/pi";
import { ThemeContext } from "../contexts/ThemeContext";



const isColorDark = (color) => {
  
  if (chroma.valid(color)) {
    return chroma(color).luminance() < 0.5; // Returns true if dark
  } else {
    console.error(`Invalid color: ${color}`);
    return false; // Return false if color is invalid
  }
};



const HomePage = () => {
  const { primaryColor, secondaryColor } = useContext(ThemeContext);

  // Determine if the primary and secondary colors are dark or light
  const primaryTextColor = isColorDark(primaryColor) ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isColorDark(secondaryColor) ? '#FFFFFF' : '#000000';

  return (
    <section className="main-section">
      <div className="hero-section">
        <div className="hero-text">
          <h1>
          Real-Time <span className="highlight-one">Styling</span> &{" "} Real-Time
            <span className="highlight-two"> Results</span>
          </h1>
          <p>
          Curating colors or selecting the right fonts for your project? Experiment with your choices live on an real interactive site using the tools below.
          </p>
          <div className="hero-buttons">
            <button className="btn how-btn"  style={{ backgroundColor: primaryColor, color: primaryTextColor }} >How does it work?</button>
            <button className="btn start-btn"  style={{ backgroundColor: secondaryColor, color: secondaryTextColor }}>Get Started</button>
          </div>
          <div className="scroll-down"> <PiMouseScrollLight/>Scroll down to see more sections</div>
        </div>
        <div className="hero-visual">
          <HeroSectionArt />
        </div>
      </div>
      <div>
        <LogoBanner/>
      </div>
      <div className="features-section">
        <div className="intro">
          <div className="intro title">VISUALIZE IN REAL-TIME</div>
          <div>How does it work?</div>
        </div>
        <div className="features-container">
        <FeatureCard
            icon={FaPaintBrush} // Pass the icon component directly
            title="Dynamic Colors"
            description="Change colors using the navbar, you can change various CSS variables."
          />
          <FeatureCard
            icon={FaFont} // Another icon
            title="Dynamic Fonts"
            description="Try various fonts and play around until you find something you like."
          />
          <FeatureCard
            icon={CiExport} // Another icon
            title="Export"
            description="When you are satisfied with your settings you can export a schema to use in your own project."
          />
        </div>
      </div>
      <div className="tutorial-section">
          <div className="top-content">
          <div className="top-content left">
              <div className="box1">
                <h2></h2>
              </div>
              <div className="box2">
                <h2></h2>
              </div>
              <div className="box3">
                <h2></h2>
              </div>
              <div className="box4">
                <h2></h2>
              </div>
              
            </div>
            <div className="top-content right">
              <h2>Why is This Tool Essential?</h2>
              <h5>Complete Control Over Your Website’s Design! With the powerful theme settings bar, you're in full command of every visual element on your site. Effortlessly customize your website's appearance in real-time as you adjust fonts, colors, and layouts. Instantly tweak your font styles, resize text, and switch up the colors of key CSS elements—like primary, secondary, and accent hues—all with a simple click. The live preview ensures that your changes are reflected instantly, letting you see your vision come to life without delay. Perfect your design with ease and creativity, without coding required! </h5>
              <div className="checkmark-container">
                <div className="checkmark-item">
                  <IoCheckmarkSharp/> 100% Free to Use
                </div>
                <div className="checkmark-item">
                  <IoCheckmarkSharp/> Intuitive and Easy to Navigate
                </div>
                <div className="checkmark-item">
                  <IoCheckmarkSharp/> Live, Real-Time Updates
                </div>
                <div className="checkmark-item">
                  <IoCheckmarkSharp/> Perfect for Designers of All Levels
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="faq-section">
        <div className="intro">
          <div className="intro title">FAQs</div>
          <div>Frequently asked questions</div>
        </div>
        <div className="faq-container">
        {faqQuestions.map((question, index) => {
          return(
            <FaqItem key={index} title={question.title} content={question.content}/>
          );
        })}
        </div>
      </div>
    </section>
  );
};

export default HomePage;
