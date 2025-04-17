const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');

// imports the function to get a username from an auth token
const { extractUsernameFromToken } = require('../authMiddleware');

module.exports = (app, con) => {

  app.get('/listProjects', extractUsernameFromToken, async (req, res) => {
    const username = req.username;

    try {
      // query the projectuserlist to get project IDs and permissions
      const projectIDQuery = await queryAsync(
        'SELECT pu.projectID, pu.permission, pl.projectName FROM projectuserlist pu INNER JOIN projectlist pl ON pu.projectID = pl.projectID WHERE username = ?',
        [username],
      );

      // Extract the project IDs and permissions
      const projects = projectIDQuery.map((result) => ({
        projectID: result.projectID,
        projectName: result.projectName,
        permission: parseInt(result.permission, 16), // Convert binary permission to integer
      }));


      // Return the list of projects
      return res.status(200).json({ success: true, projects });

    } catch (error) {
      console.error("Error listing projects:", error);
      return res.status(500).json({ success: false, message: "Internal server error listing projects." });
    }

  });



  app.post('/listTask', extractUsernameFromToken, async (req, res) => {
    const username = req.username;
    const projectID = req.body.projectID;

    try {
      // find all active/not backlogged tasks
      const active = await queryAsync(
        'SELECT * FROM taskprojectlist WHERE projectID = ?',
        [projectID],
      );

      // Map the fields to the expected format
      const tasks = active.map(row => ({
        id: row.taskprojectuserlistID,
        title: row.taskname,
        type: row.taskType,
        typeDescription: row.taskdescription,
        description: row.taskdescription,
        originalEstimate: row.estimatedhours,
        status: row.taskstatus,
        lane: row.lane, // If you have a field for 'lane' in your database, otherwise modify accordingly
        priority: row.priority,
        loggedHours: row.loggedhours, // You may need to fetch this from another source
        assigneeInitials: row.assigneduser ? row.assigneduser.charAt(0).toUpperCase() : '',
        assignees: row.assigneduser,
        assignedStoryTitle: row.assignedStoryTitle,
      }));

      return res.status(200).json({ success: true, tasks });
    } catch (error) {
      console.error("Error listing tasks:", error);
      return res.status(500).json({ success: false, message: "Internal server error listing tasks." });
    };
  });

  app.post('/listTaskForCurrentSprint', extractUsernameFromToken, async (req, res) => {
    const username = req.username;
    const projectID = req.body.projectID;

    try {
      // find all active/not backlogged tasks
      const active = await queryAsync(
        'SELECT * FROM taskprojectlist WHERE projectID = ? AND taskstatus = ?',
        [projectID, 'Sprint'],
      );

      // Map the fields to the expected format
      const tasks = active.map(row => ({
        id: row.taskprojectuserlistID,
        title: row.taskname,
        type: row.taskType,
        typeDescription: row.taskdescription,
        description: row.taskdescription,
        originalEstimate: row.estimatedhours,
        status: row.taskstatus,
        lane: row.lane, // If you have a field for 'lane' in your database, otherwise modify accordingly
        priority: row.priority,
        loggedHours: row.loggedhours, // You may need to fetch this from another source
        assigneeInitials: row.assigneduser ? row.assigneduser.charAt(0).toUpperCase() : '',
        assignees: row.assigneduser,
        assignedStoryTitle: row.assignedStoryTitle,
      }));

      return res.status(200).json({ success: true, tasks });
    } catch (error) {
      console.error("Error listing tasks:", error);
      return res.status(500).json({ success: false, message: "Internal server error listing tasks." });
    };
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