import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';

const Home = () => {
  return (
    <div className="container mt-5">
      <h1 className="text-center">Shiitake Interactive Map</h1>
    </div>
  );
};

const App = () => {
  const username = localStorage.getItem('shiitake_username');
  const isLoggedIn = !!localStorage.getItem('shiitake_token');

  return (
    <Router>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand" to="/">Shiitake</Link>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/">Home</Link>
              </li>
              {!isLoggedIn ? (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">Login</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/register">Register</Link>
                  </li>
                </>
              ) : (
                <li className="nav-item d-flex align-items-center">
                  <span className="navbar-text ms-3 text-white fw-bold">Hello, {username || 'User'}</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
};

export default App;
