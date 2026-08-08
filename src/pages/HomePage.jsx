import "./HomePage.css";

import { HeroSectionArt } from "../components/HeroSectionArt/HeroSectionArt";
import { FeatureCard } from "../components/Features/FeatureCard";
import { FaBolt, FaChartLine, FaShieldAlt } from "react-icons/fa";
import { LogoBanner } from "../components/LogoBanner/LogoBanner";
import FaqItem from "../components/FaqItem/FaqItem";
import { faqQuestions } from "../data/predefinedThemes";
import { IoCheckmarkSharp } from "react-icons/io5";
import { FiArrowUpRight } from "react-icons/fi";

/**
 * The landing surface of the preview.
 *
 * Every string names the element it sits in rather than selling a fictional
 * product — you shouldn't have to read marketing copy to work out which token
 * you're looking at. The labels are written at the length real copy would be,
 * because a ten-character hero title tells you nothing about whether your
 * heading font wraps well or how your body text reads at paragraph length.
 */
const HomePage = () => {
  return (
    <section className="preview-page page-landing">
      {/* ---- In-page nav ---- */}
      <nav className="nw-nav">
        <div className="nw-nav-inner">
          <div className="nw-wordmark">
            <span className="nw-logo-mark" aria-hidden="true" />
            Your logo
          </div>
          <div className="nw-nav-links">
            <span className="nw-nav-link">Nav link</span>
            <span className="nw-nav-link">Nav link</span>
            <span className="nw-nav-link">Nav link</span>
          </div>
          <button className="nw-btn nw-btn-primary nw-nav-cta" type="button">
            Primary button
          </button>
        </div>
      </nav>

      {/* ---- Hero ---- */}
      <header className="hero-section">
        <div className="hero-text">
          <div className="eyebrow">Eyebrow label · uses your accent colour</div>
          <h1>
            Hero title — the largest text on the page, set in your{" "}
            <span className="highlight-one">heading font</span>
          </h1>
          <p className="hero-sub">
            Hero subtitle. This is body copy at its default size, written long
            enough to wrap onto several lines — so you can judge line height,
            measure, and how your body font actually reads at paragraph length
            rather than in a single short label.
          </p>
          <div className="hero-buttons">
            <button className="nw-btn nw-btn-primary" type="button">
              Primary button
            </button>
            <button className="nw-btn nw-btn-outline" type="button">
              Secondary button
            </button>
          </div>
          <div className="hero-trust">
            <IoCheckmarkSharp /> Small print · muted secondary text
          </div>
        </div>
        <div className="hero-visual">
          <HeroSectionArt />
        </div>
      </header>

      {/* ---- Logo strip ---- */}
      <div className="logo-strip">
        <div className="logo-strip-label">Section label · muted</div>
        <LogoBanner />
      </div>

      {/* ---- Features ---- */}
      <section className="features-section">
        <div className="section-head">
          <div className="section-eyebrow">Section eyebrow</div>
          <h2 className="section-title">
            Section title — one step down from the hero heading
          </h2>
        </div>
        <div className="features-container">
          <FeatureCard
            icon={FaBolt}
            title="Feature title"
            description="Feature description. Body copy sitting on a card surface rather than the page background — a different contrast pairing than the paragraphs above it."
          />
          <FeatureCard
            icon={FaChartLine}
            title="Feature title"
            description="Feature description. The icon above uses your primary colour; this paragraph uses your text colour at the smaller size cards tend to use."
          />
          <FeatureCard
            icon={FaShieldAlt}
            title="Feature title"
            description="Feature description. Three identical cards, so you can see how surface, border and text tokens repeat consistently across a grid."
          />
        </div>
      </section>

      {/* ---- Showcase band ---- */}
      <section className="showcase-section">
        <div className="showcase-copy">
          <div className="section-eyebrow">Section eyebrow</div>
          <h2 className="section-title">Section title on a tinted band</h2>
          <p className="showcase-body">
            Body paragraph. A longer block of text at genuine reading length, so
            you can see how the body font holds up across several lines and
            whether the text colour keeps enough contrast against the page
            background once the section tint sits underneath it.
          </p>
          <div className="checkmark-container">
            <div className="checkmark-item">
              <IoCheckmarkSharp /> Checklist item
            </div>
            <div className="checkmark-item">
              <IoCheckmarkSharp /> Checklist item
            </div>
            <div className="checkmark-item">
              <IoCheckmarkSharp /> Checklist item
            </div>
            <div className="checkmark-item">
              <IoCheckmarkSharp /> Checklist item
            </div>
          </div>
        </div>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value">12k+</div>
            <div className="stat-label">Stat label</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              4.9<span className="stat-unit">/5</span>
            </div>
            <div className="stat-label">Stat label</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              99.9<span className="stat-unit">%</span>
            </div>
            <div className="stat-label">Stat label</div>
          </div>
          <div className="stat-card stat-card-accent">
            <div className="stat-value">
              30<span className="stat-unit">%</span>
            </div>
            <div className="stat-label">Accent card label</div>
          </div>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className="faq-section">
        <div className="section-head">
          <div className="section-eyebrow">Section eyebrow</div>
          <h2 className="section-title">Accordion / disclosure list</h2>
        </div>
        <div className="faq-container">
          {faqQuestions.map((question, index) => {
            return (
              <FaqItem
                key={index}
                title={question.title}
                content={question.content}
              />
            );
          })}
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="nw-footer">
        <div className="nw-footer-top">
          <div className="nw-footer-brand">
            <div className="nw-wordmark">
              <span className="nw-logo-mark" aria-hidden="true" />
              Your logo
            </div>
            <p className="nw-footer-tagline">
              Footer tagline. Small muted body text, usually a sentence
              describing the product.
            </p>
          </div>
          <div className="nw-footer-cols">
            <div className="nw-footer-col">
              <div className="nw-footer-heading">Footer heading</div>
              <span className="nw-footer-link">Footer link</span>
              <span className="nw-footer-link">Footer link</span>
              <span className="nw-footer-link">Footer link</span>
            </div>
            <div className="nw-footer-col">
              <div className="nw-footer-heading">Footer heading</div>
              <span className="nw-footer-link">Footer link</span>
              <span className="nw-footer-link">Footer link</span>
              <span className="nw-footer-link">Footer link</span>
            </div>
            <div className="nw-footer-col">
              <div className="nw-footer-heading">Footer heading</div>
              <span className="nw-footer-link">Footer link</span>
              <span className="nw-footer-link">Footer link</span>
              <span className="nw-footer-link">
                External link <FiArrowUpRight />
              </span>
            </div>
          </div>
        </div>
        <div className="nw-footer-bottom">
          <span>© 2026 Your company</span>
          <span className="nw-footer-legal">Legal links</span>
        </div>
      </footer>
    </section>
  );
};

export default HomePage;
