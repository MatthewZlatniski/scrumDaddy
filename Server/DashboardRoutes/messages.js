const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');

// imports the function to get a username from an auth token
const { extractUsernameFromToken } = require('../authMiddleware');
const { addUserSocket, removeUserSocket, getUserSocket } = require('../socketManager');

module.exports = (app, con, io) => {

  app.post('/getChats', extractUsernameFromToken, async (req, res) => {
    const username = req.username;
    const projectID = req.body.projectID;

    try {
        // Get all users to message
        const userlist = await queryAsync(
            'SELECT username FROM projectuserlist WHERE projectID = ? AND username != ?',
            [projectID, username]
        );

        // Append the group chat as a user to the formatted user list
        const projectNameResult = await queryAsync(
          'SELECT projectName FROM projectlist WHERE projectID = ?',
          [projectID]
        );
        const projectName = projectNameResult[0].projectName;

        const formattedUserList = [
          ...userlist.map(user => ({
              id: user.username,
              label: user.username
          })),
          {
              id: projectID,
              label: projectName
          }
      ];

        // Fetch the messages for each chat
        const chatThreads = await Promise.all([
            // Fetch individual chats
            ...userlist.map(async (user) => {
                // Query to get the messages between the current user and the recipient
                const messages = await queryAsync(
                    'SELECT messageID, sender, content, unread, timestamp FROM messages WHERE ((sender = ? AND recipient = ?) OR (sender = ? AND recipient = ?)) AND projectID = ? ORDER BY timestamp',
                    [username, user.username, user.username, username, projectID]
                );

                return {
                    id: user.username, // Unique ID for each chat (you can modify this as needed)
                    recipient: user.username, // Recipient is the username
                    messages: messages.map(message => ({
                        ...message,
                        unread: Boolean(message.unread) // Cast to boolean
                    })), // Include all messages for the chat
                    groupchat: false
                };
            }),
            // Fetch group chat for the project
            (async () => {
                // Query to get group chat messages for the project
                const groupChatMessages = await queryAsync(
                    'SELECT messageID, sender, content, unread, timestamp FROM messages WHERE projectID = ? AND groupchat = true ORDER BY timestamp',
                    [projectID]
                );

                // If there are no messages for the group chat, create an entry with empty messages array
                if (groupChatMessages.length === 0) {
                    return {
                        id: projectID, // Unique ID for group chat
                        recipient: projectName, // Recipient is the project name
                        messages: [], // Empty messages array
                        groupchat: true
                    };
                }

                return {
                    id: projectID, // Unique ID for group chat
                    recipient: projectName, // Recipient is the project name
                    messages: groupChatMessages.map(message => ({
                        ...message,
                        unread: Boolean(message.unread) // Cast to boolean
                    })), // Include all messages for the group chat
                    groupchat: true
                };
            })()
        ]);

        res.status(200).json({ success: true, message: 'success', chats: chatThreads, projectUsers: formattedUserList });
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ success: false, message: 'Internal server error while fetching chats' });
    }
});

  app.post('/getMessages', extractUsernameFromToken, async (req, res) => {
    const username = req.username;
    const recipient = req.body.recipient;
    const projectID = req.body.projectID;

    try {
      await queryAsync(
        'UPDATE messages SET unread = false WHERE recipient = ? AND sender = ? AND projectID = ?',
        [username, recipient, projectID]
      );

      // Query the messages table for messages between sender and recipient, sorted by timestamp
      const messages = await queryAsync(
          'SELECT sender, content FROM messages WHERE ((sender = ? AND recipient = ?) OR (sender = ? AND recipient = ?)) AND projectID = ? ORDER BY timestamp',
          [username, recipient, recipient, username, projectID]
      );

      // Send the messages array in the response
      res.status(200).json({ success: true, message: 'success', messages: messages });
    } catch (error) {
        console.error('Error listing messages:', error);
        res.status(500).json({ success: false, message: 'Internal server error while listing messages' });
    }
  });

  app.post('/readMessages', extractUsernameFromToken, async (req, res) => {
    const sender = req.username;
    const recipient = req.body.recipient;
    const projectID = req.body.projectID;

    try {
        // Update unread to false for all relevant messages
        await queryAsync(
            'UPDATE messages SET unread = false WHERE sender = ? AND recipient = ? AND projectID = ?',
            [recipient, sender, projectID]
        );

        res.status(200).json({ success: true, message: 'Messages marked as read successfully' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ success: false, message: 'Internal server error while marking messages as read' });
    }
});

  // Endpoint to unsend a message
  app.post('/unsendMessage', extractUsernameFromToken, async (req, res) => {
    const sender = req.username;
    const messageID = req.body.messageID;

    try {
      // Check if the message exists and the sender matches
      const messageExists = await queryAsync(
        'SELECT recipient FROM messages WHERE messageID = ? AND sender = ?',
        [messageID, sender]
      );

      if (messageExists.length === 0) {
        // If the message does not exist or the sender does not match, return an error
        return res.status(400).json({ success: false, message: 'Message not found or you do not have permission to unsend this message' });
      }

      // Delete the message from the database
      await queryAsync(
        'DELETE FROM messages WHERE messageID = ?',
        [messageID]
      );

      const recipient = messageExists[0].recipient;

      const recipientSocketID = getUserSocket(recipient);

      if (recipientSocketID) {
        if (isSocketConnected(recipientSocketID)) {
          io.to(recipientSocketID).emit('deleteMessage', { messageID, sender });
        }
      }

      // Send success response
      res.status(200).json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ success: false, message: 'Internal server error while deleting message' });
    }
  });

  app.post('/recentMessages', extractUsernameFromToken, async (req, res) => {
    const username = req.username;
    const projectID = req.body.projectID;

    try {
      // Query to get the most recent unread messages
      const recentMessages = await queryAsync(
        'SELECT messageID, sender, content, timestamp FROM messages WHERE recipient = ? AND projectID = ? AND unread = true ORDER BY timestamp DESC LIMIT 3',
        [username, projectID]
      );

      // Format messages data
      const formattedMessages = recentMessages.map(message => ({
        id: message.messageID,
        sender: message.sender,
        content: message.content,
        date: calculateTimeDifference(message.timestamp)
      }));

      res.status(200).json({ success: true, message: 'Recent unread messages fetched successfully', messages: formattedMessages });
    } catch (error) {
      console.error('Error fetching recent messages:', error);
      res.status(500).json({ success: false, message: 'Internal server error fetching recent messages' });
    }
  });

  function calculateTimeDifference(timestamp) {
    const adjustedTimestamp = new Date(timestamp);
    adjustedTimestamp.setHours(adjustedTimestamp.getHours() - 4);
    const messageDate = new Date(adjustedTimestamp);
  
    // Format date and time nicely
    const formattedDate = messageDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const formattedTime = messageDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  
    return `${formattedDate} ${formattedTime}`;
  }

  app.post('/sendMessage', extractUsernameFromToken, async (req, res) => {
    const sender = req.username;
    const recipient = req.body.recipient;
    const projectID = req.body.projectID;
    const content = req.body.content;
    const timestamp = req.body.timestamp;
    const groupchat = req.body.groupchat;

    

    console.log("send message", { sender, recipient, projectID, content, timestamp, groupchat });

    try {
      if (groupchat) {
        // get all users on the project besides myself
        const userList = await queryAsync('SELECT username FROM projectuserlist WHERE projectID = ? AND username != ?', [projectID, sender]);

        const messageID = await insertMessage(false, sender, recipient, projectID, content, timestamp, true);
        // Emit the message to each user's socket
        userList.forEach(async (user) => {
          const recipientSocketID = getUserSocket(user.username);
          if (recipientSocketID && isSocketConnected(recipientSocketID)) {
              io.to(recipientSocketID).emit('groupMessage', { messageID, sender, content, timestamp });
          }
        });

        res.status(200).json({ success: true, message: 'Message sent successfully', messageID });
      } else {
        // Retrieve the recipient's socket ID from the socket map
        const recipientSocketID = getUserSocket(recipient);

        const messageID = await insertMessage(true, sender, recipient, projectID, content, timestamp, false);

        if (recipientSocketID) {
            console.log("sending message to: ", recipientSocketID, recipient);

            // Check if the recipient's socket is connected
            if (isSocketConnected(recipientSocketID)) {
                // Emit the message event to the recipient socket
                io.to(recipientSocketID).emit('add message', { messageID, sender, content, timestamp });

                const recipientSocket = io.sockets.sockets.get(recipientSocketID);

                // Set a timeout of 3 seconds
                const timeout = setTimeout(() => {
                    console.log('Timeout reached, defaulting unread to true');
                }, 3000); // Timeout set to 3 seconds

                // Attach an event listener to the socket
                recipientSocket.on('unreadResponse', (receivedUnread) => {
                    clearTimeout(timeout); // Clear the timeout
                    console.log("got response", receivedUnread);
                    // Insert message into the messages table with the received unread value
                    if (!receivedUnread) {
                      changeUnread(messageID);
                    }
                });
            } else {
                console.log(`Recipient ${recipient} is not connected.`);
                // Insert message into the messages table with unread set to true
            }
        } else {
            console.log(`Recipient ${recipient} not found.`);
        }

        res.status(200).json({ success: true, message: 'Message sent successfully', messageID });

      }
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: 'Internal server error while sending message' });
    }
});

function isSocketConnected(socketID) {
    // Check if the socket ID exists in the list of connected sockets
    return io.sockets.sockets.has(socketID);
}

async function changeUnread(messageID) {
  try {
      // Update the message in the messages table to mark it as read
      await queryAsync(
          'UPDATE messages SET unread = ? WHERE messageID = ?',
          [false, messageID]
      );
      console.log(`Message with ID ${messageID} marked as read successfully`);
  } catch (error) {
      console.error(`Error marking message with ID ${messageID} as read:`, error);
      throw error; // Rethrow the error for handling in the calling function
  }
}

async function insertMessage(unread, sender, recipient, projectID, content, timestamp, groupChat) {
  try {
      // Insert message into the messages table
      const result = await queryAsync(
          'INSERT INTO messages (sender, recipient, projectID, content, unread, timestamp, groupchat) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [sender, recipient, projectID, content, unread, timestamp, groupChat]
      );
      const messageID = result.insertId; // Get the inserted message ID
      return messageID; // Return the messageID
  } catch (error) {
      console.error('Error inserting message:', error);
      throw error; // Rethrow the error for handling in the calling function
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