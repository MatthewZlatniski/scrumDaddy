import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useTheme } from '@mui/system';

function ConfirmationDialog({ open, onClose, onConfirm }) {
  const permission = sessionStorage.getItem('userPerm');
  const theme = useTheme();

  if (permission === '4') {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle sx={{fontWeight: 'bold', color: 'black'}}>Confirm Delete</DialogTitle>
        <DialogContent sx={{color: 'black'}}>Are you sure you want to delete this user story?</DialogContent>
        <DialogContent sx={{color: 'black'}}>Deleting a User Story will delete the Tasks assigned to it.</DialogContent>
        <DialogActions>
          <Button onClick={onClose} sx={{color: theme.palette.text.secondary}}>
            Cancel
          </Button>
          <Button onClick={onConfirm} sx={{color: theme.palette.text.secondary}} autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    );
  } else {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent variant="body1" sx={{ color: 'black' }}>
          You are not allowed to delete user stories.
        </DialogContent>
      </Dialog>
    );
  }
}

export default ConfirmationDialog;