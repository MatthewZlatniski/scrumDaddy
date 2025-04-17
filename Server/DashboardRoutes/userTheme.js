const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');

// imports the function to get a username from an auth token
const { extractUsernameFromToken } = require('../authMiddleware');

module.exports = (app, con) => {

  app.get('/userTheme', extractUsernameFromToken, async (req, res) => {
    const username = req.username;

    try {
      // Query the database to get the user's theme based on their username
      const result = await queryAsync('SELECT theme FROM users WHERE username = ?', [username]);

      if (result.length > 0) {
        const userTheme = result[0].theme;
        console.log("users theme is: ", {userTheme});
        res.json({ success: true, userTheme });
      } else {
        res.status(404).json({ success: false, error: 'User not found' });
      }
    } catch (error) {
      console.error('Error fetching user theme:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }

  });

  // Route to update the user's theme
  app.post('/changeTheme', extractUsernameFromToken, async (req, res) => {
    const username = req.username;

    console.log("switch theme");

    try {
      // Fetch the current theme from the database
      const currentThemeResult = await queryAsync('SELECT theme FROM users WHERE username = ?', [username]);

      if (currentThemeResult.length > 0) {
        const currentTheme = currentThemeResult[0].theme;

        // Determine the new theme based on the current theme
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        // Update the user's theme in the database
        await queryAsync('UPDATE users SET theme = ? WHERE username = ?', [newTheme, username]);

        res.json({ success: true, message: 'Theme updated successfully', newTheme });
      } else {
        res.status(404).json({ success: false, error: 'User not found' });
      }
    } catch (error) {
      console.error('Error updating user theme:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
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


  return router;
}