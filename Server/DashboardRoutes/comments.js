const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');

// imports the function to get a username from an auth token
const { extractUsernameFromToken } = require('../authMiddleware');

module.exports = (app, con) => {

  app.post('/addComment', extractUsernameFromToken, async (req, res) => {
    try {
      const username = req.username;
      const taskProjectID = req.body.taskProjectID;
      const commenttext = req.body.commenttext;

      const check = await queryAsync(
        'SELECT lane FROM taskprojectlist WHERE taskprojectuserlistID = (?)',
        [taskProjectID]
      );

      // task has been deleted
      if (check.length == 0) {
        return res.status(200).json({ success: false, message: "This task no longer exists. A different user has deleted it. Refresh to see the latest changes." });
      }

      // Insert the comment into the database
      const insertCommentQuery = `
          INSERT INTO comments (taskprojectID, username, commenttext, timeposted, timeedited)
          VALUES (?, ?, ?, NOW(), NOW())
      `;

      // make the query to insert
      await queryAsync(insertCommentQuery, [taskProjectID, username, commenttext]);

      res.status(200).json({
          success: true,
          message: 'Comment added successfully.'
      });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while adding comment.'
        });
    }
  });

  app.get('/listComments', extractUsernameFromToken, async (req, res) => {
    const taskid = req.query.taskId;
    //console.log("task id is ---", taskid);
    try {
      // Fetch comments from the database in order of timeposted (earliest first)
      const selectCommentsQuery = `
          SELECT username, commenttext
          FROM comments
          WHERE taskprojectID = ?
          ORDER BY timeposted ASC
      `;
      const comments = await queryAsync(selectCommentsQuery, [taskid]);

      // Map the comments to an array of objects with text and author properties
      const mappedComments = comments.map(comment => ({
          text: comment.commenttext,
          author: comment.username
      }));

      // respond success
      res.status(200).json({
          success: true,
          comments: mappedComments
      });
    } catch (error) {
      console.error('Error listing comments:', error);
      res.status(500).json({
          success: false,
          message: 'Internal server error while listing comments.'
      });
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