import { FaXTwitter } from "react-icons/fa6";
import { useState } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaApple,
  FaGoogle,
  FaCheck,
} from "react-icons/fa";
import logo1 from "../assets/logo1.svg";
import "./AboutPage.css";

const AboutPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  const socials = [
    { icon: <FaGoogle />, label: "Tertiary button" },
    { icon: <FaApple />, label: "Tertiary button" },
    { icon: <FaXTwitter />, label: "Tertiary button" },
  ];

  // Text on the tinted brand panel — a different background from the form side,
  // and historically where a low-contrast palette shows up first.
  const benefits = [
    "List item on the brand panel",
    "List item on the brand panel",
    "List item on the brand panel",
  ];

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent form reload
    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");
    // email + password would be submitted to an auth endpoint here.
    void email;
    void password;
  };

  return (
    <section className="preview-page page-signin">
      <div className="signin-shell">
        {/* LEFT — brand panel */}
        <aside className="signin-brand">
          <div className="signin-brand-glow" aria-hidden="true" />
          <div className="signin-brand-top">
            <img className="signin-wordmark" src={logo1} alt="Your logo" />
          </div>
          <div className="signin-brand-body">
            <p className="signin-eyebrow">Eyebrow label</p>
            <h2 className="signin-brand-headline">
              Panel headline — heading text sitting on a tinted brand surface
              rather than the page background.
            </h2>
            <ul className="signin-benefits">
              {benefits.map((benefit) => (
                <li key={benefit} className="signin-benefit">
                  <span className="signin-benefit-check">
                    <FaCheck />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <p className="signin-brand-foot">
            Panel footnote · muted small text
          </p>
        </aside>

        {/* RIGHT — form area */}
        <div className="signin-main">
          <div className="signin-form-wrap">
            <header className="signin-head">
              <h1 className="signin-title">Form title</h1>
              <p className="signin-sub">
                Form subtitle. Body copy under a heading, at the size supporting
                text usually sits at.
              </p>
            </header>

            <form className="signin-form" onSubmit={handleSubmit}>
              <label className="signin-field">
                <span className="signin-label">Field label</span>
                <input
                  className="signin-input"
                  type="email"
                  name="email"
                  placeholder="Placeholder text"
                  autoComplete="off"
                  aria-label="Email"
                />
              </label>

              <label className="signin-field">
                <span className="signin-label">Field label</span>
                <div className="signin-password">
                  <input
                    className="signin-input"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="signin-eye"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </label>

              <div className="signin-row">
                <label className="signin-remember">
                  <input type="checkbox" className="signin-check" />
                  <span>Checkbox label</span>
                </label>
                <a href="#" className="signin-forgot">
                  Inline link
                </a>
              </div>

              <button type="submit" className="signin-submit">
                Primary button
              </button>
            </form>

            <div className="signin-divider">
              <span>Divider label</span>
            </div>

            <div className="signin-socials">
              {socials.map((social) => (
                <button
                  key={social.label}
                  type="button"
                  className="signin-social"
                  aria-label={social.label}
                >
                  {social.icon}
                </button>
              ))}
            </div>

            <p className="signin-alt">
              Secondary text with an{" "}
              <a href="#" className="signin-alt-link">
                inline link
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutPage;
