import React , { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Badge, Box, Tooltip, Select, MenuItem, Menu } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MailIcon from '@mui/icons-material/Mail';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ProgressBar from './ProgressBar';
import CreateProjectDialog from './CreateProjectDialog';
import SettingsDialog from './SettingsDialog';
import AddIcon from '@mui/icons-material/Add';
import Axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/system';
import NotificationDropdown from './NotificationDropdown';


function TopBar({ title, onUpdateTheme }) {
  const storedProject = sessionStorage.getItem('currentProjectID');
  const [selectedProject, setSelectedProject] = useState(storedProject || '');;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [sprintNum, setSprintNum] = useState(null);

  const [notifications, setNotifications] = useState([]);

  // Close the menu after clicking "Settings" and open the popup
  const handleSettingsClick = () => {
    setSettingsOpen(true);
    handleMenuClose();
  };

  //logout
  const handleLogoutClick = async (e) => {
    // log the user out
    console.log("logout clicked");
    const authToken = sessionStorage.getItem('authToken');

    const response = await Axios.post('http://localhost:3001/logout', {}, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.data.success) {
      navigate('/login');
    }
  };

  // close the settings popup
  const handleSettingsClose = () => setSettingsOpen(false);

  const handleProjectChange = (event) => {
      setSelectedProject(event.target.value);
      sessionStorage.setItem('currentProjectID', event.target.value);
      // Find the selected project by its ID
      const proj = projects.find(project => project.id === event.target.value);

      // If the selected project is found, set the user's permission in the session storage
      if (proj) {
          sessionStorage.setItem('userPerm', proj.permission);
      }
      window.location.reload();
  };

  const handleAddProjectClick = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
  }

  const handleAccountClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const fetchNotifications = async () => {
    console.log("fetching notifications");
    try {
      const projID = sessionStorage.getItem("currentProjectID");
      const response = await Axios.get('http://localhost:3001/listNotifications', {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
        params: { projectID: projID },
      });

      // Remove the 'read' field from both old and new notifications before comparison
      const oldNotificationsWithoutRead = notifications.map(({ read, ...rest }) => rest);
      const newNotificationsWithoutRead = response.data.notifications.map(({ read, ...rest }) => rest);

      // Compare the notifications without the 'read' field
      if (JSON.stringify(oldNotificationsWithoutRead) !== JSON.stringify(newNotificationsWithoutRead)) {
        console.log(response.data.notifications);
        // Update notifications while preserving the existing 'read' field
        setNotifications(prevNotifications => {
          return response.data.notifications.map(newNotification => {
            // Find the corresponding existing notification by ID
            const existingNotification = prevNotifications.find(prevNotification => prevNotification.id === newNotification.id);
            // If the existing notification exists, keep its 'read' field, otherwise use the new notification
            return existingNotification ? { ...newNotification, read: existingNotification.read } : newNotification;
          });
        });
      }
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    // Fetch projects from the server when the component mounts
    fetchProjects();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 7000); // Fetch notifications every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchCurrentSprint();
  }, []);

  const fetchCurrentSprint = async () => {
    try {
      const projectID = sessionStorage.getItem('currentProjectID');

      const response = await Axios.post(
        'http://localhost:3001/getCurrentSprint',
        { projectID },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          },
        }
      );

      if (response.data.success) {
        setSprintNum(response.data.currentSprint);
      } else {
        console.log('Error finding current sprint. Please try again.')
      }
    } catch (error) {
        console.log('Error finding current sprint. Please try again.')
    }
  };

  useEffect(() => {
    console.log('Projects:', projects);
  }, [projects]);

  const fetchProjects = async () => {
    try {
      console.log("request project list");
      // Make a request to the server to get the projects
      const response = await Axios.get('http://localhost:3001/listProjects', {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });

      // Update the projects state with the response data
      setProjects(response.data.projects.map(project => ({ id: project.projectID, name: project.projectName, permission: project.permission })));
      console.log(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleNotificationIconClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = async () => {
    setNotifications((prevNotifications) => prevNotifications.filter((notification) => !notification.read));
    setNotificationAnchorEl(null);
    // delete the read notifications
    try {
      // Filter out read notifications
      const readNotifications = notifications.filter(notification => notification.read);

      // Extract notification IDs to be deleted
      const notificationIdsToDelete = readNotifications.map(notification => notification.id);

      if (notificationIdsToDelete.length > 0) {

        // Make a POST request to delete the notifications
        await Axios.post('http://localhost:3001/deleteNotifications', { notificationIds: notificationIdsToDelete }, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          },
        });
      }
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }

    setNotificationAnchorEl(null);
  };
  

  const handleMarkAllAsRead = () => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) => ({ ...notification, read: true }))
    );
  };
  
  const handleNotificationClick = (notificationId) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    );
  };

  const handleChatClick = () => {
    const selectedProjectObject = projects.find(project => String(project.id) === String(selectedProject));
    console.log(selectedProjectObject);
    if (selectedProjectObject) {
     const projectName = selectedProjectObject.name;
     navigate(`/chatboard/${projectName}`);
    }
  }


  const theme = useTheme();
  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ justifyContent: 'space-between', display: 'flex' }}>
        <Box sx={{ width: '25%', display: 'flex' }}>
          <ProgressBar />
        </Box>

        <Box sx={{ zIndex: 1300 }}>
        <Select
          value={selectedProject}
          onChange={handleProjectChange}
          displayEmpty
          inputProps={{ 'aria-label': 'Select project' }}
          sx={{ m: 1, minWidth: 120, backgroundColor: theme.palette.primary.main}}
          MenuProps={{
            MenuListProps: {
              sx: {
                backgroundColor: theme.palette.primary.main,
              },
            },
          }}
        >
          <MenuItem disabled value="">
            <em>Select a project</em>
          </MenuItem>
          {projects.map((project) => (
            <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
          ))}
        </Select>
        </Box>
        
        <Box sx={{ flex: 1}}> 
          {selectedProject && (
            <Typography variant="h2" sx={{width: '100%', textAlign: 'right',  fontSize: "1.5rem", color: theme.palette.text.secondary }}>
              Sprint: {sprintNum}
            </Typography>
          )}
        </Box>

        <Typography variant="h6" sx={{ position: 'absolute', width: '100%', textAlign: 'center', fontSize: "2rem" }}>
          {title}
        </Typography>
        
        <Tooltip title="Add Project">
            <IconButton color="inherit" onClick={handleAddProjectClick}>
              <AddIcon sx={{ fontSize: '2.25rem' }}/>
            </IconButton>
          </Tooltip>
        <IconButton color="inherit" onClick={handleChatClick} sx={{ fontSize: '2rem' }}>
            <MailIcon sx={{ fontSize: 'inherit' }} />
        </IconButton>
        <IconButton color="inherit" onClick={handleNotificationIconClick} sx={{ fontSize: '2rem' }}>
        <Badge badgeContent={notifications.filter(notification => !notification.read).length} color="secondary">
          <NotificationsIcon sx={{ fontSize: 'inherit' }} />
        </Badge>

        </IconButton>
        <IconButton color="inherit" onClick={handleAccountClick} sx={{ fontSize: '2rem' }}>
          <AccountCircle sx={{ fontSize: 'inherit' }} />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          MenuListProps={{
            sx: {
              backgroundColor: theme.palette.primary.main,
            },
          }}
        >
          <MenuItem>{sessionStorage.getItem('user')}</MenuItem>
          <MenuItem onClick={handleSettingsClick}>Account Settings</MenuItem>
          <MenuItem onClick={handleLogoutClick}>Logout</MenuItem>
        </Menu>
      </Toolbar>
      <CreateProjectDialog open={openDialog} onClose={handleCloseDialog} onUpdateTheme={onUpdateTheme}/>
      <SettingsDialog open={settingsOpen} onClose={handleSettingsClose} onUpdateTheme={onUpdateTheme}/>
      <NotificationDropdown
          anchorEl={notificationAnchorEl}
          open={Boolean(notificationAnchorEl)}
          onClose={handleNotificationClose}
          notifications={notifications}
          setNotifications={setNotifications}
          handleMarkAllAsRead={handleMarkAllAsRead}
          handleNotificationClick={handleNotificationClick}
        />
    </AppBar>
  );
}

export default TopBar;
