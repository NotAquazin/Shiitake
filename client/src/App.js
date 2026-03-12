import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Map from "./components/Map";
import CRPage from "./components/CRPage";
import Profile from "./components/Profile";
import Search from "./components/Search";

const Home = () => {
  return (
    <div className="container mt-5">
      <h1 className="text-center">Shiitake Interactive Map</h1>
        <div className="mt-4">
        <Map/>
        </div>
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
              <li className="nav-item">
                    <Link className="nav-link" to="/search">Search</Link>
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
                  <li className="nav-item">
                      <Link className="nav-link" to="/profile">Profile</Link>
                  </li>
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
        <Route path="/profile" element={<Profile />} />
        <Route path="/search" element={<Search />} />
        <Route path="/cr/:pk" element={<CRPage />} /> 
        
        // added route
        <Route path="/profile/:pk" element={<Profile />} />
      </Routes>
    </Router>
  );
};

export default App;
