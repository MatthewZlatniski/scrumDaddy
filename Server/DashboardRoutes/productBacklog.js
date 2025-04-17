const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require ('nodemailer');

// imports the function to get a username from an auth token
const { extractUsernameFromToken } = require("../authMiddleware");

module.exports = (app, con) => {
  app.post("/addUserStory", extractUsernameFromToken, async (req, res) => {
    try {
      const username = req.username;
      const { title, description, projectID, acceptanceCriteria, assignedSprint } = req.body;

      // Check if required fields are provided
      if (!title || !description || !projectID || !acceptanceCriteria) {
        return res.status(400).json({ success: false, message: "Title, description, projectID, and acceptanceCriteria are required fields" });
      }

      // Insert the user story into the database
      const insertUserStoryQuery = `
        INSERT INTO userStories (title, description, projectID, assignedSprint, unfinishedTaskCount)
        VALUES (?, ?, ?, ?, ?)
      `;

      // Make the query to insert the user story
      const userStoryResult = await queryAsync(insertUserStoryQuery, [title, description, projectID, assignedSprint, 0]);

      const userStoryID = userStoryResult.insertId;

      // Insert acceptance criteria into the database
      const insertAcceptanceCriteriaQuery = `
        INSERT INTO acceptanceCriteria (userstoryID, content, projectID)
        VALUES (?, ?, ?)
      `;

      for (const criteria of acceptanceCriteria) {
        await queryAsync(insertAcceptanceCriteriaQuery, [userStoryID, criteria, projectID]);
      }

      const tasks = [];

      // Get all project members except the one who added the collaborator
      const projectMembers = await queryAsync(
        'SELECT username FROM projectuserlist WHERE projectID = (?) AND username != (?)',
        [projectID, username],
      );

      // Create notifications for each project member
      for (const member of projectMembers) {
        const result = await queryAsync(
          'SELECT notificationid FROM notifications WHERE title = "Product Backlog" AND recipient = (?)',
          [member.username]
        );
        const ct = await queryAsync(
          'SELECT inAppNotifications, emailNotifications, emailNotificationUserStoryCreated FROM projectuserlist WHERE username = ? AND projectID = ?',
          [member.username, projectID]
        )

        const em = await queryAsync(
          'SELECT email FROM users WHERE username = ?',
          [member.username]
        )
        const pn = await queryAsync(
          'SELECT projectName FROM projectlist WHERE projectID = ?',
          [projectID]
        )
        if (result.length == 0 && ct[0].inAppNotifications == 1) {
          await queryAsync(
              'INSERT INTO notifications (title, description, recipient, projectID) VALUES (?, ?, ?, ?)',
              [`Product Backlog`, `The Product Backlog has been modified since you last checked your notifications.`, member.username, projectID]
          );
        }
        if (ct[0].emailNotifications == 1 && ct[0].emailNotificationUserStoryCreated == 1){
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
          const subj = `Product backlog has been updated for "${pn[0].projectName}"`;
          const mailOptions = {
          from: 'your_email@example.com',
          to: em[0].email,
          subject: subj,
          text: "The Product Backlog has been modified since you last checked your notifications."
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

      res.status(200).json({
        success: true,
        message: 'User story added successfully.',
        tasks,
        id: userStoryID,
      });
    } catch (error) {
      console.error('Error adding user story:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while adding user story.'
      });
    }
  });

  app.post('/listUserStories', extractUsernameFromToken, async (req, res) => {
    try {
      const { projectID } = req.body;
  
      // Fetch user stories and their tasks from the database
      const userStoriesQuery = `
          SELECT
              us.userstoryID AS id,
              us.title,
              us.description,
              us.assignedSprint,
              us.unfinishedTaskCount,
              ac.content AS acceptanceCriteria,
              tp.taskprojectuserlistID AS taskID,
              tp.taskname AS taskname
          FROM 
              userStories us
          LEFT JOIN 
              acceptanceCriteria ac ON us.userstoryID = ac.userstoryID
          LEFT JOIN 
              taskprojectlist tp ON us.userstoryID = tp.assignedStoryID
          WHERE 
              us.projectID = ?
          ORDER BY 
              us.userstoryID, ac.acceptanceCriteriaID;
      `;
  
      const userStories = await queryAsync(userStoriesQuery, [projectID]);

      const currSprint = await queryAsync(
        'SELECT currentSprint FROM projectlist WHERE projectID = ?',
        [projectID]
      );
  
      // Map user stories to the desired structure with acceptance criteria as an array of unique descriptions
      const mappedUserStories = [];
      let currentStory = null;
  
      for (const row of userStories) {
        // If this is a new user story, add it to the result array
        if (!currentStory || currentStory.id !== row.id) {
          currentStory = {
            id: row.id,
            title: row.title,
            description: row.description,
            assignedSprint: row.assignedSprint,
            acceptanceCriteria: [],
            tasks: [], // Empty array for tasks
            unfinishedTaskCount: row.unfinishedTaskCount,
            isCurrentSprint: false,
          };
          mappedUserStories.push(currentStory);
        }

        // Add acceptance criteria to the current user story if it's not already included
        if (row.acceptanceCriteria && !currentStory.acceptanceCriteria.includes(row.acceptanceCriteria)) {
          currentStory.acceptanceCriteria.push(row.acceptanceCriteria);
        }

        // Add taskname to the current user story's tasks array if the task ID doesn't already exist
        if (row.taskID !== null && !currentStory.tasks.some(task => task.id === row.taskID)) {
          currentStory.tasks.push({ id: row.taskID, name: row.taskname });
        }

        /* set if it is the current sprint */
        if (currSprint[0].currentSprint === row.assignedSprint) {
          currentStory.isCurrentSprint = true;
        }
      }

      res.status(200).json({
        success: true,
        userStories: mappedUserStories,
      });
    } catch (error) {
      console.error('Error fetching user stories:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching user stories.',
      });
    }
  });

  app.post('/listStoriesForTask', extractUsernameFromToken, async (req, res) => {
    try {
      const { projectID } = req.body;

      // Fetch user stories (id and title) from the database based on the projectID
      const userStoriesQuery = `
          SELECT userstoryID AS id, title
          FROM userStories
          WHERE projectID = ?
      `;
  
      const userStories = await queryAsync(userStoriesQuery, [projectID]);

      // Map the result to contain only id and title fields
      const mappedUserStories = userStories.map(story => ({
          id: story.id,
          title: story.title
      }));

      res.status(200).json({
          success: true,
          userStories: mappedUserStories
      });
    } catch (error) {
      console.error('Error fetching user stories for task:', error);
      res.status(500).json({
          success: false,
          message: 'Internal server error while fetching user stories for task.'
      });
    }
  });

  app.post('/addAC', extractUsernameFromToken, async (req, res) => {
    try {
      // Get array of acceptance criteria from the request body
      const acceptanceCriteriaArray = req.body.acceptanceCriteria;
      const userStoryID = req.body.userStoryID;
      const projectID = req.body.projectID;
      console.log(acceptanceCriteriaArray);
      // Check if the acceptance criteria array is provided and not empty
      if (!acceptanceCriteriaArray || acceptanceCriteriaArray.length === 0) {
        return res.status(400).json({ success: false, message: "Acceptance criteria array is required and cannot be empty." });
      }
  
      // Insert acceptance criteria into the database
      const insertQuery = `
        INSERT INTO acceptanceCriteria (projectID, userstoryID, content)
        VALUES (?, ?, ?);
      `;
  
      // Iterate over the acceptance criteria array and insert each one into the database
      for (const criteriaObj of acceptanceCriteriaArray) {
        const content = criteriaObj;
        console.log(content);
        await queryAsync(insertQuery, [projectID, userStoryID, content]);
      }
  
      res.status(200).json({
        success: true,
        message: 'Acceptance criteria added successfully.',
      });
    } catch (error) {
      console.error('Error adding acceptance criteria:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while adding acceptance criteria.',
      });
    }
  });

  app.post('/deleteUserStory', extractUsernameFromToken, async (req, res) => {
    const userStoryID = req.body.userStoryToDelete;

    try {
        // Get the list of task IDs assigned to the user story
        const taskIDsResult = await queryAsync(
            'SELECT taskprojectuserlistID FROM taskprojectlist WHERE assignedStoryID = (?)',
            [userStoryID]
        );

        // Extract task IDs from the result
        const taskIDs = taskIDsResult.map(task => task.taskprojectuserlistID);

        // Delete comments associated with the extracted task IDs
        if (taskIDs.length > 0) {
          await queryAsync(
              'DELETE FROM comments WHERE taskprojectID IN (?)',
              [taskIDs]
          );

          // delete subtasks
          await queryAsync(
            'DELETE FROM subtasks WHERE taskprojectuserlistID IN (?)',
            [taskIDs]
          );
        }

        // Delete tasks of the user story
        await queryAsync(
            'DELETE FROM taskprojectlist WHERE assignedStoryID = (?)',
            [userStoryID]
        );

        // delete acs
        await queryAsync(
          'DELETE FROM acceptanceCriteria WHERE userstoryID = (?)',
          [userStoryID]
      );

        // Delete the user story
        await queryAsync(
            'DELETE FROM userStories WHERE userstoryID = (?)',
            [userStoryID]
        );

        res.status(200).json({
            success: true,
            message: 'User Story deleted',
        });
    } catch (error) {
        console.error('Error deleting user story:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while deleting user story.',
        });
    }
});

  app.post('/getSprints', extractUsernameFromToken, async (req, res) => {
    const projectID = req.body.projectID;
    console.log(projectID);

    try {
        // Fetch the number of sprints from the database
        const result = await queryAsync(
            'SELECT numberOfSprints FROM projectlist WHERE projectID = ?',
            [projectID]
        );

        if (result.length > 0) {
            // Get the number of sprints
            const numberOfSprints = result[0].numberOfSprints;

            // Construct the array of sprints
            const fetchedSprints = Array.from({ length: numberOfSprints }, (_, index) => ({
                id: index + 1,
                name: `Sprint ${index + 1}`
            }));

            res.json({ success: true, message: 'Number of Project found successfully', fetchedSprints });
        } else {
            res.status(404).json({ success: false, error: 'Project not found' });
        }
    } catch (error) {
        console.error('Error getting number of sprints:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  app.post('/updateSprint', extractUsernameFromToken, async (req, res) => {
    const assignedSprint = req.body.assignedSprint;
    const userStoryID = req.body.userStoryID;
    const projectID = req.body.projectID;

    try {
        /* check if its the current sprint now */
        const sprintResult = await queryAsync(
          'SELECT currentSprint FROM projectlist WHERE projectID = ?',
          [projectID]
        );

        let taskStatus = 'Backlog';
        if (assignedSprint == sprintResult[0].currentSprint) {
          taskStatus = 'Sprint';
        }

        /* update tasks for new sprint */
        await queryAsync(
          'UPDATE taskprojectlist SET taskstatus = ? WHERE assignedStoryID = ?',
          [taskStatus, userStoryID]
        );

        // Update the assignedSprint field in the userStories table
        const updateQuery = `
            UPDATE userStories 
            SET assignedSprint = ?
            WHERE userstoryID = ?
        `;

        // Execute the update query
        await queryAsync(updateQuery, [assignedSprint, userStoryID]);

        res.status(200).json({
            success: true,
            message: 'Sprint updated successfully.'
        });
    } catch (error) {
        console.error('Error updating sprint:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating sprint.'
        });
    }
  });

  app.post('/getCurrentSprint', extractUsernameFromToken, async (req, res) => {
    const projectID = req.body.projectID;

    try {
        // Update the assignedSprint field in the userStories table
        const getQuery = `
            SELECT currentSprint, numberOfSprints
            FROM projectlist
            WHERE projectID = ?
        `;


        // Execute the update query
        const result = await queryAsync(getQuery, [projectID]);

        if (result.length == 0) {
          return res.status(200).json({ success: false, message: 'Sprint select failed'});
        }

        if (!result[0].currentSprint) {
          const insertion = await queryAsync(
            'UPDATE projectlist SET currentSprint = 1 WHERE projectID = ?',
            [projectID]
          );

          res.status(200).json({
            success: true,
            message: 'Sprint selected successfully.',
            currentSprint: 1,
            maxSprint: result[0].numberOfSprints
          });
        }


        res.status(200).json({
            success: true,
            message: 'Sprint selected successfully.',
            currentSprint: result[0].currentSprint,
            maxSprint: result[0].numberOfSprints
        });
    } catch (error) {
        console.error('Error selecting sprint:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while selecting sprint.'
        });
    }
  });

  app.post('/moveToNextSprint', extractUsernameFromToken, async (req, res) => {
    const projectID = req.body.projectID;
    const username = req.username;

    try {

      const selectResult = await queryAsync(
        'SELECT currentSprint, numberOfSprints FROM projectlist WHERE projectID = ?',
        [projectID]
      );

      if (selectResult[0].currentSprint == selectResult[0].numberOfSprints) {
        return res.status(200).json({success: false, message: "You are already on the final sprint."});
      }

      const updateResult = await queryAsync(
        'UPDATE projectlist SET currentSprint = ? WHERE projectID = ?',
        [selectResult[0].currentSprint + 1, projectID]
      );

      /* set the tasks status */
      /* backlog or current sprint */
      /* need to all user stories that are on the current sprint */
      const oldUserStoryList = await queryAsync(
        'SELECT userStoryID FROM userStories WHERE assignedSprint = ? AND projectID = ?',
        [selectResult[0].currentSprint, projectID]
      );

      /* get all user stories on the new current sprint */
      const newUserStoryList = await queryAsync(
        'SELECT userStoryID FROM userStories WHERE assignedSprint = ?  AND projectID = ?',
        [selectResult[0].currentSprint + 1, projectID]
      );

      if (oldUserStoryList.length != 0) {
        await queryAsync(
          'UPDATE taskprojectlist SET taskstatus = "Backlog" WHERE assignedStoryID IN (?)',
          [oldUserStoryList.map(userStory => userStory.userStoryID)]
        );
      }

      if (newUserStoryList.length != 0) {
        await queryAsync(
          'UPDATE taskprojectlist SET taskstatus = "Sprint" WHERE assignedStoryID IN (?)',
          [newUserStoryList.map(userStory => userStory.userStoryID)]
        );
      }

      const totalUsers = await queryAsync(
        'SELECT username FROM projectuserlist WHERE projectID = ?',
        [projectID]
      );

      /* create entries for the review table if there are multiple users */
      const amount = await queryAsync(
        'SELECT * FROM projectuserlist WHERE projectID = ? AND username != ?',
        [projectID, username]
      );

      if (amount.length > 0) {
        await queryAsync(
          'INSERT INTO reviews (projectID, sprint, incompleteCount) VALUES (?,?,?)',
          [projectID, selectResult[0].currentSprint, totalUsers.length]
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Sprint incremented successfully.',
      });


    } catch (error) {
        console.error('Error incrementing sprint:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while incrementing sprint.'
        });
    }
  });

  app.post('/saveReviews', extractUsernameFromToken, async (req, res) => {
    try {
      const username = req.username;
      const { projectID, reviews, sprintNumber } = req.body;

      const reviewedUsernames = Object.keys(reviews);

      const idres = await queryAsync(
        'SELECT reviewID FROM reviews WHERE projectID = ? AND sprint = ?',
        [projectID, sprintNumber]
      );

      // Iterate over the reviews
      for (const user of reviewedUsernames) {

        await queryAsync(
          'INSERT INTO reviewEntries (reviewID, username, totalScore, recipient) VALUES (?, ?, ?, ?)',
          [idres[0].reviewID, username, reviews[user], user]
        );
      }

      /* increment the reviews completed */
      await queryAsync(
        'UPDATE projectuserlist SET reviewsCompleted = reviewsCompleted + 1 WHERE username = ? AND projectID = ?',
        [username, projectID]
      );

      /* decrement the incomplete reviews  */
      await queryAsync(
        'UPDATE reviews SET incompleteCount = incompleteCount - 1 WHERE reviewID = ?',
        [idres[0].reviewID]
      );

      const incomplete = await queryAsync(
        'SELECT incompleteCount FROM reviews WHERE reviewID = ?',
        [idres[0].reviewID]
      );

      if (incomplete[0].incompleteCount === 0) {
        /* --------- SEND THE EMAIL HERE ------------ */
        const getusers = await queryAsync(
          'SELECT username FROM projectuserlist WHERE projectID = ?',
          [projectID]
        );

        const allUsernames = getusers.map(row => row.username);
        //loop over each user
        const allUserReviews = [];
        for (let i = 0; i < allUsernames.length; i++) {
          const username = allUsernames[i];
          console.log("***user is ", username); // Or do whatever you want with each username
          //now I loop over and get all reviews for each user
          const email = await queryAsync(
            'SELECT COUNT(*) as rowCount, SUM(totalScore) as totalScore FROM reviewEntries WHERE reviewID = ? AND RECIPIENT = ?',
            [idres[0].reviewID, username]
          );
          console.log("***total score is", email[0].totalScore);
          console.log("***num users is", email[0].rowCount)
          allUserReviews.push({ username: username, email: email[0] });
        }

        //calculate average scores for each
        let emailContent = 'Average Scores:\n';
        allUserReviews.forEach(user => {
           const averageScore = user.email.rowCount !== 0 ? user.email.totalScore / user.email.rowCount : 0;
          emailContent += `User: ${user.username}, Average Score: ${averageScore}/5\n`;
        });
        const prodOwner = await queryAsync(
          'SELECT username FROM projectuserlist where projectID = ? AND permission & 4 = 4',
          [projectID]
        );

        const poEmail = await queryAsync(
          'SELECT email FROM users WHERE username = ?',
          [prodOwner[0].username]
        );
        console.log("*** prod own email is ", poEmail[0].email);

        const projinfo = await queryAsync(
          'SELECT projectName, currentSprint FROM projectlist WHERE projectID = ?',
          [projectID]
        );
        

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
        //need to decrement sprint because I get it once it has been moved to next sprint
        projinfo[0].currentSprint--;
        const subject = `Project "${projinfo[0].projectName}" Sprint ${projinfo[0].currentSprint} Peer Review Report`;
        // Send email to product owner with the average score information
        const mailOptions = {
        from: 'your_email@example.com',
        to: poEmail[0].email,
        subject: subject,
        text: emailContent
        };

        transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
         console.log("Error occurred while sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
        });

        //console.log("send email for review: ", row.reviewID);
        /* delete all entries b/c they are no longer needed */
        await queryAsync(
          'DELETE FROM reviewEntries WHERE reviewID = ?',
          [idres[0].reviewID]
        );

        await queryAsync(
          'DELETE FROM reviews WHERE reviewID = ?',
          [idres[0].reviewID]
        );
      }

      res.status(200).json({
        success: true,
        message: 'Reviews saved successfully.',
      });
    } catch (error) {
      console.error('Error saving reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while saving reviews.',
      });
    }
  });

  app.post('/moveUserStoriesToNextSprint', extractUsernameFromToken, async (req, res) => {
    try {
      const projectID = req.body.projectID;
      const currentSprint = req.body.currentSprint;

      /* get all hte user story ids of the sprint */
      const storyids = await queryAsync(
        'UPDATE taskprojectlist SET taskstatus = "Sprint" WHERE assignedStoryID IN (SELECT userStoryID FROM userStories WHERE projectID = ? AND assignedSprint = ? AND unfinishedTaskCount != ?)',
        [projectID, currentSprint, 0]
      );
  
      // Increment the assignedSprint for user stories from the current sprint to the next sprint
      const updateQuery = `
        UPDATE userStories 
        SET assignedSprint = assignedSprint + 1
        WHERE projectID = ? AND assignedSprint = ? AND unfinishedTaskCount != ?
      `;
  
      // Execute the update query
      await queryAsync(updateQuery, [projectID, currentSprint, 0]);
  
      res.status(200).json({
        success: true,
        message: 'User stories moved to the next sprint successfully.',
      });
    } catch (error) {
      console.error('Error moving user stories:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while moving user stories.',
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
};
