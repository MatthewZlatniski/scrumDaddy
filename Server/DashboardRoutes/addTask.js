const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');

// imports the function to get a username from an auth token
const { extractUsernameFromToken } = require("../authMiddleware");

/*
  Task status bits
  In backlog
  001 - 1 - Backlogged
  In sprint
  100 - 4 - TODO
  101 - 5 - In Progress
  110 - 6 - Review
  111 - 7 - Completed

  Permission Bits
  000 - 0 - View only 
  001 - 1 - Comment
  010 - 2 - Edit 
  011 - 3 - Assign Users

*/

const PROJ_VIEW_PERM = 0b000;
const PROJ_COMMENT_PERM = 0b001;
const PROJ_EDIT_PERM = 0b010;
const PROJ_ASSIGN_PERM = 0b011;

module.exports = (app, con) => {
  app.post("/addTask", extractUsernameFromToken, async (req, res) => {
    // get parameters
    const username = req.username;
    const projectID = req.body.projectID;
    const taskName = req.body.taskName;
    const taskType = req.body.taskType;
    // optional
    const taskDescription = req.body.taskDescription;
    const estimatedHours = req.body.estimatedHours;
    const loggedHours = 0;
    const assignedUser = req.body.assignedUser;
    const reporter = req.body.reporter;
    const priority = req.body.priority;
    const assignedStoryID = req.body.assignedStoryID;
    const assignedStoryTitle = req.body.assignedStoryTitle;

    console.log(assignedStoryID);

    /* determine taskstatus by the userstory it is assigned to */
    const currentSprintRes = await queryAsync (
      'SELECT currentSprint FROM projectlist WHERE projectID = ?',
      [projectID]
    );

    const userStorySprintRes = await queryAsync(
      'SELECT assignedSprint FROM userStories WHERE userStoryID = ?',
      [assignedStoryID]
    );

    let taskStatus = 'Backlog';
    if (userStorySprintRes[0].assignedSprint == currentSprintRes[0].currentSprint) {
      taskStatus = 'Sprint';
    }

    console.log("adding task: ", {
      username,
      projectID,
      taskName,
      taskStatus,
      taskDescription,
      estimatedHours,
      loggedHours,
      assignedUser,
      reporter,
    });

    // check for invalid form
    if (!taskDescription || !taskName || !estimatedHours || !priority || !taskType) {
      return res.status(200).json({ success: false, message: "Must fill in all input fields." })
    }

    try {
      // check user has access to project
      const permissionResult = await queryAsync(
        "SELECT username, projectID, permission FROM projectuserlist WHERE username = ? AND projectID = ?",
        [username, projectID]
      );

      if ((permissionResult.length == 0) && (assignedUser != '')) {
        console.log(
          "User does not have project permission \n projectuserlist does not contain a row with the projectID and username"
        );

        return res.status(500).json({
          success: false,
          message: "Internal server error during add project.",
        });
      }

      const userPermission = parseInt(permissionResult[0].permission, 16);
      if (userPermission == 1) {
        // then they can only add themselves
        if ((username != assignedUser) && (assignedUser != '')) {
          return res.status(200).json({ success: false, message: "You do not have permission to assign the selected user." });
        }
      }

      // add task to project
      await queryAsync(
        "INSERT INTO `taskprojectlist` ( `projectID`, `taskname`, `taskType`, `taskstatus`, `taskdescription`, `estimatedhours`, `loggedhours`, `assigneduser`, `reporter`, `priority`, `lane`, `assignedStoryID`, `assignedStoryTitle` ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ",
        [
          projectID,
          taskName,
          taskType,
          taskStatus,
          taskDescription,
          estimatedHours,
          loggedHours,
          assignedUser,
          reporter,
          priority,
          "To Do",
          assignedStoryID,
          assignedStoryTitle
        ]
      );

      await queryAsync(
        'UPDATE userStories SET unfinishedTaskCount = unfinishedTaskCount + 1 WHERE userStoryID = ?',
        [assignedStoryID]
      )

      //need to see whether to show in app
      if ((assignedUser) && (assignedUser != username)) {
        const notificationTitle = `Assigned to Task '${taskName}'`;
        const notificationDescription = `You have been assigned to the NEWLY CREATED task '${taskName}' with the following details:\n\nDescription: ${taskDescription}\nEstimated Hours: ${estimatedHours}\nAssigned by: ${username}`;

        const ct = await queryAsync(
          'SELECT inAppNotifications, emailNotifications, emailNotificationAssignedTask FROM projectuserlist WHERE username = ? AND projectID = ?',
          [assignedUser, projectID]
        )

        const em = await queryAsync(
          'SELECT email FROM users WHERE username = ?',
          [assignedUser]
        )
        const pn = await queryAsync(
          'SELECT projectName FROM projectlist WHERE projectID = ?',
          [projectID]
        )

        //has notification enabled
        if (ct[0].inAppNotifications == 1){
          await queryAsync(
            "INSERT INTO notifications (title, description, recipient, projectID) VALUES (?, ?, ?, ?)",
            [notificationTitle, notificationDescription, assignedUser, projectID]
          );
        }

        //check to send email
        if (ct[0].emailNotifications == 1 && ct[0].emailNotificationAssignedTask == 1){
          //create email transport
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
        
        // Send email to product owner with the average score information
        const mailOptions = {
        from: 'your_email@example.com',
        to: em[0].email,
        subject: `${notificationTitle} in "${pn[0].projectName}"`,
        text: notificationDescription
        };

        transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
         console.log("Error occurred while sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
        });
        }
      }

      return res
        .status(200)
        .json({ success: true, message: "added task successfully." });
    } catch (error) {
      console.error("Error during add task:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during add task.",
      });
    }
  });

  app.post("/moveTask", extractUsernameFromToken, async (req, res) => {
    try {
      // get parameters
      const taskId = req.body.taskId;
      const newLane = req.body.newLane;
      const newStatus = req.body.newStatus;

      // Update the task's lane and status
      const updateTaskQuery =
        "UPDATE taskprojectlist SET lane = ?, taskstatus = ? WHERE taskprojectuserlistID = ?";
      await queryAsync(updateTaskQuery, [newLane, newStatus, taskId]);

      return res.status(200).json({
        success: true,
        message: "Task moved successfully.",
      });
    } catch (error) {
      console.error("Error during move task:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during move task.",
      });
    }
  });

  app.post("/removeTask", extractUsernameFromToken, async (req, res) => {
    // get parameter
    const username = req.username;
    const taskId = req.body.taskId;
    const assignedUser = req.body.assignedUser;
    const taskTitle = req.body.taskTitle;
    const projectID = req.body.projectID;
    console.log("removing task: ", taskId);

    try {

      /* decrement the count on the user story if it was unfinished */
      const taskInfo = await queryAsync(
        'SELECT lane, assignedStoryID FROM taskprojectlist WHERE taskprojectuserlistID = ?',
        [taskId]
      );

      if (taskInfo[0].lane !== "Done") {
        await queryAsync(
          'UPDATE userStories SET unfinishedTaskCount = unfinishedTaskCount - 1 WHERE userStoryID = ?',
          [taskInfo[0].assignedStoryID]
        );
      }

      // remove the comments of the task
      await queryAsync(
        "DELETE FROM comments WHERE taskprojectID = ?",
        [taskId]
      );

      //remove the subtasks
      await queryAsync(
        "DELETE FROM subtasks WHERE taskprojectuserlistID = ?",
        [taskId]
      );


      // Remove the task
      await queryAsync(
        "DELETE FROM taskprojectlist WHERE taskprojectuserlistID = ?",
        [taskId]
      );

      if (assignedUser && assignedUser !== username) {
        const notificationTitle = `Task Deleted`
        const notificationDescription = `The task '${taskTitle}' assigned to you has been deleted.`;

        const ct = await queryAsync(
          'SELECT inAppNotifications, emailNotifications, emailNotificationTaskModifiedDeleted FROM projectuserlist WHERE username = ? AND projectID = ?',
          [assignedUser, projectID]
        )

        const em = await queryAsync(
          'SELECT email FROM users WHERE username = ?',
          [assignedUser]
        )

        const pn = await queryAsync(
          'SELECT projectName FROM projectlist WHERE projectID = ?',
          [projectID]
        )


        // Insert notification entries for each assigned user except the one who deleted the task
        if (ct[0].inAppNotifications == 1){
          await queryAsync(
           "INSERT INTO notifications (title, description, recipient, projectID) VALUES (?, ?, ?, ?)",
           [notificationTitle, notificationDescription, assignedUser, projectID]
          );
        }

        //now check if email needs to be sent
        if (ct[0].emailNotifications == 1 && ct[0].emailNotificationTaskModifiedDeleted == 1){
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
          
          // Send email to product owner with the average score information
          const mailOptions = {
          from: 'your_email@example.com',
          to: em[0].email,
          subject: `${notificationTitle} in "${pn[0].projectName}"`, 
          text: notificationDescription
          };
  
          transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
           console.log("Error occurred while sending email:", error);
          } else {
            console.log("Email sent:", info.response);
          }
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: "Task removed successfully.",
      });
    } catch (error) {
      console.error("Error during remove task:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during remove task.",
      });
    }
  });

  app.post("/editTask", extractUsernameFromToken, async (req, res) => {
    try {
      const username = req.username;
      const taskId = req.body.taskId;
      const status = req.body.status;
      const assignees = req.body.assignees;
      const reporters = req.body.reporters;
      const estimatedHours = req.body.estimatedHours;
      const prevAssignees = req.body.prevAssignees;
      const lane = req.body.lane;
      const taskName = req.body.taskName;
      const taskDescription = req.body.taskDescription;
      const projectID = req.body.projectID;
      console.log("EDITING TASK");
      console.log({ taskId, status, assignees, reporters, estimatedHours });

      //new added ********
      // Fetch the project permission for the current user
    const permissionResult = await queryAsync(
      "SELECT username, projectID, permission FROM projectuserlist WHERE username = ? AND projectID = ?",
      [username, projectID]
    );

    const permissionString = permissionResult[0].permission.toString('utf8');

    // Assuming the permission is actually a number stored as a string, like "1"
    const userpermission = parseInt(permissionString, 10);

    console.log("Permission is now --- ", userpermission);

    if (permissionResult.length == 0) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to edit tasks in this project.",
      });
    }

    const userPermission = parseInt(permissionResult[0].permission, 10); // Assuming permission is stored as a decimal

    const ASSIGN_TASKS_PERMISSION = 6; // Binary 110 so that owner n scrum master can assign
    // Permission check for assigning users
    if ((userPermission & ASSIGN_TASKS_PERMISSION) === 0 && assignees !== username) {
      // User does not have the permission to assign tasks to others
      return res.status(403).json({
        success: false,
        message: "You do not have sufficient permissions to assign this task to another user.",
      });
    }

      // check if you need to send a notification about the assigned user change
      // else check if there is a user assigned
      if ((prevAssignees != assignees) && (assignees) && (assignees != username)) {
        // create a notification entry for the new assigned user
        const notificationTitle = `Assigned to Task '${taskName}'`;
        const notificationDescription = `You have been assigned to the NEWLY CREATED task '${taskName}' with the following details:\n\nDescription: ${taskDescription}\nEstimated Hours: ${estimatedHours}\nAssigned by: ${username}`;

        const ct = await queryAsync(
          'SELECT inAppNotifications, emailNotifications, emailNotificationTaskModifiedDeleted FROM projectuserlist WHERE username = ? AND projectID = ?',
          [assignedUser, projectID]
        )

        const em = await queryAsync(
          'SELECT email FROM users WHERE username = ?',
          [assignedUser]
        )

        const pn = await queryAsync(
          'SELECT projectName FROM projectlist WHERE projectID = ?',
          [projectID]
        )

        //has notification enabled
        if (ct[0].inAppNotifications == 1){
          await queryAsync(
            "INSERT INTO notifications (title, description, recipient, projectID) VALUES (?, ?, ?, ?)",
            [notificationTitle, notificationDescription, assignedUser, projectID]
          );
        }

        //check to send email
        if (ct[0].emailNotifications == 1 && ct[0].emailNotificationTaskModifiedDeleted == 1){
          //create email transport
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
        
        // Send email to product owner with the average score information
        const mailOptions = {
        from: 'your_email@example.com',
        to: em[0].email,
        subject: `${notificationTitle} in "${pn[0].projectName}"`,
        text: notificationDescription
        };

        transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
         console.log("Error occurred while sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
        });
        }
      }
      else if ((prevAssignees == assignees) && (assignees) && (assignees != username)) {
        const notificationTitle = `Task '${taskName}' has been modified`;
        const notificationDescription = `The details of '${taskName}' have been modified. It now has the following details:\n\nDescription: ${taskDescription}\nEstimated Hours: ${estimatedHours}\nModified by: ${username}`;

        const ct = await queryAsync(
          'SELECT inAppNotifications, emailNotifications, emailNotificationTaskModifiedDeleted FROM projectuserlist WHERE username = ? AND projectID = ?',
          [assignees, projectID]
        )

        const em = await queryAsync(
          'SELECT email FROM users WHERE username = ?',
          [assignees]
        )

        const pn = await queryAsync(
          'SELECT projectName FROM projectlist WHERE projectID = ?',
          [projectID]
        )


        //has notification enabled
        if (ct[0].inAppNotifications == 1){
          await queryAsync(
            "INSERT INTO notifications (title, description, recipient, projectID) VALUES (?, ?, ?, ?)",
            [notificationTitle, notificationDescription, assignees, projectID]
          );
        }

        //check to send email
        if (ct[0].emailNotifications == 1 && ct[0].emailNotificationTaskModifiedDeleted == 1){
          //create email transport
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
        
        // Send email to product owner with the average score information
        const mailOptions = {
        from: 'your_email@example.com',
        to: em[0].email,
        subject: `${notificationTitle} in "${pn[0].projectName}"`, 
        text: notificationDescription
        };

        transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
         console.log("Error occurred while sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
        });
        }
      }

      /* get the prev lane and the assigned user story id */
      const taskInfo = await queryAsync(
        'SELECT lane, assignedStoryID FROM taskprojectlist WHERE taskprojectuserlistID = ?',
        [taskId]
      );

      if (taskInfo[0].lane != lane) {
        if (lane === "Done") {
          await queryAsync(
            'UPDATE userStories SET unfinishedTaskCount = unfinishedTaskCount - 1 WHERE userStoryID = ?',
            [taskInfo[0].assignedStoryID]
          );
        }
        else if (taskInfo[0].lane === "Done") {
          await queryAsync(
            'UPDATE userStories SET unfinishedTaskCount = unfinishedTaskCount + 1 WHERE userStoryID = ?',
            [taskInfo[0].assignedStoryID]
          );
        }
      }

      // Update the task with the provided information
      const updateTaskQuery =
        "UPDATE taskprojectlist SET taskstatus = ?, estimatedhours = ?, assigneduser = ?, reporter = ?, lane = ? WHERE taskprojectuserlistID = ?";
      await queryAsync(updateTaskQuery, [status, estimatedHours, assignees, reporters, lane, taskId]);

      return res.status(200).json({
        success: true,
        message: "Task updated successfully.",
      });
    } catch (error) {
      console.error("Error during edit task:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during edit task.",
      });
    }
  });

  app.post('/listUserTasks', extractUsernameFromToken, async (req, res) => {
    const username = req.username;
    console.log("List user tasks request sent from: ", { username });
    const projectID = req.body.projectID;

    try {
      // find all active/not backlogged tasks
      const active = await queryAsync(
        'SELECT * FROM taskprojectlist WHERE projectID = ? AND assigneduser = ? AND taskstatus = ?',
        [projectID, username, 'Sprint'],
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
      }));

      console.log("tasks: ", tasks);
      return res.status(200).json({ success: true, tasks });
    } catch (error) {
      console.error("Error listing tasks:", error);
      return res.status(500).json({ success: false, message: "Internal server error listing tasks." });
    };
  });

  app.post('/logHours', extractUsernameFromToken, async (req, res) => {
    const { taskId, loggedHours } = req.body;

    try {
      await queryAsync(
        'UPDATE taskprojectlist SET loggedhours = ? WHERE taskprojectuserlistID = ?',
        [loggedHours, taskId]
      );

      return res.status(200).json({ success: true, message: 'Logged hours updated successfully.' });
    } catch (error) {
      console.error('Error updating logged hours:', error);
      return res.status(500).json({ success: false, message: 'Internal server error updating logged hours.' });
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
};
