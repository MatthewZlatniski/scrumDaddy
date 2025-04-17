import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Typography, List, ListItem, ListItemText, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Axios from 'axios';
import ClearIcon from '@mui/icons-material/Clear';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/system';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

function CreateProjectDialog({ open, onClose, onUpdateTheme }) {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [errorStatus, setErrorStatus] = useState('');
  const [projError, setProjError] = useState('');
  const [collaboratorPermission, setCollaboratorPermission] = useState('Developer');
  const [numberOfSprints, setNumberOfSprints] = useState(1);
  const [sprintDuration, setSprintDuration] = useState(2);
  const [startDate, setStartDate] = useState(null);
  const [calerrorStatus, setCalerrorStatus] = useState('');

  const handleRemoveCollaborator = (indexToRemove) => {
    const updatedCollaborators = collaborators.filter((collaborator, index) => index !== indexToRemove);
    setCollaborators(updatedCollaborators);
  };


  const handleSendInvite = async (e) => {
    if (collaboratorEmail) {
      const isAlreadyAdded = collaborators.some(collaborator => collaborator.email === collaboratorEmail);

      if (isAlreadyAdded) {
        setErrorStatus("Collaborator has already been added.");
      } else {
        // check that it's valid before adding it
        const authToken = sessionStorage.getItem('authToken');
        const response = await Axios.post('http://localhost:3001/checkInv', { collaboratorEmail }, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }).then((response) => {
          if (response.data.success) {
            console.log("Server responded with a message:", response.data.message);
            setCollaborators([...collaborators, { email: collaboratorEmail, permission: collaboratorPermission }]);
            setCollaboratorPermission('');
            setCollaboratorEmail('');
            setErrorStatus('');
          } else {
            console.log("Server responded with a message:", response.data.message);
            setErrorStatus(response.data.message);
          }
        });
      }
    } else {
      setErrorStatus("Collaborator email is required.");
    }
  };

  /* submits new project data for the server to add to database */
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    let sprintEvents = generateSprintEvents(startDate, numberOfSprints, sprintDuration);
    const projectData = {
      projectName,
      projectDescription,
      collaborators,
      startDate,
      numberOfSprints,
      sprintDuration,
      sprintEvents
    };

    console.log(startDate);
    if (startDate === '') {
      setCalerrorStatus("Please Select a Start Date.");
      return;
    }
    else {

      // send the request to store the new data in the database along with the auth token in the header
      const authToken = sessionStorage.getItem('authToken');
      try {

        const response = await Axios.post('http://localhost:3001/addProject', projectData, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }).then((response) => {
          if(response.data.success) {
            console.log("Server responded with a message:", response.data.message);
            console.log(response.data.message);
            setProjectName('');
            setProjectDescription('');
            setCollaboratorEmail('');
            setProjError('');
            setCollaborators([]);
            setCollaboratorPermission('Developer');


            onClose(); // Reset form and close dialog

            window.location.reload();
          } else {
            console.log("Server responded with a message:", response.data.message);
            setProjError(response.data.message);
          }
        });

      } catch (error) {
        console.error('error adding the project:', error);
      }
    }
  };

  const handleStartDateChange = (event) => {
    const selectedDate = event.target.value;
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    if (selectedDate >= todayFormatted) {
      setStartDate(selectedDate);
      setCalerrorStatus(''); // Reset error status if date is valid
    } else {
      setStartDate('');
      setCalerrorStatus('Start date cannot be before today.'); // Show error message if date is invalid
    }
  };

  const handleCloseDialog = () => {
      onClose();
    setProjectName('');
    setProjectDescription('');
    setCollaboratorEmail('');
    setCollaborators([]);
    setNumberOfSprints(1);
    setSprintDuration(2);
    setCalerrorStatus('');
    setStartDate('');
    setCollaboratorPermission('Developer');
  }

  function generateSprintEvents(startDate, numberOfSprints, sprintDuration) {
    let events = [];
    let startDateObj = new Date(startDate);
    let endDateObj = new Date(startDate);
    for (let i = 0; i < numberOfSprints; i++) {
        let sprintStart = moment(startDateObj).add(1,'days').format('YYYY-MM-DD');
        let sprintEnd = moment(endDateObj).add(sprintDuration, 'weeks').format('YYYY-MM-DD');
        sprintEnd = moment(sprintEnd).add(1,'days').format('YYYY-MM-DD');
        events.push({
            id: uuidv4(),
            title: `Sprint ${i + 1} Start`,
            start: sprintStart,
            end: sprintStart,
            allDay: true,
        });
        events.push({
            id: uuidv4(),
            title: `Sprint ${i + 1} End`,
            start: sprintEnd,
            end: sprintEnd,
            allDay: true,
        });
        startDateObj = new Date(sprintEnd);
        endDateObj = new Date(sprintEnd);

        }
    return events;
  }
  

  const theme = useTheme();
  return (
    <Dialog open={open} onClose={handleCloseDialog} aria-labelledby="form-dialog-title" maxWidth="xl" sx={{'& .MuiDialog-paper': { backgroundColor: theme.palette.primary.main, width: '45%', } }}>
      <DialogTitle id="form-dialog-title" color='text.primary'>Add New Project</DialogTitle>
      <DialogContent>
        {projError && (
          <Typography color="text.primary">{projError}</Typography>
        )}
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Project Name"
          type="text"
          fullWidth
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          sx={{
            '& label.Mui-focused': {
              color: 'text.primary', // Set focused label color
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'text.primary', // Set outline color
              },
              '&:hover fieldset': {
                borderColor: 'text.primary', // Set hover outline color
              },
              '&.Mui-focused fieldset': {
                borderColor: 'text.primary', // Set focused outline color
              },
            },
            '& .MuiInputBase-input': {
              color: 'text.primary', // Set input text color
            }, 
          }}
        />
        <TextField
          margin="dense"
          id="description"
          label="Project Description"
          type="text"
          fullWidth
          multiline
          rows={4}
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          sx={{
            '& label.Mui-focused': {
              color: 'text.primary', // Set focused label color
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'text.primary', // Set outline color
              },
              '&:hover fieldset': {
                borderColor: 'text.primary', // Set hover outline color
              },
              '&.Mui-focused fieldset': {
                borderColor: 'text.primary', // Set focused outline color
              },
            },
            '& .MuiInputBase-input': {
              color: 'text.primary', // Set input text color
            },
          }}
        />
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', marginY: 2 }}>
        <TextField
          margin="dense"
          id="collaboratorEmail"
          label="Invite Collaborators"
          type="email"
          fullWidth
          value={collaboratorEmail}
          onChange={(e) => setCollaboratorEmail(e.target.value)}
          placeholder="Enter a collaborator's email"
          sx={{
            '& label.Mui-focused': {
              color: 'text.primary', // Set focused label color
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'text.primary', // Set outline color
              },
              '&:hover fieldset': {
                borderColor: 'text.primary', // Set hover outline color
              },
              '&.Mui-focused fieldset': {
                borderColor: 'text.primary', // Set focused outline color
              },
            },
            '& .MuiInputBase-input': {
              color: 'text.primary', // Set input text color
            },
          }}
        />
        <Typography sx={{color: theme.palette.text.primary}}>as</Typography>
        <FormControl sx={{ minWidth: '25%',
            '& label.Mui-focused': {
              color: 'text.primary', // Set focused label color
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'text.primary', // Set outline color
              },
              '&:hover fieldset': {
                borderColor: 'text.primary', // Set hover outline color
              },
              '&.Mui-focused fieldset': {
                borderColor: 'text.primary', // Set focused outline color
              },
            },
            '& .MuiInputBase-input': {
              color: 'text.primary', // Set input text color
            }, 
          }}>
      <InputLabel id="permission-select-label">Permission</InputLabel>
      <Select
        labelId="permission-select-label"
        id="collaboratorPermission"
        value={collaboratorPermission}
        label="Permission"
        onChange={(e) => setCollaboratorPermission(e.target.value)}
        MenuProps={{
          MenuListProps: {
            sx: {
              backgroundColor: theme.palette.primary.main,
            },
          },
        }}
      >
        <MenuItem value="Owner">Owner</MenuItem>
        <MenuItem value="Scrum Master">Scrum Master</MenuItem>
        <MenuItem value="Developer">Developer</MenuItem>
      </Select>
    </FormControl>
  </Box>
        {errorStatus && (
          <Typography color="text.primary">{errorStatus}</Typography>
        )}
        <Button sx={{ bgcolor: theme.palette.secondary.main, color: theme.palette.text.primary, '&:hover': {bgcolor: theme.palette.secondary.main,},}} onClick={handleSendInvite} color='primary'>
          Send Invite
        </Button>
        {collaborators.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ color: theme.palette.text.primary }}>Invited Collaborators:</Typography>
            <List>
              {collaborators.map((collaborator, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center', color: theme.palette.text.primary }}>
                  <IconButton onClick={() => handleRemoveCollaborator(index)}>
                    <ClearIcon sx={{ color: 'red' }}/>
                  </IconButton >
                  <ListItemText primary={`${collaborator.email} as ${collaborator.permission}`} />
                </Box>
              ))}
            </List>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', marginY: 2 }}>
          <TextField
            margin="dense"
            id="numberOfSprints"
            label="Number of Sprints"
            type="number"
            fullWidth
            value={numberOfSprints}
            onChange={(e) => setNumberOfSprints(parseInt(e.target.value))}
            inputProps={{ min: 1, max: 5 }}
            sx={{
              '& label.Mui-focused': {
                color: 'text.primary', // Set focused label color
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'text.primary', // Set outline color
                },
                '&:hover fieldset': {
                  borderColor: 'text.primary', // Set hover outline color
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'text.primary', // Set focused outline color
                },
              },
              '& .MuiInputBase-input': {
                color: 'text.primary', // Set input text color
              },
            }}
          />
          <TextField
            margin="dense"
            id="sprintDuration"
            label="Sprint Duration (Weeks)"
            type="number"
            fullWidth
            value={sprintDuration}
            onChange={(e) => setSprintDuration(parseInt(e.target.value))}
            inputProps={{ min: 2, max: 4 }}
            sx={{
              '& label.Mui-focused': {
                color: 'text.primary', // Set focused label color
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'text.primary', // Set outline color
                },
                '&:hover fieldset': {
                  borderColor: 'text.primary', // Set hover outline color
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'text.primary', // Set focused outline color
                },
              },
              '& .MuiInputBase-input': {
                color: 'text.primary', // Set input text color
              },
            }}
          />
        </Box>
        {/* Start Date Picker */}
        <TextField
          margin="dense"
          id="startDate"
          label="Project Start Date"
          type="date"
          fullWidth
          value={startDate}
          onChange={handleStartDateChange}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{
            '& label.Mui-focused': {
              color: 'text.primary', // Set focused label color
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'text.primary', // Set outline color
              },
              '&:hover fieldset': {
                borderColor: 'text.primary', // Set hover outline color
              },
              '&.Mui-focused fieldset': {
                borderColor: 'text.primary', // Set focused outline color
              },
            },
            '& .MuiInputBase-input': {
              color: 'text.primary', // Set input text color
            },
          }}
        />
        {calerrorStatus && (
            <Typography color="text.primary">{calerrorStatus}</Typography>
          )}
      </DialogContent>
      <DialogActions>
        <Button sx={{ bgcolor: theme.palette.secondary.main, color: theme.palette.text.primary, '&:hover': {bgcolor: theme.palette.secondary.main,},}} onClick={handleCloseDialog} color="secondary">Cancel</Button>
        <Button sx={{ bgcolor: theme.palette.secondary.main, color: theme.palette.text.primary, '&:hover': {bgcolor: theme.palette.secondary.main,},}} color="secondary" onClick={handleFormSubmit}>Add Project</Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateProjectDialog;
