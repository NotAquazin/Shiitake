import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import InteractiveMap from "./components/Map";
import CRPage from "./components/CRPage";
import Profile from "./components/Profile";
import Search from "./components/Search";
import Leaderboard from "./components/Leaderboard";
import AdminPage from "./components/AdminPage.jsx";
import HelpModal from "./components/HelpModal.jsx";

const Home = () => {
  const token = localStorage.getItem('shiitake_token');
  const location = useLocation();
  const targetCR = location.state?.cr || null;

  return (
    <div style={{ minHeight: '100vh', background: '#DFD0B8', padding: '24px 16px' }}>
      <div className="container">
        <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ background: '#153448', padding: '20px 24px', textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '30px', fontFamily: 'Roboto', fontWeight: 700, color: 'white' }}>Shiitake CR Map</h1>
          </div>
          <InteractiveMap 
          targetCR={targetCR || null}
        />
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const username = localStorage.getItem('shiitake_username');
  const userID = localStorage.getItem('shiitake_userID');
  const isLoggedIn = !!localStorage.getItem('shiitake_token');
  const isAdmin = localStorage.getItem('shiitake_role') === 'admin';
  const [showHelp, setShowHelp] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('shiitake_token');
    localStorage.removeItem('shiitake_username');
    localStorage.removeItem('shiitake_userID');
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
              <li className="nav-item">
                    <Link className="nav-link" to="/leaderboard">Leaderboard</Link>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => setShowHelp(true)}
                >
                  Help
                </button>
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
                      <Link className="nav-link" to={`/profile/${userID}`}>Profile</Link>
                  </li>
                  {isAdmin && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/admin">Admin</Link>
                    </li>
                  )}
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
        <Route path="/profile/:pk" element={<Profile />} />
        <Route path="/search" element={<Search />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/cr/:pk" element={<CRPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </Router>
  );
};

export default App;
