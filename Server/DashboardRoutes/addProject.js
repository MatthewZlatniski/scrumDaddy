const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// imports the function to get a username from an auth token
const { extractUsernameFromToken } = require('../authMiddleware');

module.exports = (app, con) => {

  app.post('/addProject', extractUsernameFromToken, async (req, res) => {
    const username = req.username;
    const projectName = req.body.projectName;
    const projectDescription = req.body.projectDescription;
    const collaborators = req.body.collaborators;
    const startDate = req.body.startDate;
    const numberOfSprints = req.body.numberOfSprints;
    const sprintDuration = req.body.sprintDuration;
    const sprintEvents = req.body.sprintEvents;

    console.log("Add project request sent from: ", { username });
    console.log("collabs: ", {collaborators});
    console.log("New project request: ", { projectName, projectDescription });
    console.log("New sprint events: ", { sprintEvents });

    if (!projectName || !projectDescription) {
      return res.status(200).json({ success: false, message: "Fill out all fields." });
    }

    try {
      // insert the project into projectlist
      const insertProjectResult = await queryAsync(
        'INSERT INTO projectlist (projectName, projectDescription, startDate, numberOfSprints, sprintDuration, currentSprint) VALUES (?, ?, ?, ?, ?, ?)',
        [projectName, projectDescription, startDate, numberOfSprints, sprintDuration, 1]
      );

      // get the id
      console.log(insertProjectResult);
      const newProjectID = insertProjectResult.insertId;

      for (const event of sprintEvents) {
        const eventJSON = JSON.stringify(event);
        await queryAsync(
          'INSERT INTO calendarEvents (projectID, eventData) VALUES (?, ?)',
          [newProjectID, eventJSON]
        );
      }

      // insert into projectuserlist
      // set to owner by default
      await queryAsync(
        'INSERT INTO `projectuserlist` (`username`, `projectID`, `permission`) VALUES (?, ?, ?)',
        [username, newProjectID, 4]
      );

      // add each collab
      for (const collaborator of collaborators) {
        console.log(collaborator);
        const collab_res = await queryAsync(
          'SELECT username, isVerified FROM users WHERE email = (?)',
          [collaborator.email]
        );

        console.log(collab_res);

        // check that the user existed
        console.log(collab_res.length);
        if (collab_res.length > 0) {
          //if verified
          // get the correct permission
          let collab_permission = 0;
          if (collaborator.permission === 'Owner') {
            collab_permission = 4;
          } else if (collaborator.permission === 'Scrum Master') {
            collab_permission = 2;
          } else {
            collab_permission = 1;
          }

          if (collab_res[0].isVerified == 1) {
            await queryAsync(
              'INSERT INTO projectuserlist (username, projectID, permission) VALUES (?, ?, ?)',
              [collab_res[0].username, newProjectID, collab_permission]
            );
            //send email that you have been added to the project
            sendEmail(collaborator.email, projectName, username);
          }
        }

      }

      // Return success response
      return res.status(200).json({ success: true, message: "Project added successfully." });

    } catch (error) {
      console.error("Error during add project:", error);
      return res.status(500).json({ success: false, message: "Internal server error during add project." });
    }

  });

  app.post('/deadlines', extractUsernameFromToken, async (req, res) => {
    const projectID = req.body.projectID;
    const now = new Date();

    try {
        const result = await queryAsync(
            'SELECT JSON_UNQUOTE(JSON_EXTRACT(eventData, "$.id")) AS id, JSON_UNQUOTE(JSON_EXTRACT(eventData, "$.start")) AS startDate, JSON_UNQUOTE(JSON_EXTRACT(eventData, "$.title")) AS title, JSON_UNQUOTE(JSON_EXTRACT(eventData, "$.allDay")) AS allDay FROM calendarEvents WHERE projectID = ? AND (JSON_UNQUOTE(JSON_EXTRACT(eventData, "$.start")) >= CURRENT_DATE() OR (JSON_UNQUOTE(JSON_EXTRACT(eventData, "$.start")) = CURRENT_DATE() AND JSON_UNQUOTE(JSON_EXTRACT(eventData, "$.allDay")) = true)) ORDER BY CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(eventData, "$.allDay")) = true THEN 1 ELSE 0 END, JSON_UNQUOTE(JSON_EXTRACT(eventData, "$.start")) ASC LIMIT 3',
            [projectID]
        );

        const deadlines = result.map((row, index) => {
            let urgency;
            if (index === 0) {
                urgency = 'high';
            } else if (index === 1) {
                urgency = 'medium';
            } else {
                urgency = 'low';
            }

            // Format date and time nicely
            let formattedDate;
            if (row.allDay === 'true') {
                formattedDate = 'All Day';
            } else {
                const startDate = new Date(row.startDate);
                formattedDate = startDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true // Include AM/PM
                });
            }

            return {
                id: row.id,
                date: formattedDate,
                title: row.title,
                urgency: urgency
            };
        });

        // Respond with the formatted deadlines
        return res.status(200).json({ success: true, message: "Sorted and formatted deadlines fetched successfully.", deadlines });
    } catch (error) {
        console.error("Error fetching deadlines:", error);
        return res.status(500).json({ success: false, message: "Internal server error fetching deadlines." });
    }
});


  app.post('/fetchEvents', extractUsernameFromToken, async (req, res) => {
    const projectID = req.body.projectID;
    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toString(); // Adjust format as needed
  }
  
    try {
      const result = await queryAsync(
        'SELECT eventID, eventData FROM calendarEvents WHERE projectID = ?',
        [projectID]
      );
  
      const storedEvents = result.map(row => {
        const eventData = JSON.parse(row.eventData);
        // Format start and end dates if they exist
        if (eventData.start) {
            eventData.start = formatDate(eventData.start);
        }
        if (eventData.end) {
            eventData.end = formatDate(eventData.end);
        }
        // Add eventId to the event data
        eventData.eventID = row.eventID;
        return eventData;
      });
  
      return res.status(200).json({ success: true, message: "Project events fetched successfully.", storedEvents });
    } catch (error) {
      console.error("Error fetching events:", error);
      return res.status(500).json({ success: false, message: "Internal server error fetching events." });
    }
  });

  app.post('/deleteEvent', extractUsernameFromToken, async (req, res) => {
    const eventID = req.body.eventID;

    try {
        // Execute SQL DELETE query to remove the event
        await queryAsync(
            'DELETE FROM calendarEvents WHERE eventID = ?',
            [eventID]
        );

        return res.status(200).json({ success: true, message: "Event deleted successfully." });
    } catch (error) {
        console.error("Error deleting event:", error);
        return res.status(500).json({ success: false, message: "Internal server error deleting event." });
    }
  }); 

  app.post('/eventUpdateNotRecurring', extractUsernameFromToken, async (req, res) => {
    const eventID = req.body.eventID;
    const eventDetails = req.body.eventDetails;

    console.log(eventDetails);
    console.log(eventID);

    try {
      await queryAsync(
        'UPDATE calendarEvents SET eventData = ? WHERE eventID = ?',
        [JSON.stringify(eventDetails), eventID]
      );

      return res.status(200).json({ success: true, message: "Event updated successfully." });
    } catch (error) {
      console.error("Error updating event:", error);
      return res.status(500).json({ success: false, message: "Internal server error updating event." });
    }

  });

  app.post('/deleteEventsByRecurrenceID', extractUsernameFromToken, async (req, res) => {
    const recurrenceID = req.body.recurrenceID;
  
    try {
      // Execute SQL DELETE query to remove events with the specified recurrenceID
      await queryAsync(
        'DELETE FROM calendarEvents WHERE eventData->>"$.recurrenceID" = ?',
        [recurrenceID]
      );
  
      return res.status(200).json({ success: true, message: "Events with recurrenceID deleted successfully." });
    } catch (error) {
      console.error("Error deleting events by recurrenceID:", error);
      return res.status(500).json({ success: false, message: "Internal server error deleting events by recurrenceID." });
    }
  });

  app.post('/addEvents', extractUsernameFromToken, async (req, res) => {
    const projectID = req.body.projectID;
    const newEvents = req.body.newEvents;
  
    try {
      for (const event of newEvents) {
        const eventJSON = JSON.stringify(event);
        await queryAsync(
          'INSERT INTO calendarEvents (projectID, eventData) VALUES (?, ?)',
          [projectID, eventJSON]
        );
      }
  
      return res.status(200).json({ success: true, message: "Events added successfully." });
    } catch (error) {
      console.error("Error adding events:", error);
      return res.status(500).json({ success: false, message: "Internal server error adding events." });
    }
  });


  app.post('/checkInv', extractUsernameFromToken, async (req, res) => {
    const email = req.body.collaboratorEmail;
    console.log("email: ", email);

    const collab_res = await queryAsync(
      'SELECT username, isVerified FROM users WHERE email = (?)',
      [email]
    );


    console.log(collab_res);
    if (collab_res.length > 0) {
      if (collab_res[0].username === req.username) {
        return res.status(200).json({ success: false, message: "Cannot add yourself as collaborator."});
      }
      //if verified
      if (collab_res[0].isVerified == 1) {
        return res.status(200).json({ success: true, message: "Collaborator found"});
      }
      return res.status(200).json({ success: false, message: "Collaborator is not verified."});
    }
    return res.status(200).json({ success: false, message: "Collaborator does not exist."});

  });

  app.post('/deleteProject', extractUsernameFromToken, async (req, res) => {
    const username = req.username;
    const projectID = req.body.projectID;

    try {
      // Check the permission level of the user
      const permissionResult = await queryAsync(
          'SELECT permission FROM projectuserlist WHERE username = ? AND projectID = ?',
          [username, projectID]
      );

      if (permissionResult.length > 0) {
          const userPermission = parseInt(permissionResult[0].permission, 16);

          // Check if the user has permission level 4 (Owner)
          if (userPermission === 4) {
            await queryAsync(
              'DELETE FROM calendarEvents WHERE projectID = ?',
              [projectID]
            );
            // Delete entries from reviews and reviewEntries tables
            await queryAsync(
              'DELETE FROM reviewEntries WHERE reviewID IN (SELECT reviewID FROM reviews WHERE projectID = ?)',
              [projectID]
            );

            await queryAsync(
              'DELETE FROM messages WHERE projectID = ?',
              [projectID]
            );

            await queryAsync(
              'DELETE FROM reviews WHERE projectID = ?',
              [projectID]
            );

            await queryAsync(
              'DELETE FROM acceptanceCriteria WHERE projectID = ?',
              [projectID]
            );

            await queryAsync(
              'DELETE FROM userStories WHERE projectID = ?',
              [projectID]
            );

            // Get task IDs associated with the project from taskprojectlist
            const taskIDsResult = await queryAsync(
              'SELECT taskprojectuserlistID FROM taskprojectlist WHERE projectID = ?',
              [projectID]
            );

            const taskIDs = taskIDsResult.map(row => row.taskprojectuserlistID);

            // Delete all comments associated with tasks in the project
            if (taskIDs.length > 0) {
              await queryAsync(
                'DELETE FROM comments WHERE taskprojectID IN (?)',
                [taskIDs]
              );
            }

            // Delete all subtasks
            await queryAsync(
              'DELETE FROM subtasks WHERE projectID = ?',
              [projectID]
            );

            // Delete all tasks associated with the project
            await queryAsync(
              'DELETE FROM taskprojectlist WHERE projectID = ?',
              [projectID]
            );

            // Delete from projectlist
            await queryAsync(
              'DELETE FROM projectlist WHERE projectID = ?',
              [projectID]
            );

            // Delete from projectuserlist for all users
            await queryAsync(
              'DELETE FROM projectuserlist WHERE projectID = ?',
              [projectID]
            );

            return res.status(200).json({ success: true, message: "Project deleted successfully." });
          } else {
            // get the amount of users
            const amount = await queryAsync(
              'SELECT * FROM projectuserlist WHERE projectID = ? AND username != ?',
              [projectID, username]
            );

            // if there is only one more user on the project then there is no need for reviews
            if (amount.length == 1) {
              // Delete entries from reviews and reviewEntries tables
              await queryAsync(
                'DELETE FROM reviewEntries WHERE reviewID IN (SELECT reviewID FROM reviews WHERE projectID = ?)',
                [projectID]
              );

              await queryAsync(
                'DELETE FROM reviews WHERE projectID = ?',
                [projectID]
              );
            }
            else {
              // Delete reviewEntries for the user
              await queryAsync(
                'DELETE FROM reviewEntries WHERE reviewID IN (SELECT reviewID FROM reviews WHERE projectID = ?) AND username = ?',
                [projectID, username]
              );

              await queryAsync(
                'DELETE FROM reviewEntries WHERE reviewID IN (SELECT reviewID FROM reviews WHERE projectID = ?) AND recipient = ?',
                [projectID, username]
              );

              const userReviewsCompleted = await queryAsync(
                'SELECT reviewsCompleted FROM projectuserlist WHERE username = ? AND projectID = ?',
                [username, projectID]
              );

              await queryAsync(
                'UPDATE reviews SET incompleteCount = incompleteCount - 1 WHERE projectID = ? AND sprint > ?',
                [projectID, userReviewsCompleted[0].reviewsCompleted]
              );

              const updatedReviewCounts = await queryAsync(
                'SELECT reviewID, incompleteCount FROM reviews WHERE projectID = ?',
                [projectID]
              );

              // Delete only the user's entry from projectuserlist
              await queryAsync(
                'DELETE FROM projectuserlist WHERE username = ? AND projectID = ?',
                [username, projectID]
              );

              /* CHECK IF EMAIL SHOULD BE SENT */
              // Loop over each result to check if incompleteCount is zero
              updatedReviewCounts.forEach(async (row) => {
                if (row.incompleteCount === 0) {
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
                      [row.reviewID, username]
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
                    [row.reviewID]
                  );

                  await queryAsync(
                    'DELETE FROM reviews WHERE reviewID = ?',
                    [row.reviewID]
                  );
                          }
                        });
            }
            return res.status(200).json({ success: true, message: "User removed from the project." });
          }
      } else {
          return res.status(200).json({ success: false, message: "Project not found. May already be deleted." });
      }
  } catch (error) {
      console.error("Error during delete project:", error);
      return res.status(500).json({ success: false, message: "Internal server error during delete project." });
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

   // Function to send email
   async function sendEmail(email, projectName, createdBy) {
    try {
      // create reusable transporter object using the default SMTP transport
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
  
      // Construct email message
      let message = `You have been added to the project "${projectName}" by ${createdBy}.`;

      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: 'noreplyscrumdaddy@gmail.com', // sender address
        to: email, // list of receivers
        subject: 'Project Invitation', // Subject line
        text: message // plain text body
      });

      console.log("Message sent: %s", info.messageId);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }


  return router;
}