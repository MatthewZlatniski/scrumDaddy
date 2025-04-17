import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, List, TextField, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import Messages from './Messages';

const ChatContent = ({ selectedChat, currentUser, sendMessage, handleUnsendMessage }) => {
  const [message, setMessage] = useState('');
  const messageListRef = useRef(null);

  // Handle sending a message
  const handleSendMessage = () => {
    if (message.trim() !== '') { // Check if message is not just empty spaces
      sendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Scroll to the bottom of the message list when it updates
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [selectedChat]);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {!selectedChat ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="h6">No chat selected</Typography>
          <Typography>Select a chat from the left sidebar</Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflow: 'auto', padding: 2 }} ref={messageListRef}>
          <Typography variant="h5">Chat with {selectedChat.recipient}</Typography>
          <List>
            {selectedChat.messages.map((msg, index) => (
              <Messages key={index} message={msg} currentUser={currentUser} handleUnsendMessage={handleUnsendMessage} selectedChat={selectedChat} />
            ))}
          </List>
        </Box>
      )}
      {/* Message Input */}
      <Box sx={{ padding: 2, borderTop: '1px solid #ccc', display: 'flex', alignItems: 'center', gap: 1 }}>
      {selectedChat && (
        <>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            multiline
            maxRows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            sx={{ flexGrow: 1 }}
          />
          <Button variant="contained" onClick={handleSendMessage} sx={{ whiteSpace: 'nowrap' }}>
            <SendIcon />
          </Button>
        </>
      )}
    </Box>
    </Box>
  );
};

export default ChatContent;