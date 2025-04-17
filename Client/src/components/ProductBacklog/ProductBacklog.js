import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  IconButton,
  Button,
  Tooltip,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteIcon from '@mui/icons-material/Delete';
import UserStoryDetailDialog from './UserStoryDetailDialog';
import Sidebar from '../sharedComponents/Sidebar';
import TopBar from '../sharedComponents/Topbar';
import CreateUserStoryForm from './CreateUserStoryForm';
import ConfirmationDialog from './ConfirmationDialog';
import Axios from 'axios';
import { useTheme } from '@mui/system';

function ProductBacklog({ onUpdateTheme }) {
  const [openUserStoryDialog, setOpenUserStoryDialog] = useState(false);
  const [selectedUserStory, setSelectedUserStory] = useState(null);
  const [userStories, setUserStories] = useState([]);
  const [showCreateUserStoryForm, setShowCreateUserStoryForm] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [userStoryToDelete, setUserStoryToDelete] = useState(null);
  const [currentSprintStories, setCurrentSprintStories] = useState([]);
  const [backlogStories, setBacklogStories] = useState([]);

  const permission = sessionStorage.getItem('userPerm');

  useEffect(() => {
    const projectID = sessionStorage.getItem('currentProjectID');
    if (projectID) {
      fetchUserStories(projectID);
    }
  }, []);

  useEffect(() => {
    // Filter user stories into current sprint and backlog
    const currentSprint = [];
    const backlog = [];
    userStories.forEach((userStory) => {
      if (userStory.isCurrentSprint) {
        currentSprint.push(userStory);
      } else {
        backlog.push(userStory);
      }
    });
    setCurrentSprintStories(currentSprint);
    setBacklogStories(backlog);
  }, [userStories]);

  const fetchUserStories = async (projectID) => {
    try {
      const response = await Axios.post('http://localhost:3001/listUserStories', { projectID }, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });

      if (response.data.success) {
        setUserStories(response.data.userStories);
      }
    } catch (error) {
      console.error('Error fetching user stories list:', error);
    }
  };

  const handleOpenUserStoryDialog = (userStory) => {
    setSelectedUserStory(userStory);
    setOpenUserStoryDialog(true);
  };

  const handleCloseUserStoryDialog = (tempAcceptanceCriteria, assignedSprint) => {
    setOpenUserStoryDialog(false);

    // Update acceptance criteria when dialog is closed
    if ((tempAcceptanceCriteria && tempAcceptanceCriteria.length > 0)) {
      updateAcceptanceCriteria(tempAcceptanceCriteria);
    }
    if (assignedSprint && (assignedSprint !== selectedUserStory.assignedSprint)) {
      updateAssignedSprint(assignedSprint);
    }

    setSelectedUserStory(null);
  };

  const updateAssignedSprint = async (assignedSprint) => {
    const projectID = sessionStorage.getItem('currentProjectID');
    try {
      const response = await Axios.post('http://localhost:3001/updateSprint', {
        userStoryID: selectedUserStory.id,
        assignedSprint,
        projectID
      }, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });

      if (response.data.success) {
        console.log('Sprint updated successfully.');
      } else {
        console.error('Error updating sprint:', response.data.message);
      }
    } catch (error) {
      console.error('Error updating sprint:', error);
    }
  };

  const updateAcceptanceCriteria = async (tempAcceptanceCriteria) => {
    const projectID = sessionStorage.getItem('currentProjectID');
    try {
      const response = await Axios.post('http://localhost:3001/addAC', {
        userStoryID: selectedUserStory.id,
        projectID,
        acceptanceCriteria: tempAcceptanceCriteria,
      }, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });

      if (response.data.success) {
        console.log('Acceptance criteria updated successfully.');
      } else {
        console.error('Error updating acceptance criteria:', response.data.message);
      }
    } catch (error) {
      console.error('Error updating acceptance criteria:', error);
    }
  };

  const handleCreateNewUserStory = () => {
    setShowCreateUserStoryForm(true);
  };

  const onCloseCreateForm = () => {
    setShowCreateUserStoryForm(false);
  };

  const onSaveForm = (newUserStory) => {
    if (newUserStory) {
      setUserStories([...userStories, newUserStory]);
    }
  };

  const handleDeleteUserStory = (id) => {
    setUserStoryToDelete(id);
    setConfirmationDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await Axios.post('http://localhost:3001/deleteUserStory', { userStoryToDelete }, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });

      if (response.data.success) {
        setUserStories(userStories.filter((story) => story.id !== userStoryToDelete));
      }
    } catch (error) {
      console.error('Error deleting user story:', error);
    }
    setUserStoryToDelete(null);
    setConfirmationDialogOpen(false);
  };

  const handleCloseConfirmationDialog = () => {
    setUserStoryToDelete(null);
    setConfirmationDialogOpen(false);
  };

  const theme = useTheme();
  return (
    <div>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
        }}
      >
        <TopBar
          completed={30}
          inProgress={40}
          title="Product Backlog"
          onUpdateTheme={onUpdateTheme}
        />
      </Box>
      <Box sx={{ display: 'flex', mt: 10 }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 10 }}>
          <Typography variant="h4" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.text.secondary }}>
            Current Sprint
          </Typography>
          <Grid container spacing={2}>
            {currentSprintStories.map((userStory) => (
              <Grid item xs={12} key={userStory.id}>
                <Card
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between', // Ensure the elements are evenly spaced
                    alignItems: 'center',
                    padding: '8px 16px',
                    margin: '0px 0',
                    background: userStory.unfinishedTaskCount === 0 ? 'green' : 'grey', // Conditionally set background color
                    color: 'white',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleOpenUserStoryDialog(userStory)}
                >
                  <Typography variant="subtitle1" noWrap>
                    {userStory.title}
                  </Typography>
                  {userStory.unfinishedTaskCount === 0 && ( // Render an icon if there are no unfinished tasks
                    <CheckCircleIcon sx={{ ml: 'auto' }} />
                  )}
                  <IconButton
                    sx={{ color: 'white' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUserStory(userStory.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Typography variant="h4" gutterBottom sx={{ mt: 4, mb: 2, color: theme.palette.text.secondary }}>
            Backlog
          </Typography>
          <Grid container spacing={2}>
            {backlogStories.map((userStory) => (
              <Grid item xs={12} key={userStory.id}>
                <Card
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between', // Ensure the elements are evenly spaced
                    alignItems: 'center',
                    padding: '8px 16px',
                    margin: '0px 0',
                    background: userStory.unfinishedTaskCount === 0 ? 'green' : 'grey', // Conditionally set background color
                    color: 'white',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleOpenUserStoryDialog(userStory)}
                >
                  <Typography variant="subtitle1" noWrap>
                    {userStory.title}
                  </Typography>
                  {userStory.unfinishedTaskCount === 0 && ( // Render an icon if there are no unfinished tasks
                    <CheckCircleIcon sx={{ ml: 'auto' }} />
                  )}
                  <IconButton
                    sx={{ color: 'white' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteUserStory(userStory.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
            {permission === '4' && ( // Check if permission is 4
              <Tooltip title="Create new user story">
                <Button
                  variant="contained"
                  startIcon={<AddCircleIcon />}
                  onClick={handleCreateNewUserStory}
                  sx={{ bgcolor: theme.palette.text.secondary, color: theme.palette.primary.main }}
                >
                  New User Story
                </Button>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>
      {/* User Story Detail Dialog */}
      {selectedUserStory && (
        <UserStoryDetailDialog
          open={openUserStoryDialog}
          onClose={handleCloseUserStoryDialog}
          userStory={selectedUserStory}
        />
      )}
      {/* Create User Story Form */}
      {showCreateUserStoryForm && (
        <CreateUserStoryForm
          open={showCreateUserStoryForm}
          onClose={onCloseCreateForm}
          onSave={onSaveForm}
        />
      )}
      {/* Confirmation Dialog for Deleting User Story */}
      <ConfirmationDialog
        open={confirmationDialogOpen}
        onClose={handleCloseConfirmationDialog}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default ProductBacklog;