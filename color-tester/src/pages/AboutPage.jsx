import { FaXTwitter } from "react-icons/fa6";
import { useState } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaApple,
  FaGoogle,
  FaPhoneAlt,
} from "react-icons/fa";
import logo1 from "../assets/logo1.svg";
import "./AboutPage.css";

import { isColorLight, getCSSVariableValue } from "../utilities/utilities";

const AboutPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const icons = [<FaGoogle />, <FaApple />, <FaPhoneAlt />, <FaXTwitter />];


  const [textColor, setTextColor] = useState(
    getCSSVariableValue("--color-text")
  );

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent form reload
    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");
    console.log("Email:", email);
    console.log("Password:", password);
  };

  return (
    <section>
      <div className="login-container">
        <div className="login-card">
          <form className="login-form" onSubmit={handleSubmit}>
          <img className="logo" src={logo1} alt="logo" />
            <h5>Sign in to your account.</h5>
            <input
              type="text"
              name="email"
              placeholder="Email"
              autoComplete="off"
              aria-label="Email"
            />
            <br></br>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"} // Toggle between text and password
                name="password"
              />
              <span
                onClick={togglePasswordVisibility}
                className="password-icon"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <div className="form-footer">
            <label>
              <input type="checkbox" />
              <span></span>
              <small className="rmb">Remember me</small>
            </label>
            <a href="#" className="forgetpass">
              Forget Password?
            </a>
            </div>
            <br/>
            <button type="submit" style={{color: isColorLight(textColor) ? "#000" : "#fff"}}>Sign in</button>
          </form>
          <a href="#" className="dnthave">
            Don’t have an account? Sign up
          </a>
          <div className="divider">
            <span>or</span>
          </div>
          <div className="alternatives">
            {icons.map((icon, index) => {
              return (<div key={index} className="circle-login">{icon}</div>);
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutPage;
