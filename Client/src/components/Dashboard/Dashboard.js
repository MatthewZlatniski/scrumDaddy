import React, { useState, useEffect } from 'react';
import { Grid, Box, Dialog, DialogTitle, DialogContent, Typography, Link, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NotesToDoList from './NotesToDoList';
import UserTasks from './UserTasks';
import UpcomingDeadlines from './UpcomingDeadlines';
import RecentMessages from './RecentMessages';
import Sidebar from '../sharedComponents/Sidebar';
import Topbar from '../sharedComponents/Topbar';

function Dashboard({ onUpdateTheme }) {
  const [open, setOpen] = useState(false);
  const [firstValue, setFirstValue] = useState(null);

  useEffect(() => {
    fetchFirstValue();
  }, []);

  const fetchFirstValue = async () => {
    try {
      const response = await fetch('http://localhost:3001/first', {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });
      const data = await response.json();
      setFirstValue(data.first);
      setOpen(data.first === 0);
    } catch (error) {
      console.error('Error fetching first value:', error);
    }
  };

  const handleClose = async () => {
    setOpen(false);
    try {
      await fetch('http://localhost:3001/updateFirst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });
    } catch (error) {
      console.error('Error updating first value:', error);
    }
  };


  return (
    <div>
      {/* Welcome Popup */}
      {firstValue !== null && (
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          Welcome to ScrumDaddy!
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            To learn more about how to use our application, watch the video below:
          </Typography>
          <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
            <iframe
              src="https://www.youtube.com/embed/8tTPHNADdBQ"
              title="Learn More"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>
      )}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
      }}>
        <Topbar title="Overview" completed={30} inProgress={40} onUpdateTheme={onUpdateTheme}/>
      </Box>
      <Box sx={{ display: 'flex', mt: 10 }}>
        <Sidebar />

        {/* Grid container for the dashboard content */}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <UserTasks />
            </Grid>
            <Grid item xs={12} md={6}>
              <UpcomingDeadlines />
            </Grid>
            <Grid item xs={12} md={6}>
              <NotesToDoList />
            </Grid>
            <Grid item xs={12} md={6}>
              <RecentMessages />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </div>
  );
}

export default Dashboard;