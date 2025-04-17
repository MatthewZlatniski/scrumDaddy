const express = require("express");
const router = express.Router();
const bcryptjs = require('bcryptjs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const userTheme = require("./DashboardRoutes/userTheme");

const { extractUsernameFromToken } = require('./authMiddleware');

module.exports = (app, con) => {
  function generateVerificationToken() {
    return Math.random().toString(36).substr(2, 10); // Generate a random string
  }

  // Function to send verification email
  async function sendVerificationEmail(email, token) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 465,
      secure: false,
      logger: true,
      debug: true,
      secureConnection: false,
      auth: {
        user: 'noreplyscrumdaddy@gmail.com', // Your Gmail email address
        pass: 'egpndlwyujkiupur' // Your Gmail password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: 'noreplyscrumdaddy@gmail.com',
      to: email,
      subject: 'Verify Your Email Address',
      text: `Click on the following link to verify your email: http://localhost:3000/verification \nand your code is ${token}`
    };
    console.log("Email abt to send");
    await transporter.sendMail(mailOptions);
  }
  app.post("/signup", async (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    console.log("got sign up request", { name, email, password });

    try {
      // check that no fields are empty
      if (!email || !name || !password) {
        console.log("Empty Field Deteced");
        return res.status(200).json({ success: false, message: "Please provide input for all fields." });
      }

      // check if email is registered
      const emailResult = await queryAsync('SELECT * FROM users WHERE email = ?', [email]);
      if (emailResult.length > 0) {
        return res.status(200).json({ success: false, message: "Email already registered." });
      }

      // check if username is registered
      const usernameResult = await queryAsync('SELECT * FROM users WHERE username = ?', [name]);
      if (usernameResult.length > 0) {
        return res.status(200).json({ success: false, message: "Username already taken." });
      }
      //generate token
      const verificationToken = generateVerificationToken();

      // hash the password
      const hashedPassword = await bcryptjs.hash(password, 12);
      const insertResult = await queryAsync('INSERT INTO users (username, email, password, verification_token, isVerified, theme, onelinestatus) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, email, hashedPassword, verificationToken, 0, "light", 0]);

      //send verification email
      await sendVerificationEmail(email, verificationToken);
      console.log("User inserted into database successfully.");
      return res.status(200).json({ success: true, message: "User registered successfully." });
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
  });

  function generatePasswordResetToken() {
    return Math.random().toString(36).substr(2, 10); // Generate a random string
  }
  
  async function sendPasswordResetEmail(email, token) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 465,
      secure: false,
      logger: true,
      debug: true,
      secureConnection: false,
      auth: {
        user: 'noreplyscrumdaddy@gmail.com',
        pass: 'egpndlwyujkiupur'
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  
    const mailOptions = {
      from: 'noreplyscrumdaddy@gmail.com',
      to: email,
      subject: 'Reset Your Password',
      text: `Click on the following link to reset your password: http://localhost:3000/reset-password \nand your code is ${token}`
    };
    console.log("Password reset email about to send");
    await transporter.sendMail(mailOptions);
  }

  app.post('/changePassword', extractUsernameFromToken, async (req, res) => {
    try {
      const username = req.username;
      const { oldPassword, newPassword } = req.body;
  
      // Check if the old password and new password are provided
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Please provide both old and new passwords.' });
      }
  
      // Retrieve the user from the database based on the username
      const user = await queryAsync('SELECT * FROM users WHERE username = ?', [username]);
  
      if (user.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
  
      // Compare the provided old password with the hashed password stored in the database
      const isPasswordValid = await bcryptjs.compare(oldPassword, user[0].password);
  
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid old password.' });
      }
  
      // Hash the new password
      const hashedPassword = await bcryptjs.hash(newPassword, 12);
  
      // Update the user's password in the database
      await queryAsync('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, username]);
  
      return res.status(200).json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
      console.error('Error changing password:', error);
      return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  });
  
  app.post('/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      const user = await queryAsync('SELECT * FROM users WHERE email = ?', [email]);
      if (user.length === 0) {
        return res.status(200).json({ success: false, message: 'Email not found.' });
      }
  
      const resetToken = generatePasswordResetToken();
  
      await queryAsync('UPDATE users SET passwordrecoverytoken = ? WHERE email = ?', [resetToken, email]);
  
      await sendPasswordResetEmail(email, resetToken);
  
      res.status(200).json({ success: true, message: 'Password reset email sent.' });
    } catch (error) {
      console.error('Error during forgot password:', error);
      res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  });
  
  app.post('/reset-password', async (req, res) => {
    try {
      const { email, verificationCode, newPassword } = req.body;
      const user = await queryAsync('SELECT * FROM users WHERE email = ? AND passwordrecoverytoken = ?', [email, verificationCode]);
      if (user.length === 0) {
        return res.status(200).json({ success: false, message: 'Invalid email or verification code.' });
      }
  
      const hashedPassword = await bcryptjs.hash(newPassword, 10);
      await queryAsync('UPDATE users SET password = ?, passwordrecoverytoken = NULL WHERE email = ?', [hashedPassword, email]);
  
      res.status(200).json({ success: true, message: 'Password reset successful.' });
    } catch (error) {
      console.error('Error during password reset:', error);
      res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  });

  // Utility function to promisify the MySQL queries
function queryAsync(sql, params) {
  return new Promise((resolve, reject) => {
      con.query(sql, params, (err, result) => {
          if (err) {
              reject(err);
          } else {
              resolve(result);
          }
      });
  });
}

  app.post("/login", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    console.log("got login request", { email, password });

    // check that no fields are empty
    if (!email || !password) {
      console.log("Empty Field Deteced");
      return res.status(200).json({ success: false, message: "Please provide input for all fields." });
    }
    //needed to update online status
    const sqlUpdateOnlineStatus = 'UPDATE users SET onelinestatus = 1 WHERE email = ?';
    var sql = 'SELECT * FROM users WHERE email = ?';
    try {
      // check that the email is registered in the database
      const result = await queryAsync('SELECT * FROM users WHERE email = ?', [email]);

      if (result.length > 0) {
        console.log("Email is registered");
        const hashedPassword = result[0].password;

        // check that the account has been verified
        if (!result[0].isVerified) {
          return res.status(200).json({ success: false, message: "Complete account verification before logging in." });
        }

        // check that the passwords match
        const isMatch = await bcryptjs.compare(password, hashedPassword);

        if (isMatch) {
          console.log("Passwords Matched.");
          //users online status needs to be updated
          const ostat = await queryAsync('UPDATE users SET onelinestatus = 1 WHERE email = ?', [email]);


          // Generate an authentication token
          const authToken = jwt.sign({ username: result[0].username }, 'scrum-key', { expiresIn: '1h' });

          // Query the database to get the user's theme based on their username
          const themeresult = await queryAsync('SELECT theme FROM users WHERE username = ?', [result[0].username]);

          if (themeresult.length > 0) {
            const userTheme = themeresult[0].theme;
            return res.status(200).json({ success: true, message: "Login success.", username: result[0].username, token: authToken, theme: userTheme });// Include the token in the response
          } else {
            res.status(404).json({ success: false, error: 'User not found' });
          }
        } else {
          console.log('Password does not match.');
          return res.status(200).json({ success: false, message: "Incorrect Password." });
        }
      } else {
        console.log("Email is NOT registered");
        return res.status(200).json({ success: false, message: "Email is not registered to an account." });
      }
    } catch (error) {
      console.error("Error during login:", error);
      return res.status(500).json({ success: false, message: "Internal server error." });
    }
  });

  //logout
  app.post("/logout", extractUsernameFromToken, async (req, res) => {
    const username = req.username; // Assuming the username is extracted from the token
    console.log("logging out");
  
    try {
      // Update the user's online status to 0 in the database
      const updateResult = await queryAsync('UPDATE users SET onelinestatus = 0 WHERE username = ?', [username]);
  
      if (updateResult.affectedRows > 0) {
        console.log("User's online status updated successfully.");
        return res.status(200).json({ success: true, message: "User logged out successfully." });
      } else {
        console.log("No user found with the provided username.");
        return res.status(404).json({ success: false, message: "User not found." });
      }
    } catch (error) {
      console.error("Error updating online status:", error);
      return res.status(500).json({ success: false, message: "Internal server error updating status." });
    }
  });

  
  app.get("/verify/:token", async (req, res) => {
  const token = req.params.token; // Extract the token from the request query
  console.log("Received token:", token); // Check if token is correctly received

  // Check if the token exists in the database
  const user = await queryAsync('SELECT * FROM users WHERE verification_token = ?', [token]);
  if (user.length === 0) {
    // Token not found, handle accordingly (e.g., display an error message)
    return res.status(400).send("Invalid or expired verification token.");
  }

  // Update the user's verification status in the database based on the user's ID
  await queryAsync('UPDATE users SET verified = ? WHERE id = ?', [true, user[0].id]);

  // Redirect the user to a success page or display a success message
  res.status(200).send("Your email has been successfully verified.");
});

  return router;
};