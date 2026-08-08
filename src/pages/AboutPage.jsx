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
    { icon: <FaGoogle />, label: "Continue with Google" },
    { icon: <FaApple />, label: "Continue with Apple" },
    { icon: <FaXTwitter />, label: "Continue with X" },
  ];

  const benefits = [
    "Unlimited projects on every plan",
    "SOC 2 Type II compliant by default",
    "Ship in minutes, not months",
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
            <img className="signin-wordmark" src={logo1} alt="Logoipsum" />
          </div>
          <div className="signin-brand-body">
            <p className="signin-eyebrow">Welcome back</p>
            <h2 className="signin-brand-headline">
              The workspace your whole team actually enjoys using.
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
            Trusted by 12,000+ teams shipping every day.
          </p>
        </aside>

        {/* RIGHT — form area */}
        <div className="signin-main">
          <div className="signin-form-wrap">
            <header className="signin-head">
              <h1 className="signin-title">Sign in to your account</h1>
              <p className="signin-sub">
                Enter your details below to pick up where you left off.
              </p>
            </header>

            <form className="signin-form" onSubmit={handleSubmit}>
              <label className="signin-field">
                <span className="signin-label">Email</span>
                <input
                  className="signin-input"
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  autoComplete="off"
                  aria-label="Email"
                />
              </label>

              <label className="signin-field">
                <span className="signin-label">Password</span>
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
                  <span>Remember me</span>
                </label>
                <a href="#" className="signin-forgot">
                  Forgot password?
                </a>
              </div>

              <button type="submit" className="signin-submit">
                Sign in
              </button>
            </form>

            <div className="signin-divider">
              <span>or continue with</span>
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
              Don’t have an account?{" "}
              <a href="#" className="signin-alt-link">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutPage;
