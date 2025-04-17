import React, { useState } from 'react';
import { Box, Avatar, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const Messages = ({ message, currentUser, handleUnsendMessage, selectedChat }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  // Function to extract initials from a name
  const getInitials = (name) => {
    return name.split(' ').map((n) => n[0]).join('');
  };

  // Determine if the current user is the sender
  const isCurrentUser = message.sender === currentUser;

  // Open menu when clicking on the message
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Close menu
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: isCurrentUser ? 'flex-end' : 'flex-start', // Align based on the message sender
        mb: 2 
    }}>
      <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          flexDirection: isCurrentUser ? 'row-reverse' : 'row' // Reverse direction for current user's messages
      }}>
        <Avatar sx={{ width: 24, height: 24, mr: isCurrentUser ? 0 : 1, ml: isCurrentUser ? 1 : 0 }}>
          {getInitials(isCurrentUser ? currentUser : message.sender)}
        </Avatar>
        <Box
          sx={{
            borderRadius: '16px',
            bgcolor: isCurrentUser ? 'secondary.light' : 'primary.light', // Different background color for the current user
            p: 1,
            maxWidth: '80%',
            position: 'relative', // Position relative for the IconButton
          }}
        >
          <Typography variant="body1" sx={{ wordWrap: 'break-word', cursor: isCurrentUser && !selectedChat.groupchat ? 'pointer' : 'default' }} onClick={handleClick}>
            {message.content}
          </Typography>
          {(isCurrentUser && !selectedChat.groupchat) && (
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={() => {
              handleClose();
              handleUnsendMessage(message); // Call handleUnsendMessage when the menu item is clicked
            }}>Unsend</MenuItem>
          </Menu>
          )}
        </Box>
      </Box>
      {!isCurrentUser && <Typography variant="caption" sx={{ mt: 0.5 }}>{message.sender}</Typography>}
    </Box>
  );
};

export default Messages;