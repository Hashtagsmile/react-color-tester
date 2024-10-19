import { Link } from "react-router-dom";
import './Header.css';

const Header = () => {
  return (
    <header className="header">
    <div className="header-container">
    <Link className="nav-link" to ="/">
      <h1 className="header-title">Color Visualizer</h1>
      </Link>
      <nav>
        <ul className="nav">
          <li className="nav-item">
            <Link className="nav-link" to="/">Landing Page</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/about">Sign up / Sign in Page</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/dashboard">Dashboard</Link>
          </li>
        </ul>
      </nav>
      </div>
    </header>
  );
};

export default Header;
