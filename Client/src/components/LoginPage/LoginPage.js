import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import './LoginPage.css';

import user_icon from '../Assets/user.png'
import email_icon from '../Assets/email.png'
import password_icon from '../Assets/password.png'
import SignupPopup from './SignupPopup';

const LoginPage = ({ onUpdateTheme }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [action, setAction] = useState("Login");
  const [registerStatus, setRegisterStatus] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const handlePopupClose = () => {
    setShowPopup(false);
    setName("");
    setEmail("");
    setPassword("");
    setAction("Login");
    setRegisterStatus("Complete account verification before logging in.")
  };

  const handleForgotPassword = () => {
    // Navigate to the forgot password page or show a popup
    navigate('/forgot-password');
    console.log("Forgot Password clicked");
  };

  const handleInputFocus = () => {
    setRegisterStatus("");
  };

  const handleSubmitSignUp = async (e) => {
    e.preventDefault();
    console.log('Sign Up Submitted', { name, email, password });
    // Authentication
    // send the name, email, and password to server
    try {
      const response = Axios.post("http://localhost:3001/signup", {
        email: email,
        name: name,
        password: password,
      }).then((response) => {
        if(response.data.success) {
          console.log("Server responded with a message:", response.data.message);
          setRegisterStatus("");
          setShowPopup(true);
        } else {
          console.log("Server responded with a message:", response.data.message);
          setRegisterStatus(response.data.message);
        }
      })
    } catch(error) {
      console.error("Error during signup:", error);
      setRegisterStatus("An error occurred during signup. Please try again.");
    }
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    console.log('Login Submitted', { email, password });
    // Authentication
    // send the name, email, and password to server
    try {
      const response = Axios.post("http://localhost:3001/login", {
        email: email,
        password: password,
      }).then((response) => {
        if(response.data.success) {
          sessionStorage.setItem('authToken', response.data.token);
          const check = sessionStorage.getItem('authToken');
          console.log("stored this auth token: ", { check });
          console.log("Server responded with a message:", response.data.message);
          setRegisterStatus("ACCOUNT LOGIN SUCCESS");

          // set the theme
          console.log(response.data.theme);
          onUpdateTheme(response.data.theme);
          sessionStorage.setItem('theme', response.data.theme);
          sessionStorage.setItem('user', response.data.username);
          navigate('/dashboard');

        } else {
          console.log("Server responded with a message:", response.data.message);
          setRegisterStatus(response.data.message);
          setPassword("");
        }
      })
    } catch(error) {
      console.error("Error during signup:", error);
      setRegisterStatus("An error occurred during signup. Please try again.");
    }
  };

  const handleActionSwap = () => {
    setEmail('');
    setName('');
    setPassword('');
    setRegisterStatus("");
    if (action === "Sign Up") {
      setAction('Login');
    }
    else {
      setAction("Sign Up");
    }
  };


  return (
    <div className='login-page'>
      <div className={action==="Sign Up" ? "login-container left" : "login-container right"}>
        {action==="Sign Up" ?
          <div className="left-side-container">
              <div className='left-side-header'>Already Have an Account?</div>
              <div className='underline'></div>
              <p>To continue where you left off, please login with your existing credentials</p>

              <button onClick={handleActionSwap}>Login</button>
          </div>
          :
          <div className="left-side-container">
              <div className='left-side-header'>New to ScrumDaddy?</div>
              <div className='underline'></div>
              <p>Welcome to our Scrum task manager! Create a new account to get started</p>

              <button onClick={handleActionSwap}>Sign Up</button>
          </div>
        }
        <div className='right-side-container'>
          <div className='right-side-header'>
            {action==="Sign Up" ?
              <div className='text'>Create Account</div>
              :
              <div className='text'>Login to Account</div>
            }
            <div className='underline'></div>
            <div className='error-message'>{registerStatus}</div>
          </div>
          <form className='submission-form' onSubmit={action==="Sign Up" ? handleSubmitSignUp : handleSubmitLogin}>

            {action==="Sign Up" ?
              <label className='name'>
                <img src={user_icon} />
                <input
                  type='text'
                  placeholder='Name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete='off'
                  onFocus={handleInputFocus}
                />
              </label>
              :
              <div></div>
            }
            <label className='email'>
              <img src={email_icon} />
              <input
                type='email'
                placeholder='Email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete='off'
                onFocus={handleInputFocus}
              />
            </label>
            <label className='password'>
              <img src={password_icon} />
              <input
                type='password'
                placeholder='Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete='off'
                onFocus={handleInputFocus}
              />
            </label>
            <div className="forgot-password">
  <span onClick={handleForgotPassword}>Forgot Password?</span>
</div>
            <button>{action}</button>
          </form>
        </div>
      </div>
      {showPopup && <SignupPopup onClose={handlePopupClose} />}
    </div>
  );
}

export default LoginPage;
