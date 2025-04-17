import React, { useEffect, useState } from 'react';
import { List, ListItem, ListItemText, ListItemIcon, Box, Typography } from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { red, amber, green } from '@mui/material/colors';
import { useTheme } from '@mui/system';
import Axios from 'axios';

function UpcomingDeadlines() {
  const [deadlines, setDeadlines] = useState(null);
  const theme = useTheme();
  const maxBoxHeight = 340; // Fixed maximum height for the box

  const urgencyColor = (urgency) => {
    switch (urgency) {
      case 'high':
        return red[500];
      case 'medium':
        return amber[500];
      case 'low':
        return green[500];
      default:
        return green[500];
    }
  };

  useEffect(() => {
    const fetchDeadlines = async () => {
      console.log("FETCH DEADLINES");
      try {
        const response = await Axios.post('http://localhost:3001/deadlines', {
          projectID: sessionStorage.getItem("currentProjectID")
        }, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          },
        });
        if (response.data.success) {
          console.log("DEADLINES", response.data.deadlines);
          setDeadlines(response.data.deadlines);
        } else {
          console.error('Error fetching deadlines:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching deadlines:', error);
      }
    };

    fetchDeadlines();
  }, []);

  return (
    <Box sx={{ width: 400, margin: 'auto', mt: 4, bgcolor: theme.palette.primary.main, p: 2, borderRadius: 2, height: maxBoxHeight }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Upcoming Calendar Events</Typography>
      {deadlines && deadlines.length > 0 ? (
        <List>
          {deadlines.map((deadline) => (
            <ListItem key={deadline.id}>
              <ListItemIcon>
                <EventNoteIcon sx={{ color: urgencyColor(deadline.urgency) }} />
              </ListItemIcon>
              <ListItemText primary={deadline.title} secondary={deadline.date} />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body1">There are no Calendar Events on this project</Typography>
      )}
    </Box>
  );
}

export default UpcomingDeadlines;