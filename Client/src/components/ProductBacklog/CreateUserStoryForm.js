import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, Grid, Typography, List, ListItem, ListItemText, TextField,Select, Button, Box, MenuItem} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Axios from 'axios';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useTheme } from '@mui/system';

function CreateUserStoryForm({ open, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newAcceptanceCriteria, setNewAcceptanceCriteria] = useState('');
  const [acceptanceCriteriaList, setAcceptanceCriteriaList] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const theme = useTheme();

  useEffect(() => {
    const projectID = sessionStorage.getItem('currentProjectID');
    if (projectID) {
      fetchSprints(projectID);
    }
  }, []);

  const fetchSprints = async(projectID) => {

    try {
      const response = await Axios.post('http://localhost:3001/getSprints', {projectID}, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
      });

      if (response.data.success) {
        setSprints(response.data.fetchedSprints);
      }
      else {
        console.log("error listing sprints.");
        setErrorMessage(response.data.message);
      }
    } catch (error) {
      console.error('Error listing sprints:', error);
      // Handle error - show error message or take appropriate action
    }

  };


  const handleSave = async() => {
    if (title.trim() === '' || description.trim() === '') {
      setErrorMessage('Title and Description cannot be empty');
      return;
    }
    else if (acceptanceCriteriaList.length === 0) {
      setErrorMessage('At least one acceptance criteria must be added');
      return;
    }
    else if (!selectedSprint) {
      setErrorMessage('Please select a sprint');
      return;
    }
    else {

      setErrorMessage('');
      const projectID = sessionStorage.getItem('currentProjectID');

      // Create the new user story
      const newUserStory = {
        title: title,
        description: description,
        acceptanceCriteria: acceptanceCriteriaList,
        projectID,
        assignedSprint: selectedSprint,
      };

      try {
        const response = await Axios.post('http://localhost:3001/addUserStory', newUserStory, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
          },
        });

        if (response.data.success) {
          newUserStory.id = response.data.id;
          newUserStory.tasks = response.data.tasks;
          setTitle('');
          setDescription('');
          setAcceptanceCriteriaList([]);
          onSave(newUserStory)
          onClose();
        }
        else {
          console.log("error adding User Story.");
          setErrorMessage(response.data.message);
        }
      } catch (error) {
        console.error('Error saving User Story:', error);
        // Handle error - show error message or take appropriate action
      }
    }
  };

  const localTheme = createTheme({
    palette: {
      text: {
        primary: '#000', // Replace with your desired color value
      },
      primary: {
        main: "#333333"
      }
    },
  });

  const handleAddAcceptanceCriteria = () => {
    if (newAcceptanceCriteria.trim() !== '') {
      setAcceptanceCriteriaList([...acceptanceCriteriaList, newAcceptanceCriteria.trim()]);
      setNewAcceptanceCriteria('');
    }
  };

  return (
    <ThemeProvider theme={localTheme}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Create User Story</Typography>
            <Button onClick={onClose} startIcon={<CloseIcon />} />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                variant="outlined"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                variant="outlined"
                multiline
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Select
                fullWidth
                value={selectedSprint}
                onChange={(e) => setSelectedSprint(e.target.value)}
                displayEmpty
                variant="outlined"
              >
                <MenuItem value="" disabled>
                  Select Sprint
                </MenuItem>
                {sprints.map((sprint) => (
                  <MenuItem key={sprint.id} value={sprint.id}>{sprint.name}</MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12}>
              <List disablePadding>
                <Typography variant="h6" gutterBottom>
                  Acceptance Criteria
                </Typography>
                {acceptanceCriteriaList.map((criteria, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={criteria} />
                  </ListItem>
                ))}
                <ListItem>
                  <TextField
                    fullWidth
                    label="Add Acceptance Criteria"
                    variant="outlined"
                    value={newAcceptanceCriteria}
                    onChange={(e) => setNewAcceptanceCriteria(e.target.value)}
                  />
                  <Button onClick={handleAddAcceptanceCriteria} variant="contained" color="primary">
                    Add
                  </Button>
                </ListItem>
              </List>
              {errorMessage && (
                <Typography color="error" sx={{ mt: 2 }}>{errorMessage}</Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <Box p={2} display="flex" justifyContent="flex-end" >
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </Box>
      </Dialog>
    </ThemeProvider>
  );
}

export default CreateUserStoryForm;