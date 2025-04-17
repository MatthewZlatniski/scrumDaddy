import React, { useState, useEffect } from 'react';
import { Dialog, Button, AppBar, Tabs, Tab, Box, Typography, Paper, FormControl, FormLabel, FormGroup, FormControlLabel, Checkbox, TextField } from '@mui/material';
import { styled, useTheme } from '@mui/system';
import CircularProgress from '@mui/material/CircularProgress';
import Axios from 'axios';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const BlueBox = styled(Box)(({ theme }) => ({
  background: theme.palette.text.secondary,
  padding: theme.spacing(2),
}));

function SettingsDialog({ open, onClose, onUpdateTheme }) {
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({});
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleClose = () => {
    // Set notificationSettings to null before closin
    setTabValue(0);
    onClose();
  };

  const handleNotificationChange = (event) => {
    const { name, checked } = event.target;
    setNotificationSettings(prevSettings => ({
      ...prevSettings,
      [name]: checked,
    }));
  };

  const handleSaveNotificationSettings = async () => {
    try {
      const projectID = sessionStorage.getItem('currentProjectID');
      const authToken = sessionStorage.getItem('authToken');

      // Make a request to save the updated notification settings
      const response = await Axios.post(
        'http://localhost:3001/updateNotificationSettings',
        { projectID, notificationSettings },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.data.success) {
        console.log('Notification settings saved successfully.');
      } else {
        console.error('Failed to save notification settings:', response.data.message);
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSwitchTheme = async () => {
    setIsLoading(true);
    try {
      const authToken = sessionStorage.getItem('authToken');

      // Make a request to update the theme
      const response = await Axios.post('http://localhost:3001/changeTheme', {}, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Check if the response contains the updated theme
      if (response.data.success && response.data.newTheme) {
        sessionStorage.setItem('theme', response.data.newTheme);
        onUpdateTheme(response.data.newTheme);
      } else {
        setPasswordChangeMessage('Error switching theme.');
      }
    } catch (error) {
      setPasswordChangeMessage('Error switching theme.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      const projectID = sessionStorage.getItem('currentProjectID');
      const authToken = sessionStorage.getItem('authToken');

      // Make a request to delete the project
      const response = await Axios.post(
        'http://localhost:3001/deleteProject',
        { projectID },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      // Check if the project was deleted successfully
      if (response.data.success) {
        sessionStorage.setItem('currentProjectID', '');
        setDeleteMessage('Project deleted successfully.');
        window.location.reload();
      } else {
        setDeleteMessage(response.data.message);
      }
    } catch (error) {
      setDeleteMessage('Error deleting project.');
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');

    if (oldPassword.trim() === '' || newPassword.trim() === '') {
      setPasswordError('Please enter both old and new passwords.');
      return;
    }

    try {
      const authToken = sessionStorage.getItem('authToken');

      // Make a request to change the password
      const response = await Axios.post(
        'http://localhost:3001/changePassword',
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      // Check if the password was changed successfully
      if (response.data.success) {
        setPasswordChangeMessage('Password changed successfully.');
        setOldPassword('');
        setNewPassword('');
      } else {
        setPasswordChangeMessage(response.data.message);
      }
    } catch (error) {
      setPasswordChangeMessage('Your old password was entered incorrectly');
    }
  };

  useEffect(() => {
    // Fetch notification settings when notifications tab is opened
      console.log("GET SETTINGS");
      fetchNotificationSettings();
  }, [open]);

  const fetchNotificationSettings = async () => {
    console.log("get the notifications");
    try {
      const projectID = sessionStorage.getItem('currentProjectID');

      // Make a request to fetch notification settings
      const response = await Axios.post('http://localhost:3001/listNotificationSettings', { projectID },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          },
        }
      );

      // Update notification settings state with fetched data
      if (response.data.success) {
        setNotificationSettings(response.data.notificationSettings);
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  const theme = useTheme();

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <BlueBox>
        <Typography variant="h5" gutterBottom style={{ color: '#fff' }}>
          Settings
        </Typography>
        <AppBar position="static">
          <Tabs sx={{ bgcolor: theme.palette.text.secondary, color: theme.palette.background.default }} value={tabValue} onChange={handleTabChange} textColor="inherit">
            <Tab label="Theme" />
            <Tab label="Username" />
            <Tab label="Email" />
            <Tab label="Password" />
            <Tab label="Project" />
            <Tab label="Notifications" />
          </Tabs>
        </AppBar>
      </BlueBox>
      <StyledPaper>
        <Box>
          {tabValue === 0 && (
            <div>
              {isLoading ? (
                <CircularProgress color="secondary" style={{ marginTop: '16px' }} />
              ) : (
                <Button onClick={handleSwitchTheme} variant="contained" color="primary" style={{ marginTop: '16px' }}>
                  Switch Theme
                </Button>
              )}
            </div>
          )}
          {tabValue === 1 && <Typography>Username change content</Typography>}
          {tabValue === 2 && <Typography>Email change content</Typography>}
          {tabValue === 3 && (
            <div>
              <TextField
                label="Old Password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                margin="normal"
              />
              {passwordError && (
                <Typography variant="body2" color="error" style={{ marginTop: '8px' }}>
                  {passwordError}
                </Typography>
              )}
              <Button onClick={handleChangePassword} variant="contained" color="primary" style={{ marginTop: '16px' }}>
                Change Password
              </Button>
              <Typography variant="body2" color={passwordChangeMessage.includes('successfully') ? 'primary' : 'error'} style={{ marginTop: '8px' }}>
                {passwordChangeMessage}
              </Typography>
            </div>
          )}
          {tabValue === 4 && (
            <div>
              <Button onClick={handleDeleteProject} variant="contained" color="primary" style={{ marginTop: '16px' }}>
                Delete Project
              </Button>
              <Typography variant="body2" color={deleteMessage.includes('successfully') ? 'primary' : 'error'} style={{ marginTop: '8px' }}>
                {deleteMessage}
              </Typography>
            </div>
          )}
          {tabValue === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column'}}>
              <FormControl component="fieldset">
                <FormGroup>
                  <FormControlLabel
                    control={<Checkbox color='secondary' checked={!!notificationSettings.inAppNotifications} onChange={handleNotificationChange} name="inAppNotifications" />}
                    label="In-App Notifications"
                  />
                  <FormControlLabel
                    control={<Checkbox color='secondary' checked={!!notificationSettings.emailNotifications} onChange={handleNotificationChange} name="emailNotifications" />}
                    label="Email Notifications"
                  />
                  {notificationSettings.emailNotifications && (
                    <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 35}}>
                      <FormControlLabel
                        control={<Checkbox color='secondary' checked={!!notificationSettings.assignedToTask} onChange={handleNotificationChange} name="assignedToTask" />}
                        label="Notify when assigned to a task"
                      />
                      <FormControlLabel
                        control={<Checkbox color='secondary' checked={!!notificationSettings.taskModifiedDeleted} onChange={handleNotificationChange} name="taskModifiedDeleted" />}
                        label="Notify when a task assigned is modified/deleted"
                      />
                      <FormControlLabel
                        control={<Checkbox color='secondary' checked={!!notificationSettings.userStoryCreated} onChange={handleNotificationChange} name="userStoryCreated" />}
                        label="Notify when a user story is created"
                      />
                    </div>
                  )}
                </FormGroup>
              </FormControl>
              <Button onClick={handleSaveNotificationSettings} variant="contained" color="primary" style={{ marginTop: '16px', width: 275 }}>
                Save Notification Settings
              </Button>
            </div>
          )}
          <Button onClick={handleClose} variant="contained" color="primary" style={{ marginTop: '16px' }}>
            Close
          </Button>
        </Box>
      </StyledPaper>
    </Dialog>
  );
}

export default SettingsDialog;