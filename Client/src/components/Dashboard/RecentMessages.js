import React, { useEffect, useState } from 'react';
import { List, ListItem, ListItemText, ListItemAvatar, Avatar, Typography, Box } from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';
import { useTheme } from '@mui/system';
import Axios from 'axios';

function RecentMessages() {
  const theme = useTheme();
  const [messages, setMessages] = useState(null);

  useEffect(() => {
    const fetchRecentMessages = async () => {
      try {
        const response = await Axios.post('http://localhost:3001/recentMessages', {
          projectID: sessionStorage.getItem("currentProjectID")
        }, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          },
        });
        if (response.data.success) {
          setMessages(response.data.messages);
        } else {
          console.error('Error fetching recent messages:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching recent messages:', error);
      }
    };

    fetchRecentMessages();
  }, []);

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', mt: 4, bgcolor: theme.palette.primary.main, p: 2, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Recent Messages</Typography>
      {(messages && messages.length > 0) ? (
        <List>
          {messages.map((message) => (
            <ListItem key={message.id}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                  <MessageIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={`${message.sender}: ${message.content}`} secondary={message.date} />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body1">No recent unread messages.</Typography>
      )}
    </Box>
  );
}

export default RecentMessages;