import React from "react";
import "../styles/Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* Logo Section */}
        <div className="logo">
          <img 
            src="/images/court of arms.png" 
            alt="Parliament Logo" 
            className="logo-image" 
          />
          <span>Parliament Visit</span>
        </div>

        {/* Navigation Links */}
        <ul className="nav-links">
          <li><a href="#">Home</a></li>
          <li><a href="#">About Parliament</a></li>
          <li><a href="#">Visit Parliament</a></li>
          <li><a href="#">Contact</a></li>
        </ul>

      </div>
    </nav>
  );
}

export default Navbar;