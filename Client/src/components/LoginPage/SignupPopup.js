import React from 'react';
import "./SignupPopup.css";

const signupPopup = ({ onClose }) => {
  return (
    <div className="signup-popup-overlay">
      <div className="signup-popup">
        <div className='header'>Thank You For Joining <span>ScrumDaddy.</span></div>
        <div className='sub-header'>Your account has been successfully registered.</div>
        <p>Check your email for account verification.</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default signupPopup;