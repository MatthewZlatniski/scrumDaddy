import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Box,
  Divider,
  Select,
  MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Axios from 'axios';

// Define the UserStoryDetailDialog component
function UserStoryDetailDialog({ open, onClose, userStory }) {
  console.log(userStory);
  const [newAcceptanceCriteria, setNewAcceptanceCriteria] = useState('');
  const [acceptanceCriteriaList, setAcceptanceCriteriaList] = useState(userStory.acceptanceCriteria || []);
  const [sprints, setSprints] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState(userStory.assignedSprint || ''); // Initialize selected sprint with user story's sprint
  const [tempAcceptanceCriteria, setTempAcceptanceCriteria] = useState([]); // Temporary acceptance criteria

  const permission = sessionStorage.getItem('userPerm');

  // Create a local theme
  const localTheme = createTheme({
    palette: {
      text: {
        primary: '#000',
      },
      primary: {
        main: "#333333"
      }
    },
  });

  useEffect(() => {
    // Fetch sprints when the component mounts
    fetchSprints();
  }, []);

  const fetchSprints = async () => {
    const projectID = sessionStorage.getItem('currentProjectID');

    try {
      const response = await Axios.post('http://localhost:3001/getSprints', { projectID }, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });

      if (response.data.success) {
        setSprints(response.data.fetchedSprints);
      } else {
        console.log("error listing sprints.");
      }
    } catch (error) {
      console.error('Error listing sprints:', error);
    }
  };

  // Function to handle saving user story details
  const handleSave = async () => {
    console.log('Saving user story details');
    // Pass the updated acceptance criteria to onClose
    onClose(tempAcceptanceCriteria, selectedSprint);
    window.location.reload();
  };

  // Function to handle adding acceptance criteria
  const handleAddAcceptanceCriteria = async () => {
    console.log("add ac");
    // send new acceptance criteria to the list
    if (newAcceptanceCriteria.trim() !== '') {
      setTempAcceptanceCriteria([...tempAcceptanceCriteria, newAcceptanceCriteria.trim()]);
      setAcceptanceCriteriaList([...acceptanceCriteriaList, newAcceptanceCriteria.trim()]);
      setNewAcceptanceCriteria('');
    }
  };

  // Function to handle changing the sprint
  const handleChangeSprint = (sprintId) => {
    setSelectedSprint(sprintId);
  };

  // Return the UI of the component
  return (
    <ThemeProvider theme={localTheme}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" sx={{ '& .MuiDialog-paper': { borderRadius: 2, minWidth: '600px' } }}>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'common.white', py: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mx: 2 }}>
            <Typography variant="h6">{userStory.title}</Typography>
            <Button onClick={onClose} color="inherit" size="small" startIcon={<CloseIcon />}>Close</Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Left Column */}
            <Grid item xs={12} md={6}>
              <Typography variant="h5" sx={{ mb: 3, color: 'black' }}>
                User Story Details
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Description:
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {userStory.description}
              </Typography>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} md={6}>
              <List disablePadding>
                <ListItem><Typography variant="h6">Acceptance Criteria:</Typography></ListItem>
                <ListItem>
                  {/* Use a Grid container with a single column layout */}
                  <Grid container direction="column">
                    {acceptanceCriteriaList.map((criteria, index) => (
                      <Grid item key={index}>
                        <ListItemText primary={criteria} />
                      </Grid>
                    ))}
                  </Grid>
                </ListItem>
                {permission === '4' && ( // Check if permission is 4
                  <ListItem>
                    <TextField
                      fullWidth
                      label="Add Acceptance Criteria"
                      variant="outlined"
                      value={newAcceptanceCriteria}
                      onChange={(e) => setNewAcceptanceCriteria(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddAcceptanceCriteria();
                        }
                      }}
                    />
                    <Button onClick={handleAddAcceptanceCriteria} variant="contained" color="primary" sx={{ ml: 1 }}>
                      Add
                    </Button>
                  </ListItem>
                )}
                <ListItem>
                  <Typography variant="h6">Select Sprint:</Typography>
                  <Box ml={1} sx={{ width: '200px' }}> {/* Add margin to separate the label and the Select */}
                    <Select
                      value={selectedSprint}
                      onChange={(e) => handleChangeSprint(e.target.value)}
                      fullWidth
                    >
                      {sprints.map((sprint) => (
                        <MenuItem key={sprint.id} value={sprint.id}>{sprint.name}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                </ListItem>
              </List>
            </Grid>
            <List sx={{ display: 'flex', alignContent: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: '10px' }}>
              <ListItem sx={{}}><Typography variant="h6">Tasks:</Typography></ListItem>
              <ListItemText > </ListItemText>
              {userStory.tasks.map((task, index) => (
                <ListItemText key={index} primary={task.name} />
              ))}
            </List>
          </Grid>
        </DialogContent>
        {permission === '4' && ( // Check if permission is 4
          <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleSave} variant="contained" color="primary" sx={{ textTransform: 'none', mr: 1 }}>
              Save Changes
            </Button>
          </Box>
        )}
      </Dialog>
    </ThemeProvider>
  );
}

export default UserStoryDetailDialog;