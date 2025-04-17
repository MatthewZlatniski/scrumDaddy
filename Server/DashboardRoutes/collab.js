const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');

// imports the function to get a username from an auth token
const { extractUsernameFromToken } = require('../authMiddleware');

module.exports = (app, con) => {

  app.post('/getCollaborators', extractUsernameFromToken, async (req, res) => {
    const username = req.username;
    const projectID = req.body.selectedProjectID;

    console.log("list for this id: ", projectID);

    if (!projectID) {
      return res.status(200).json({success: false, message: "Select A Project First"});
    }

    try {
      // get usernames
      const owner_result = await queryAsync(
        'SELECT pu.username, u.onelineStatus FROM projectuserlist pu JOIN users u ON pu.username = u.username WHERE pu.projectID = (?) AND pu.permission = 4',
        [projectID],
      );
      console.log(owner_result);

      // get array of collaborators
      let owners = [];
      if(owner_result.length > 0){
        owners = owner_result.map(row => ({ username: row.username, onlineStatus: row.onelineStatus }));
      }

      // get usernames and online status for scrumMasters
      const master_result = await queryAsync(
        'SELECT pu.username, u.onelineStatus FROM projectuserlist pu JOIN users u ON pu.username = u.username WHERE pu.projectID = (?) AND pu.permission = 2',
        [projectID],
      );
      
      // get the amount of users
      const amount = await queryAsync(
        'SELECT * FROM projectuserlist WHERE projectID = ? AND username != ?',
        [projectID, username]
      );

      let reviews_result = null;
      if (amount.length > 0) {
        /* get the current sprint and the number of reviews completed */
        reviews_result = await queryAsync(
          'SELECT pu.reviewsCompleted AS reviewsCompleted, p.currentSprint AS currentSprint FROM projectuserlist pu JOIN projectlist p ON pu.projectID = p.projectID WHERE pu.username = ? AND p.projectID = ? AND pu.projectID = ?',
          [username, projectID, projectID]
        );
      }

      // get array of collaborators and their online status
      let scrumMasters = [];
      if(master_result.length > 0){
        scrumMasters = master_result.map(row => ({ username: row.username, onlineStatus: row.onelineStatus }));
      }

      // get usernames and online status for developers
      const dev_result = await queryAsync(
        'SELECT pu.username, u.onelineStatus FROM projectuserlist pu JOIN users u ON pu.username = u.username WHERE pu.projectID = (?) AND pu.permission = 1',
        [projectID],
      );

      // get array of collaborators and their online status
      let developers = [];
      if(dev_result.length > 0){
        developers = dev_result.map(row => ({ username: row.username, onlineStatus: row.onelineStatus }));
      }

      console.log("owners", owners);
      console.log("masters", scrumMasters);
      console.log("developers", developers);


      // Send the list of collaborators back to the client
      if (amount.length > 0) {
        return res.status(200).json({ success: true, messsage: "Success in getting collabs.", owners, scrumMasters, developers, reviewsCompleted: reviews_result[0].reviewsCompleted, currentSprint: reviews_result[0].currentSprint});
      }
      else {
        return res.status(200).json({ success: true, messsage: "Success in getting collabs.", owners, scrumMasters, developers, reviewsCompleted: 0, currentSprint: 1});
      }
    } catch (error) {
      console.error("Error fetching collaborators:", error);
      return res.status(500).json({ success: false, message: "Internal server error fetching collaborators." });
    }


  });

  app.post('/addCollab', extractUsernameFromToken, async(req, res) => {
    const username = req.username;
    const email = req.body.collaboratorEmail;
    const projectID = req.body.projectID;
    const permission = req.body.permission;

    console.log("add collab: ", { email, projectID, permission });

    // check if it is not the first sprint
    // this is to avoid adding users while a review is active
    const currentSprint = await queryAsync(
      'SELECT currentSprint FROM projectlist WHERE projectID = ?',
      [projectID]
    );

    console.log(currentSprint[0].currentSprint);

    // if its passed sprint 1 you cant add collabs
    if (currentSprint[0].currentSprint > 1) {
      return res.status(200).json({ success: false, message: "Cannot add a collaborator after Sprint 1 is completed."});
    }

    //check that they are real and verified
    const collab_res = await queryAsync(
      'SELECT username, isVerified FROM users WHERE email = (?)',
      [email]
    );

    if (collab_res.length > 0) {
      if (collab_res[0].username === req.username) {
        return res.status(200).json({ success: false, message: "Cannot add yourself as collaborator."});
      }

      //if verified
      if (collab_res[0].isVerified == 1) {

        // check that they arent already on project
        const result = await queryAsync(
          'SELECT * FROM projectuserlist WHERE username = (?) AND projectID = (?)',
          [collab_res[0].username, projectID],
        );

        // if they are on the project return error
        if (result.length > 0) {
          return res.status(200).json({ success: false, message: "Collaborator is already on the project."});
        }

        // check the permission of the person adding
        const perm = await queryAsync(
          'SELECT permission FROM projectuserlist WHERE username = (?) AND projectID = (?)',
          [username, projectID],
        );

        const hexPermission = perm[0].permission;
        const intPermission = parseInt(hexPermission, 16);

        if (intPermission < permission) {
          return res.status(200).json({ success: false, message: "You may not assign a role higher than your own."});
        }

        // Get all project members except the one who added the collaborator
        const projectMembers = await queryAsync(
          'SELECT username FROM projectuserlist WHERE projectID = (?) AND username != (?)',
          [projectID, username],
        );

        // insert the user
        await queryAsync(
          'INSERT INTO projectuserlist (username, projectID, permission) VALUES (?, ?, ?)',
          [collab_res[0].username, projectID, permission]
        );

        // Create notifications for each project member
        for (const member of projectMembers) {
          await queryAsync(
              'INSERT INTO notifications (title, description, recipient, projectID) VALUES (?, ?, ?, ?)',
              [`New Collaborator Added`, `${collab_res[0].username} was added to this project by ${username}`, member.username, projectID]
          );
      }

        const name = await queryAsync(
          'SELECT projectName FROM projectlist WHERE projectID = (?)',
          [projectID],
        );
        sendEmail(email, name[0].projectName, req.username);
        return res.status(200).json({ success: true, message: "Collaborator found", username: collab_res[0].username});
      }
      return res.status(200).json({ success: false, message: "Collaborator is not verified."});
    }
    return res.status(200).json({ success: false, message: "Collaborator does not exist."});
  });

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