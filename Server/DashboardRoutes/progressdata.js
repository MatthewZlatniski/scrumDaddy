const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');

// imports the function to get a username from an auth token
const { extractUsernameFromToken } = require('../authMiddleware');

module.exports = (app, con) => {

  app.get('/getProgress', extractUsernameFromToken, async (req, res) => {
    const projectID = req.query.projectID;

    const resultTodo = await queryAsync(
      'SELECT lane FROM taskprojectlist WHERE projectID = (?) AND lane = \'To Do\'',
      [projectID],
    );

    const resultInProgress = await queryAsync(
      'SELECT lane FROM taskprojectlist WHERE projectID = (?) AND (lane = \'In Progress\' OR lane = \'Review\')',
      [projectID],
    );

    const resultCompleted = await queryAsync(
      'SELECT lane FROM taskprojectlist WHERE projectID = (?) AND (lane = \'Completed\' OR lane = \'Done\')',
      [projectID],
    );

    const resultTotal = await queryAsync(
      'SELECT lane FROM taskprojectlist WHERE projectID = (?)',
      [projectID],
    );

    const totalTasks = resultTotal.length;
    const completed = resultCompleted.length;
    const inProgress = resultInProgress.length;
    const todo = resultTodo.length;

    return res.status(200).json({ success: true, totalTasks, completed, inProgress, todo });
});

app.get('/getBurndownData', extractUsernameFromToken, async (req, res) => {
  const projectID = req.query.projectID;
  const chartType = req.query.chartType;

  try {
    let expectedProgress, actualProgress;

    if (chartType === 'sprint') {
      // Fetch the expected and actual progress data for the current sprint
      expectedProgress = await queryAsync(
        'SELECT estimatedhours FROM taskprojectlist WHERE projectID = (?) AND taskstatus = \'Sprint\'',
        [projectID],
      );
      actualProgress = await queryAsync(
        'SELECT loggedhours FROM taskprojectlist WHERE projectID = (?) AND taskstatus = \'Sprint\'',
        [projectID],
      );
    } else {
      // Fetch the expected and actual progress data for the entire project
      expectedProgress = await queryAsync(
        'SELECT estimatedhours FROM taskprojectlist WHERE projectID = (?)',
        [projectID],
      );
      actualProgress = await queryAsync(
        'SELECT loggedhours FROM taskprojectlist WHERE projectID = (?)',
        [projectID],
      );
    }

    // Generate labels for the chart (e.g., sprint weeks)
    const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];

    // Process the data and send the response
    const expectedProgressData = expectedProgress.map(item => item.estimatedhours);
    const actualProgressData = actualProgress.map(item => item.loggedhours);

    return res.status(200).json({
      success: true,
      labels,
      expectedProgress: expectedProgressData,
      actualProgress: actualProgressData,
    });
  } catch (error) {
    console.error('Error fetching burndown data:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch burndown data' });
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