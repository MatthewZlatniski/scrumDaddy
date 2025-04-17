import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SendIcon from '@mui/icons-material/Send';
import Chatside from './Chatside';
import ChatContent from './ChatContent';
import Axios from 'axios';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';

  const ChatBoard = () => {
    let { projectName } = useParams();
    const navigate = useNavigate();
    const [chats,setChats] = useState([]);
    const [projectUsers, setProjectUsers] = useState([]);
    const [selectedChat, setSelectedChat] = useState(chats.length > 0 ? chats[0] : null);
    const currentUser = sessionStorage.getItem('user');
    const [socket, setSocket] = useState(null);

    useEffect(() => {
      const newSocket = io('http://localhost:3002');
      setSocket(newSocket);
  
      // Clean up the socket connection when the component unmounts
      return () => {
        newSocket.disconnect();
      };
    }, []);

    useEffect(() => {
       if (socket) {
        const username = sessionStorage.getItem('user'); // Retrieve username from session storage
        socket.emit('authenticate', username);
       }
    }, [socket]);

    useEffect(() => {
      // Ensure socket is initialized
      if (socket && chats) {
        // Define the event handler function for group messages
        const handleGroupMessage = ({ messageID, sender, content, timestamp }) => {
          console.log('Received a group message:');
          console.log('Sender:', sender);
          console.log('Content:', content);
          console.log('Timestamp:', timestamp);
          // Find the chat with groupchat set to true
          const groupChat = chats.find(chat => chat.groupchat === true);

          if (groupChat) {
            // Update the group chat's messages with the new message
            const updatedMessages = [
                ...groupChat.messages,
                { messageID, sender, content, timestamp, unread: false }
            ];

            // Update the state with the updated group chat
            setChats(prevChats => prevChats.map(chat => {
                if (chat.id === groupChat.id) {
                    return { ...chat, messages: updatedMessages };
                }
                return chat;
            }));

            if (selectedChat) {
              console.log(selectedChat.groupchat);
              if (selectedChat.groupchat) {
                console.log("appending new message");
                const newMessage = { messageID, sender, content, unread: false, timestamp };
                setSelectedChat(prevSelectedChat => ({
                  ...prevSelectedChat,
                  messages: [...prevSelectedChat.messages, newMessage]
                }));
              }
            }
          } else {
              console.log('Group chat not found.');
          }
        };
    
        // Add the event listener for group messages
        socket.on('groupMessage', handleGroupMessage);
    
        // Return a cleanup function to remove the event listener when the component unmounts
        return () => {
          socket.off('groupMessage', handleGroupMessage);
        };
      }
    }, [socket, chats]);

    useEffect(() => {
      // Ensure socket is initialized
      if (socket && chats) {
        // Emit authentication event with the username

        // Define the event handler function
        const handleNewMessage = ({ messageID, sender, content, timestamp }) => {
          console.log('Received a new message:');
          console.log('Sender:', sender);
          console.log('Content:', content);
          console.log(chats);
          console.log(selectedChat);
    
          // Find the chat corresponding to the sender's id
          const updatedChats = chats.map(chat => {
            if (chat.id === sender) {
              if (selectedChat) {
                if (chat.id === selectedChat.id) {
                  console.log("emit false");
                  socket.emit('unreadResponse', false);
                  const newMessage = { messageID, sender, content, unread: false, timestamp };
                  setSelectedChat(prevSelectedChat => ({
                    ...prevSelectedChat,
                    messages: [...prevSelectedChat.messages, newMessage]
                  }));
                  return {
                    ...chat,
                    messages: [
                      ...chat.messages,
                      { messageID, sender, content, unread: false, timestamp }
                    ]
                  };
                }
                else {
                  console.log("emit true");
                  socket.emit('unreadResponse', true);
                  return {
                    ...chat,
                    messages: [
                      ...chat.messages,
                      { messageID, sender, content, unread: true, timestamp }
                    ]
                  };
                }
              } else {
                console.log("emit true");
                socket.emit('unreadResponse', true);
                return {
                  ...chat,
                  messages: [
                    ...chat.messages,
                    { messageID, sender, content, unread: true, timestamp }
                  ]
                };
              }
            }
            return chat;
          });
    
          setChats(updatedChats);
        };
    
        // Add the event listener
        socket.on('add message', handleNewMessage);
    
        // Return a cleanup function to remove the event listener when the component unmounts
        return () => {
          socket.off('add message', handleNewMessage);
        };
      }
    }, [socket, chats]);

    useEffect(() => {
      if (socket && chats) {
        socket.on('deleteMessage', ({ messageID, sender }) => {
          console.log("got delete prompt");
          // Check if the message to delete exists in the selected chat
          if (selectedChat && selectedChat.messages.some(msg => msg.messageID === messageID)) {
            // Remove the message from the selected chat
            const updatedSelectedChat = {
              ...selectedChat,
              messages: selectedChat.messages.filter(msg => msg.messageID !== messageID)
            };
            setSelectedChat(updatedSelectedChat);
    
            // Remove the message from the chats list
            const updatedChats = chats.map(chat => {
              if (chat.id === selectedChat.id) {
                return updatedSelectedChat;
              }
              return chat;
            });
            setChats(updatedChats);
          }
        });
      }
    
      // Clean up the event listener when the component unmounts
      return () => {
        if (socket) {
          socket.off('deleteMessage');
        }
      };
    }, [socket, chats]);

  useEffect(() => {
    // Fetch chat threads when component mounts
    fetchChatThreads();
  }, []);

  const fetchChatThreads = async () => {
    try {
        const projectID = sessionStorage.getItem('currentProjectID');
        // Make a POST request to fetch chat threads from the server
        const response = await Axios.post('http://localhost:3001/getChats', { projectID }, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          },
        });

        if (response.data.success) {
            setChats(response.data.chats);
            setProjectUsers(response.data.projectUsers);
            
        } else {
            console.error('Error fetching chat threads:', response.data.message);
        }
    } catch (error) {
        console.error('Error fetching chat threads:', error);
    }
  };

  const handleNewChat = (event, newValue) => {
    // Check if a chat with the selected user already exists
    const existingChat = chats.find(chat => chat.recipient.includes(newValue));
  
    if (existingChat) {
      // If chat exists, just select it
      setSelectedChat(existingChat);
    } else {
      // Create a new chat object
      const newChat = {
        id: `chat${chats.length + 1}`, // Ensure unique ID
        recipient: [newValue], // recipient should be an array for consistency
        messages: [] // Start with an empty messages array
      };
  
      // Update chats state to include the new chat
      setChats(prevChats => [...prevChats, newChat]);
  
      // Set the newly created chat as the selected chat
      setSelectedChat(newChat);
      console.log(chats);
    }
  };
  

  const handleSendMessage = async (newMessageContent) => {
    if (!newMessageContent.trim()) return; // Prevent sending empty messages
  
    const newMessage = {
      sender: currentUser,
      content: newMessageContent,
      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
      unread: true,
    };
  
    try {
      // Make a POST request to send the new message to the server for storage
      const response = await Axios.post('http://localhost:3001/sendMessage', {
          content: newMessage.content,
          timestamp: newMessage.timestamp,
          projectID: sessionStorage.getItem('currentProjectID'),
          recipient: selectedChat.recipient,
          groupchat: selectedChat.groupchat,
        },
        {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });

      if (response.data.success) {
          newMessage.messageID = response.data.messageID;
          // Update the local state with the new message
          setChats(prevChats => {
              return prevChats.map(chat => {
                  if (chat.id === selectedChat.id) {
                      return { ...chat, messages: [...chat.messages, newMessage] };
                  }
                  return chat;
              });
          });
          setSelectedChat(currentSelectedChat => ({
              ...currentSelectedChat,
              messages: [...currentSelectedChat.messages, newMessage],
          }));
      } else {
          console.error('Error sending message:', response.data.message);
      }
  } catch (error) {
      console.error('Error sending message:', error);
  }
  
  };


  const updatedDatabase = async(updatedChat) => {
    try {
      // Make a POST request to mark messages as read
      const response = await Axios.post('http://localhost:3001/readMessages', {
        recipient: updatedChat.recipient,
        projectID: sessionStorage.getItem('currentProjectID'),
      }, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });
  
      if (response.data.success) {
        console.log('Messages marked as read successfully');
      } else {
        console.error('Error marking messages as read:', response.data.message);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

const handleSelectChat = (chat) => {
// Check for unread messages in the selected chat and mark them as read
const updatedChats = chats.map(c => {
  if (c.id === chat.id) {
    const updatedMessages = c.messages.map(message => {
      // Only mark messages as read if they are from the recipient to the current user
      if (message.sender !== currentUser && message.unread) {
        return { ...message, unread: false };
      }
      return message;
    });
    return { ...c, messages: updatedMessages };
  }
  return c;
});
// Update the chats state with the messages marked as read
setChats(updatedChats);

// Update the selected chat state to reflect the read messages
const updatedSelectedChat = {
  ...chat,
  messages: chat.messages.map(message => {
    if (message.sender !== currentUser && message.unread) {
      return { ...message, unread: false };
    }
    return message;
  })
};
console.log(updatedChats);
setSelectedChat(updatedSelectedChat);

  if (!updatedSelectedChat.groupchat) {
    updatedDatabase(updatedSelectedChat);
  }
};

const handleUnsendMessage = async (message) => {
  try {
    // Make a POST request to mark messages as read
    const response = await Axios.post('http://localhost:3001/unsendMessage', {
      messageID: message.messageID
    }, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
      },
    });

    if (response.data.success) {
      // Remove the message from the selected chat
      const updatedSelectedChat = {
        ...selectedChat,
        messages: selectedChat.messages.filter(msg => msg.messageID !== message.messageID)
      };
      setSelectedChat(updatedSelectedChat);

      // Remove the message from the chats list
      const updatedChats = chats.map(chat => {
        if (chat.id === selectedChat.id) {
          return updatedSelectedChat;
        }
        return chat;
      });
      setChats(updatedChats);
    } else {
      console.error('Error unsending message', response.data.message);
    }
  } catch (error) {
    console.error('Error unsending message', error);
  }
};




const goToHome = () => {
  navigate('/dashboard');
};

return (
    <>
      <AppBar position="static">
  <Toolbar sx={{ justifyContent: "space-between" }}>
    <IconButton edge="start" color="inherit" onClick={goToHome} sx={{ mr: 2 }}>
      <HomeIcon />
    </IconButton>
    <Typography variant="h6" component="div" sx={{ flexGrow: 1, textAlign: "center" }}>
      Project: {projectName}
    </Typography>
    <Box sx={{ width: 48 }} />
  </Toolbar>
</AppBar>
<Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
  <Chatside
    projectUsers={projectUsers}
    chats={chats}
    setSelectedChat={handleSelectChat}
    currentUser={currentUser}
  />
    
  <ChatContent
    selectedChat={selectedChat}
    currentUser={currentUser}
    sendMessage={handleSendMessage}
    handleUnsendMessage={handleUnsendMessage}
  />
      </Box>
    </>
  );
};

export default ChatBoard;