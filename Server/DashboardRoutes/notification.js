const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');

// imports the function to get a username from an auth token
const { extractUsernameFromToken } = require('../authMiddleware');

module.exports = (app, con) => {

  app.post('/deleteNotifications', extractUsernameFromToken, async (req, res) => {
    const notificationIds = req.body.notificationIds;

    try {
      // Delete notifications with the given notification IDs
      await queryAsync('DELETE FROM notifications WHERE notificationid IN (?)', [notificationIds]);

      res.status(200).json({ success: true, message: 'Notifications deleted successfully' });
    } catch (error) {
      console.error('Error deleting notifications:', error);
      res.status(500).json({ success: false, message: 'Internal server error while deleting notifications' });
    }
  });

  // Endpoint to list notifications for a specific user and project ID
  app.get('/listNotifications', extractUsernameFromToken, async (req, res) => {
    const username = req.username;
    const projectID = req.query.projectID;

    try {
      // Fetch notifications for the specific user and project ID from the database
      const notifications = await queryAsync(
        'SELECT notificationid, title, description, formatted_timestamp, timestamp FROM notifications WHERE recipient = ? AND projectID = ? ORDER BY timestamp DESC',
        [username, projectID]
      );

      // Map the notifications into an array format
      const notificationArray = notifications.map(notification => ({
        id: notification.notificationid,
        title: notification.title,
        description: notification.description,
        formattedTimestamp: notification.formatted_timestamp,
        read: false,
      }));

      res.status(200).json({ success: true, notifications: notificationArray });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ success: false, message: 'Internal server error while fetching notifications' });
    }
  });

  app.post('/listNotificationSettings', extractUsernameFromToken, async (req, res) => {
    const username = req.username;
    const projectID = req.body.projectID;

    try {
        // Fetch notification settings for the specific user and project ID from the database
        const notificationSettings = await queryAsync(
            'SELECT inAppNotifications, emailNotifications, emailNotificationAssignedTask, emailNotificationTaskModifiedDeleted, emailNotificationUserStoryCreated FROM projectuserlist WHERE username = ? AND projectID = ?',
            [username, projectID]
        );

        console.log(notificationSettings);

        // Check if notification settings exist for the user and project
        if (notificationSettings.length === 0) {
            return res.status(404).json({ success: false, message: 'Notification settings not found' });
        }

        // Extract notification settings from the query result
        const {
            inAppNotifications,
            emailNotifications,
            emailNotificationAssignedTask,
            emailNotificationTaskModifiedDeleted,
            emailNotificationUserStoryCreated
        } = notificationSettings[0];

        // Cast the values to boolean
        const parsedInAppNotifications = !!inAppNotifications;
        const parsedEmailNotifications = !!emailNotifications;
        const parsedAssignedToTask = !!emailNotificationAssignedTask;
        const parsedTaskModifiedDeleted = !!emailNotificationTaskModifiedDeleted;
        const parsedUserStoryCreated = !!emailNotificationUserStoryCreated;

        // Return notification settings as response
        res.status(200).json({
            success: true,
            "notificationSettings": {
              "inAppNotifications": parsedInAppNotifications,
              "emailNotifications": parsedEmailNotifications,
              "assignedToTask": parsedAssignedToTask,
              "taskModifiedDeleted": parsedTaskModifiedDeleted,
              "userStoryCreated": parsedUserStoryCreated
            }
        });
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        res.status(500).json({ success: false, message: 'Internal server error while fetching notification settings' });
    }
  });

  app.post('/updateNotificationSettings', extractUsernameFromToken, async (req, res) => {
    const username = req.username;
    const projectID = req.body.projectID;
    const newSettings = req.body.notificationSettings;

    try {
        // Check if notification settings exist for the user and project
        const existingSettings = await queryAsync(
            'SELECT * FROM projectuserlist WHERE username = ? AND projectID = ?',
            [username, projectID]
        );

        // If settings exist, update existing settings
        await queryAsync(
            'UPDATE projectuserlist SET inAppNotifications = ?, emailNotifications = ?, emailNotificationAssignedTask = ?, emailNotificationTaskModifiedDeleted = ?, emailNotificationUserStoryCreated = ? WHERE username = ? AND projectID = ?',
            [newSettings.inAppNotifications, newSettings.emailNotifications, newSettings.assignedToTask, newSettings.taskModifiedDeleted, newSettings.userStoryCreated, username, projectID]
        );

        res.status(200).json({ success: true, message: 'Notification settings updated successfully' });
    } catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({ success: false, message: 'Internal server error while updating notification settings' });
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