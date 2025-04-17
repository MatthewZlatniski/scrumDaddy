const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');

// imports the function to get a username from an auth token
const { extractUsernameFromToken } = require('../authMiddleware');

module.exports = (app, con) => {

  app.post('/addSubtask', extractUsernameFromToken, async (req, res) => {
    const projectID = req.body.projectID;
    const description = req.body.description;
    const taskID = req.body.taskID;

    if (!description) {
      return res.status(200).json({ success: false });
    }

    try {
      const check = await queryAsync(
        'SELECT lane FROM taskprojectlist WHERE taskprojectuserlistID = (?)',
        [taskID]
      );

      // task has been deleted
      if (check.length == 0) {
        return res.status(200).json({ success: false, message: "This task no longer exists. A different user has deleted it. Refresh to see the latest changes." });
      }

      const result = await queryAsync(
        'INSERT INTO subtasks (taskprojectuserlistID, projectID, description, completed) VALUES (?, ?, ?, ?)',
        [taskID, projectID, description, 0]
      );

      const id = result.insertId;

      return res.status(200).json({ success: true, id });
    } catch (error) {
      console.error('Error adding subtask:', error);
      return res.status(500).json({ success: false, message: "An error occurred while adding the subtask." });
    }
  });

  app.get('/listSubtasks', extractUsernameFromToken, async (req, res) => {
    const taskID = req.query.taskID;

    try {
      const result = await queryAsync(
        'SELECT description, completed, subtaskID FROM subtasks WHERE taskprojectuserlistID = (?)',
        [taskID]
      );

      // Map the result rows to the desired format
      const subtasks = result.map(row => ({
        id: row.subtaskID,
        description: row.description,
        completed: row.completed === 1 // Convert completed field from 0/1 to boolean
      }));

    return res.status(200).json({ success: true, subtasks });
    } catch (error) {
      console.error('Error listing subtask:', error);
      return res.status(500).json({ success: false, message: "An error occurred while listing the subtask." });
    }
  });

  app.post('/subtaskCompleted', extractUsernameFromToken, async (req, res) => {
    const subtaskID = req.body.subtaskID;
    const completed = req.body.completed;

    const result = await queryAsync(
      'UPDATE subtasks SET completed = ? WHERE subtaskID = ?',
      [completed, subtaskID]
    );

    return res.status(200).json({ success: true });
  });

  app.post('/deleteSubtask', extractUsernameFromToken, async (req, res) => {
    const subtaskID = req.body.subtaskID;

    const result = await queryAsync(
      'DELETE FROM subtasks WHERE subtaskID = ?',
      [subtaskID]
    );

    return res.status(200).json({ success: true });
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