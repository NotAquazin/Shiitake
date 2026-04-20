import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const { email, password } = formData;

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      // Extract token and save to localStorage
      const { token, user } = response.data;
      if (token) {
        localStorage.setItem('shiitake_token', token);
        if (user && user.username) {
          localStorage.setItem('shiitake_username', user.username);
          localStorage.setItem('shiitake_userID', user.id);
          localStorage.setItem('shiitake_role', user.role || 'user');
        }
        // Redirect to home and force reload to update navbar
        window.location.href = '/';
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#DFD0B8', padding: '60px 16px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '450px' }}>
        <div style={{ background: '#153448', borderRadius: '12px', padding: '30px 24px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', color: 'white' }}>
          
          <h2 style={{ textAlign: 'center', margin: '0 0 24px', fontSize: '24px', fontFamily: 'Roboto, sans-serif' }}>
            Login to Shiitake
          </h2>

          {error && (
            <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', border: '1px solid #f5c6cb' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="email" style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px', color: '#cbd5e1' }}>
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px 12px', fontSize: '14px', borderRadius: '6px', border: '1px solid #948979', background: 'white', color: '#153448', boxSizing: 'border-box' }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="password" style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px', color: '#cbd5e1' }}>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px 12px', fontSize: '14px', borderRadius: '6px', border: '1px solid #948979', background: 'white', color: '#153448', boxSizing: 'border-box' }}
              />
            </div>

            <button 
              type="submit" 
              style={{ width: '100%', background: '#FFA239', color: '#153448', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'background 0.2s' }}
            >
              Login
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;
