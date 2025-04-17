import React, { useState, useEffect } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Toolbar, Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ReportIcon from '@mui/icons-material/Report';
import BacklogIcon from '@mui/icons-material/ViewList';
import SprintIcon from '@mui/icons-material/DirectionsRun';
import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import DocumentIcon from '@mui/icons-material/ContentCopy'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import ProductBacklogIcon from '@mui/icons-material/Wysiwyg';
import { useTheme } from '@mui/system';

const drawerWidth = 240;
const collapsedDrawerWidth = 56;

function Sidebar() {
  const [open, setOpen] = useState(true);
  const [userPerm, setUserPerm] = useState(null); // State to store user permissions
  const theme = useTheme();

  useEffect(() => {
    // Retrieve user permissions from sessionStorage
    const permData = sessionStorage.getItem('userPerm');
    console.log("perm data is ***", permData);
    if (permData) {
      const userPermissions = parseInt(permData);
    // Decode the permissions to determine the user role
    const userRole = decodePermissions(userPermissions);
    setUserPerm(userRole);
    }
  }, []);

  const decodePermissions = (permission) => {
    if (permission === 4) {
      return 'Product Owner';
    } else if (permission === 2) {
      return 'Scrum Master';
    } else if (permission === 1) {
      return 'Developer';
    } else {
      return 'Unknown';
    }
  };

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const menuItems = [
    { text: 'Overview', icon: <HomeIcon sx={{ color: theme.palette.text.primary }} />, path: '/dashboard' },
    { text: 'Collaborators', icon: <GroupIcon sx={{ color: theme.palette.text.primary }} />, path: '/collaborators' },
    { text: 'Current Sprint', icon: <SprintIcon sx={{ color: theme.palette.text.primary }} />, path: '/sprint' },
    { text: 'Backlog', icon: <BacklogIcon sx={{ color: theme.palette.text.primary }} />, path: '/backlog' },
    { text: 'Product Backlog', icon: <ProductBacklogIcon sx={{ color: theme.palette.text.primary }} />, path: '/productbacklog' },
    { text: 'Project Calendar', icon: <CalendarTodayIcon sx={{ color: theme.palette.text.primary }} />, path: '/projectcalendar' },
    { text: 'Progress Report', icon: <ReportIcon sx={{ color: theme.palette.text.primary }} />, path: '/progressreport' },
    { text: 'Design Documents', icon: <DocumentIcon sx={{ color: theme.palette.text.primary }} />, path: '/designdocuments' },
  ];

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? drawerWidth : collapsedDrawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : collapsedDrawerWidth,
          boxSizing: 'border-box',
          transition: 'width 0.2s ease-in-out',
          marginTop: '64px',
          backgroundColor: theme.palette.primary.main,
        },
      }}
    >
      <Toolbar>
        <IconButton onClick={handleDrawerToggle} sx={{ color: theme.palette.text.primary }}>
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Toolbar>
      <List>
        {menuItems.map((item, index) => (
          // Check if the user role allows access to the item
          (item.text === 'Progress Report' && !hasAccessToProgressReport(userPerm)) ? null : (
            <ListItem button key={item.text} component={Link} to={item.path}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              {open && <ListItemText primary={item.text} />}
            </ListItem>
          )
        ))}
      </List>
    </Drawer>
  );
}

// Function to check if the user has access to the Progress Report
const hasAccessToProgressReport = (userPerm) => {
  return userPerm === 'Scrum Master' || userPerm === 'Product Owner';
};

export default Sidebar;
