import React, { useState } from 'react';
import Axios from 'axios';
import './ResetPassword.css';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await Axios.post('http://localhost:3001/reset-password', {
        email,
        verificationCode,
        newPassword,
      });
      setMessage(response.data.message);
    } catch (error) {
      console.error('Error during password reset:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="reset-password-page">
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Verification Code"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit">Reset Password</button>
      </form>
      <p>{message}</p>
    </div>
  );
};

export default ResetPassword;