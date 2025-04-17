import React, { useState } from 'react';
import { Menu, Box, Typography, Divider, List, ListItemButton, ListItemText, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useTheme } from '@mui/system';
import MarkAsReadIcon from '@mui/icons-material/DoneAll';

function NotificationDropdown({ anchorEl, open, onClose, notifications, setNotifications, handleMarkAllAsRead, handleNotificationClick }) {
  const theme = useTheme();
  const [selectedNotification, setSelectedNotification] = useState(null);

  const handleNotificationItemClick = (notification) => {
    // Mark the notification as read
    notification.read = true;

    // Update the selected notification
    setSelectedNotification(notification);

    // Update the notifications array to reflect the change
    const updatedNotifications = notifications.map((n) => {
      if (n.id === notification.id) {
        return notification;
      }
      return n;
    });

    // Set the updated notifications array in the state
    setNotifications(updatedNotifications);
  };

  const handleClosePopup = () => {
    setSelectedNotification(null);
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        elevation={4}
        sx={{
          "& .MuiPaper-root": {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.text.primary,
            maxWidth: 360,
            overflow: 'hidden'
          },
        }}
      >
        <Box sx={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 2, backgroundColor: theme.palette.primary.dark }}>
            <Typography variant="subtitle1" sx={{ color: theme.palette.text.primary }}>Notifications</Typography>
            <Tooltip title="Mark all as read">
              <IconButton onClick={handleMarkAllAsRead} size="small" sx={{ color: theme.palette.text.primary }}>
                <MarkAsReadIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Divider />
          {notifications.length > 0 ? (
            <List dense>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItemButton
                  onClick={() => handleNotificationItemClick(notification)}
                  sx={{
                    backgroundColor: notification.read ? theme.palette.action.disabledBackground : 'inherit',
                    pointerEvents: notification.read ? 'none' : 'auto',
                    color: notification.read ? theme.palette.text.disabled : theme.palette.text.primary, // Adjust text color based on read status
                  }}
                >
                  <ListItemText 
                    primary={notification.title} 
                    secondary={notification.description.length > 35 ? `${notification.description.slice(0, 35)}...` : notification.description} 
                  />
                </ListItemButton>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
            </List>
          ) : (
            <Typography sx={{ p: 2, textAlign: 'center' }}>No new notifications.</Typography>
          )}
        </Box>
      </Menu>
      {/* Notification Popup Dialog */}
      <Dialog open={selectedNotification !== null} onClose={handleClosePopup} PaperProps={{ sx: { backgroundColor: theme.palette.primary.main } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
          <Box sx={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            <Typography variant="subtitle1" sx={{ color: theme.palette.text.primary, fontWeight: 'bold', flexGrow: 1 }}>
              {selectedNotification?.title}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 'bold' }}>
              {selectedNotification?.formattedTimestamp}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ whiteSpace: 'pre-line' }}>
          <Typography sx={{color: theme.palette.text.primary}}>{selectedNotification?.description}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePopup} sx={{color: theme.palette.text.secondary}}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default NotificationDropdown;