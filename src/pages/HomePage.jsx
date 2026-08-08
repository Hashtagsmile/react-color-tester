import "./HomePage.css";

import { HeroSectionArt } from "../components/HeroSectionArt/HeroSectionArt";
import { FeatureCard } from "../components/Features/FeatureCard";
import { FaBolt, FaChartLine, FaShieldAlt } from "react-icons/fa";
import { LogoBanner } from "../components/LogoBanner/LogoBanner";
import FaqItem from "../components/FaqItem/FaqItem";
import { faqQuestions } from "../data/predefinedThemes";
import { IoCheckmarkSharp } from "react-icons/io5";
import { FiArrowUpRight } from "react-icons/fi";

const HomePage = () => {
  return (
    <section className="preview-page page-landing">
      {/* ---- In-page nav ---- */}
      <nav className="nw-nav">
        <div className="nw-nav-inner">
          <div className="nw-wordmark">
            <span className="nw-logo-mark" aria-hidden="true" />
            Northwind
          </div>
          <div className="nw-nav-links">
            <span className="nw-nav-link">Product</span>
            <span className="nw-nav-link">Pricing</span>
            <span className="nw-nav-link">Docs</span>
          </div>
          <button className="nw-btn nw-btn-primary nw-nav-cta" type="button">
            Start free
          </button>
        </div>
      </nav>

      {/* ---- Hero ---- */}
      <header className="hero-section">
        <div className="hero-text">
          <div className="eyebrow">Northwind · Workflow platform</div>
          <h1>
            Ship work that <span className="highlight-one">moves</span> your
            team forward
          </h1>
          <p className="hero-sub">
            Northwind brings your projects, docs and conversations into one
            calm workspace — so your team spends less time chasing updates and
            more time doing the work that matters.
          </p>
          <div className="hero-buttons">
            <button className="nw-btn nw-btn-primary" type="button">
              Start free trial
            </button>
            <button className="nw-btn nw-btn-outline" type="button">
              Book a demo
            </button>
          </div>
          <div className="hero-trust">
            <IoCheckmarkSharp /> No credit card required · Free for 14 days
          </div>
        </div>
        <div className="hero-visual">
          <HeroSectionArt />
        </div>
      </header>

      {/* ---- Trusted-by logos ---- */}
      <div className="logo-strip">
        <div className="logo-strip-label">Trusted by fast-moving teams</div>
        <LogoBanner />
      </div>

      {/* ---- Features ---- */}
      <section className="features-section">
        <div className="section-head">
          <div className="section-eyebrow">Why teams choose Northwind</div>
          <h2 className="section-title">
            Everything you need, nothing you don&rsquo;t
          </h2>
        </div>
        <div className="features-container">
          <FeatureCard
            icon={FaBolt}
            title="Move faster"
            description="Automate the busywork with rules and templates, and let your team focus on the parts only people can do."
          />
          <FeatureCard
            icon={FaChartLine}
            title="See the whole picture"
            description="Live dashboards turn scattered updates into one clear view of progress, blockers and what's next."
          />
          <FeatureCard
            icon={FaShieldAlt}
            title="Built to trust"
            description="Granular permissions, audit logs and SSO keep your work secure without slowing anyone down."
          />
        </div>
      </section>

      {/* ---- Showcase band ---- */}
      <section className="showcase-section">
        <div className="showcase-copy">
          <div className="section-eyebrow">One workspace</div>
          <h2 className="section-title">One workspace for the whole team</h2>
          <p className="showcase-body">
            Northwind replaces the tangle of tabs, threads and spreadsheets
            your team lives in today. Plan the roadmap, assign the work, track
            progress and share results — all in a single, fast workspace that
            stays out of your way and updates in real time.
          </p>
          <div className="checkmark-container">
            <div className="checkmark-item">
              <IoCheckmarkSharp /> Set up in minutes
            </div>
            <div className="checkmark-item">
              <IoCheckmarkSharp /> Works on every device
            </div>
            <div className="checkmark-item">
              <IoCheckmarkSharp /> Real-time collaboration
            </div>
            <div className="checkmark-item">
              <IoCheckmarkSharp /> Integrates with your stack
            </div>
          </div>
        </div>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value">12k+</div>
            <div className="stat-label">Teams onboarded</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              4.9<span className="stat-unit">/5</span>
            </div>
            <div className="stat-label">Average rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              99.9<span className="stat-unit">%</span>
            </div>
            <div className="stat-label">Uptime last year</div>
          </div>
          <div className="stat-card stat-card-accent">
            <div className="stat-value">
              30<span className="stat-unit">%</span>
            </div>
            <div className="stat-label">Faster delivery</div>
          </div>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className="faq-section">
        <div className="section-head">
          <div className="section-eyebrow">FAQs</div>
          <h2 className="section-title">Frequently asked questions</h2>
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
              Northwind
            </div>
            <p className="nw-footer-tagline">
              One calm workspace for projects, docs and the people doing the
              work.
            </p>
          </div>
          <div className="nw-footer-cols">
            <div className="nw-footer-col">
              <div className="nw-footer-heading">Product</div>
              <span className="nw-footer-link">Features</span>
              <span className="nw-footer-link">Pricing</span>
              <span className="nw-footer-link">Changelog</span>
            </div>
            <div className="nw-footer-col">
              <div className="nw-footer-heading">Company</div>
              <span className="nw-footer-link">About</span>
              <span className="nw-footer-link">Careers</span>
              <span className="nw-footer-link">Blog</span>
            </div>
            <div className="nw-footer-col">
              <div className="nw-footer-heading">Resources</div>
              <span className="nw-footer-link">Docs</span>
              <span className="nw-footer-link">Support</span>
              <span className="nw-footer-link">
                Status <FiArrowUpRight />
              </span>
            </div>
          </div>
        </div>
        <div className="nw-footer-bottom">
          <span>© 2026 Northwind Labs, Inc.</span>
          <span className="nw-footer-legal">Privacy · Terms</span>
        </div>
      </footer>
    </section>
  );
};

export default HomePage;
