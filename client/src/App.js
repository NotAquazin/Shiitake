import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';import InteractiveMap from './components/InteractiveMap';

const Home = () => {
  const token = localStorage.getItem('shiitake_token');

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Shiitake CR Navigator</h1>
      {token ? (
        <InteractiveMap />
      ) : (
        <div className="alert alert-info text-center">
          <h4>Welcome to the Ateneo CR Navigator!</h4>
          <p>Please <Link to="/login">Login</Link> or <Link to="/register">Register</Link> to view the interactive map.</p>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const username = localStorage.getItem('shiitake_username');
  const isLoggedIn = !!localStorage.getItem('shiitake_token');

  const handleLogout = () => {
    localStorage.removeItem('shiitake_token');
    localStorage.removeItem('shiitake_username');
    window.location.href = '/login'; // Redirect to login
  };

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
                <>
                  <li className="nav-item d-flex align-items-center">
                    <span className="navbar-text ms-3 text-white fw-bold me-3">Hello, {username || 'User'}</span>
                  </li>
                  <li className="nav-item d-flex align-items-center">
                    <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">Logout</button>
                  </li>
                </>
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
