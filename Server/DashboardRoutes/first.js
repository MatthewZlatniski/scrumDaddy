const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');

// imports the function to get a username from an auth token
const { extractUsernameFromToken } = require('../authMiddleware');

module.exports = (app, con) => {
  app.get('/first', extractUsernameFromToken, async (req, res) => {
    const username = req.username;

    try {
      const result = await queryAsync(
        'SELECT first FROM users WHERE username = ?',
        [username]
      );

      if (result.length === 0) {
        return res.status(404).json({ success: false, message: "User not found." });
      }

      const firstValue = result[0].first;
      return res.status(200).json({ success: true, first: firstValue });
    } catch (error) {
      console.error('Error fetching first value:', error);
      return res.status(500).json({ success: false, message: "An error occurred while fetching the first value." });
    }
  });

  app.post('/updateFirst', extractUsernameFromToken, async (req, res) => {
    const username = req.username;

    try {
      const result = await queryAsync(
        'UPDATE users SET first = 1 WHERE username = ?',
        [username]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "User not found." });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating first value:', error);
      return res.status(500).json({ success: false, message: "An error occurred while updating the first value." });
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