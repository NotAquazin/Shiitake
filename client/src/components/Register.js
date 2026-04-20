import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Reset messages on new submission
    setMessage(null);
    setError(null);

    const { username, email, password } = formData;

    // 1. Frontend Validation
    // Username: Maximum 20 alphanumeric characters
    const usernameRegex = /^[a-zA-Z0-9]{1,20}$/;
    if (!usernameRegex.test(username)) {
      return setError('Username must be 1-20 alphanumeric characters (no spaces or special characters).');
    }

    // Email: Must end in @student.ateneo.edu or @ateneo.edu
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(student\.ateneo\.edu|ateneo\.edu)$/;
    if (!emailRegex.test(email)) {
      return setError('Please use a valid Ateneo email address ending in @student.ateneo.edu or @ateneo.edu.');
    }

    // Password: Minimum 8 characters
    if (password.length < 8) {
      return setError('Password must be at least 8 characters long.');
    }

    // 2. Submit to backend
    try {
      const response = await axios.post('/api/auth/register', {
        username,
        email,
        password
      });

      // Handle success response
      setMessage(response.data.message || 'Registration successful!');
      setFormData({ username: '', email: '', password: '' }); // Clear the form
    } catch (err) {
      // Handle error response from server
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
            Register Account
          </h2>

          {/* Alert for errors */}
          {error && (
            <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', border: '1px solid #f5c6cb' }}>
              {error}
            </div>
          )}
          
          {/* Alert for success message */}
          {message && (
            <div style={{ background: '#d4edda', color: '#155724', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', border: '1px solid #c3e6cb' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="username" style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px', color: '#cbd5e1' }}>
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '10px 12px', fontSize: '14px', borderRadius: '6px', border: '1px solid #948979', background: 'white', color: '#153448', boxSizing: 'border-box' }}
              />
            </div>

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
              Register
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Register;
