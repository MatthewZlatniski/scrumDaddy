import React, { useState } from 'react'
import Axios from 'axios';

import './VerificationPage.css'

const VerificationPage = () => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [registerStatus, setRegisterStatus] = useState('');
  const [successStatus, setSuccessStatus] = useState('false');

  /* sends request to server to verify the account */
  const handleVerificationSubmit = async (e) => {
    e.preventDefault();

    console.log("Verification Submitted:", { email, verificationCode });
    try {
      const response = Axios.post("http://localhost:3001/verification", {
        email: email,
        verificationCode: verificationCode
      }).then((response) => {
        if (response.data.success) {
          console.log("Server responded with a message:", response.data.message);
          setSuccessStatus("true");
          setRegisterStatus(response.data.message);
        }
        else {
          console.log("Server responded with a message:", response.data.message);
          setSuccessStatus("false");
          setRegisterStatus(response.data.message);
        }
      })

    } catch (error) {
      console.error("Error during verification:", error);
      setRegisterStatus("An error occurred during verification. Please try again.");
    }
    setEmail("");
    setVerificationCode("");
  };

  const handleInputFocus = () => {
    setRegisterStatus("");
  };

  return (
    <div className='verification-page'>
      <div className='verification-container'>
        <div className='verification-header'><span>ScrumDaddy</span> Account Verification</div>
        <p className='text'>Verify your account by entering the <span>Email</span> registered to your account and the <span>Verification Token</span> you were sent.</p>
        <form className='submission-form' onSubmit={handleVerificationSubmit}>
          <label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='Email'
              required
              onFocus={handleInputFocus}
            />
          </label>
          <label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength="10"
            placeholder='Verification Code'
            required
            onFocus={handleInputFocus}
          />
          </label>
          <button>Verify</button>
        </form>
        <div className={successStatus === 'true' ? 'success' : 'error'}>{registerStatus}</div>
      </div>
    </div>
  )
}

export default VerificationPage